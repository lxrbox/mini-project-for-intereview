import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  createDeposit,
  getUserBalance,
  placeBet,
  settleBet,
} from "../betting-service";

const prisma = new PrismaClient();

describe("betting-service", () => {
  let userId = "";

  beforeEach(async () => {
    await prisma.ledgerEntry.deleteMany();
    await prisma.bet.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: `u-${Date.now()}@example.com`,
        displayName: "Test User",
      },
    });

    userId = user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects bet amount less than or equal to zero", async () => {
    await expect(placeBet(userId, 0)).rejects.toMatchObject({
      code: "INVALID_AMOUNT",
    });
  });

  it("rejects bet that exceeds current balance", async () => {
    await expect(placeBet(userId, 100)).rejects.toMatchObject({
      code: "INSUFFICIENT_BALANCE",
    });
  });

  it("places a bet and writes BET_DEBIT entry", async () => {
    await createDeposit(userId, 300);

    const placed = await placeBet(userId, 120);

    expect(placed.bet.amount).toBe(120);
    expect(placed.bet.status).toBe("PLACED");

    const entries = await prisma.ledgerEntry.findMany({ where: { userId } });
    expect(entries).toHaveLength(2);
    expect(entries.filter((entry) => entry.type === "BET_DEBIT")).toHaveLength(1);

    const balance = await getUserBalance(userId);
    expect(balance).toBe(180);
  });

  it("settles WIN bet with 2x payout credit", async () => {
    await createDeposit(userId, 500);
    const placed = await placeBet(userId, 200);

    const settled = await settleBet(placed.bet.id, "WIN");

    expect(settled.bet.status).toBe("SETTLED");
    expect(settled.bet.result).toBe("WIN");
    expect(settled.bet.payoutAmount).toBe(400);

    const balance = await getUserBalance(userId);
    expect(balance).toBe(700);
  });

  it("prevents settling the same bet twice", async () => {
    await createDeposit(userId, 400);
    const placed = await placeBet(userId, 100);

    await settleBet(placed.bet.id, "LOSE");

    await expect(settleBet(placed.bet.id, "WIN")).rejects.toMatchObject({
      code: "BET_NOT_PLACED",
    });
  });
});
