import { BetResult, LedgerType, Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { DomainError } from "./errors";

async function ensureUserExists(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    throw new DomainError("USER_NOT_FOUND", "用户不存在。");
  }
}

function assertPositiveAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new DomainError("INVALID_AMOUNT", "金额必须是大于 0 的整数。");
  }
}

async function getUserBalanceInTx(tx: Prisma.TransactionClient, userId: string): Promise<number> {
  const grouped = await tx.ledgerEntry.groupBy({
    by: ["type"],
    where: { userId },
    _sum: { amount: true },
  });

  return grouped.reduce((acc, item) => {
    const amount = item._sum.amount ?? 0;
    if (item.type === "DEPOSIT" || item.type === "BET_CREDIT") {
      return acc + amount;
    }
    return acc - amount;
  }, 0);
}

export async function getUserBalance(userId: string): Promise<number> {
  return prisma.$transaction(async (tx) => {
    await ensureUserExists(tx, userId);
    return getUserBalanceInTx(tx, userId);
  });
}

export async function createDeposit(userId: string, amount: number) {
  assertPositiveAmount(amount);

  return prisma.$transaction(async (tx) => {
    await ensureUserExists(tx, userId);

    await tx.ledgerEntry.create({
      data: {
        userId,
        type: LedgerType.DEPOSIT,
        amount,
      },
    });

    const balance = await getUserBalanceInTx(tx, userId);

    return { balance };
  });
}

export async function placeBet(userId: string, amount: number) {
  assertPositiveAmount(amount);

  return prisma.$transaction(async (tx) => {
    await ensureUserExists(tx, userId);

    const balance = await getUserBalanceInTx(tx, userId);
    if (amount > balance) {
      throw new DomainError("INSUFFICIENT_BALANCE", "下注金额超过当前余额。");
    }

    await tx.ledgerEntry.create({
      data: {
        userId,
        type: LedgerType.BET_DEBIT,
        amount,
      },
    });

    const bet = await tx.bet.create({
      data: {
        userId,
        amount,
      },
    });

    return {
      bet,
      balance: balance - amount,
    };
  });
}

export async function settleBet(betId: string, result: BetResult) {
  if (result !== "WIN" && result !== "LOSE") {
    throw new DomainError("INVALID_RESULT", "结算结果必须为 WIN 或 LOSE。");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.bet.findUnique({ where: { id: betId } });
    if (!existing) {
      throw new DomainError("BET_NOT_FOUND", "投注记录不存在。");
    }

    const payoutAmount = result === "WIN" ? existing.amount * 2 : 0;

    const updated = await tx.bet.updateMany({
      where: {
        id: betId,
        status: "PLACED",
      },
      data: {
        status: "SETTLED",
        result,
        payoutAmount,
      },
    });

    if (updated.count === 0) {
      throw new DomainError("BET_NOT_PLACED", "仅支持结算状态为 PLACED 的投注。");
    }

    if (payoutAmount > 0) {
      await tx.ledgerEntry.create({
        data: {
          userId: existing.userId,
          type: LedgerType.BET_CREDIT,
          amount: payoutAmount,
        },
      });
    }

    const bet = await tx.bet.findUnique({ where: { id: betId } });
    if (!bet) {
      throw new DomainError("BET_NOT_FOUND", "投注记录不存在。");
    }

    const balance = await getUserBalanceInTx(tx, existing.userId);

    return {
      bet,
      balance,
    };
  });
}

export async function getUsersWithBalance() {
  const [users, grouped] = await Promise.all([
    prisma.user.findMany({
      orderBy: { displayName: "asc" },
      select: { id: true, email: true, displayName: true },
    }),
    prisma.ledgerEntry.groupBy({
      by: ["userId", "type"],
      _sum: { amount: true },
    }),
  ]);

  const score = new Map<string, number>();

  for (const row of grouped) {
    const current = score.get(row.userId) ?? 0;
    const amount = row._sum.amount ?? 0;
    const delta = row.type === "BET_DEBIT" ? -amount : amount;
    score.set(row.userId, current + delta);
  }

  return users.map((user) => ({
    ...user,
    balance: score.get(user.id) ?? 0,
  }));
}

export async function getUserGameSnapshot(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, displayName: true },
  });

  if (!user) {
    throw new DomainError("USER_NOT_FOUND", "用户不存在。");
  }

  const [balance, bets] = await Promise.all([
    getUserBalance(userId),
    prisma.bet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    user,
    balance,
    bets,
  };
}
