"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Bet = {
  id: string;
  amount: number;
  status: "PLACED" | "SETTLED";
  result: "WIN" | "LOSE" | null;
  payoutAmount: number;
  createdAt: string;
};

type Snapshot = {
  user: {
    id: string;
    displayName: string;
    email: string;
  };
  balance: number;
  bets: Bet[];
};

const amountFormatter = new Intl.NumberFormat("zh-CN");
const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
const quickBetAmounts = [50, 100, 200, 500, 1000];

function parsePositiveInteger(value: string): number | null {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount <= 0) {
    return null;
  }
  return amount;
}

export function GameDashboard({ userId }: { userId: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [betAmount, setBetAmount] = useState("100");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [placingBet, setPlacingBet] = useState(false);
  const [settlingBetId, setSettlingBetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSnapshot(options?: { background?: boolean }) {
    if (options?.background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const resp = await fetch(`/api/users/${userId}/bets`, { cache: "no-store" });
      const body = (await resp.json()) as Snapshot & { message?: string };

      if (!resp.ok) {
        throw new Error(body.message ?? "加载游戏数据失败");
      }

      setSnapshot(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载游戏数据失败");
    } finally {
      if (options?.background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  async function handlePlaceBet() {
    const parsedAmount = parsePositiveInteger(betAmount);
    if (parsedAmount === null) {
      setError("下注金额必须是大于 0 的整数。");
      return;
    }

    setPlacingBet(true);
    setError(null);

    try {
      const resp = await fetch(`/api/users/${userId}/bets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount }),
      });

      const body = (await resp.json()) as { message?: string };

      if (!resp.ok) {
        throw new Error(body.message ?? "下注失败");
      }

      await loadSnapshot({ background: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "下注失败");
    } finally {
      setPlacingBet(false);
    }
  }

  async function handleSettle(betId: string, result: "WIN" | "LOSE") {
    setSettlingBetId(betId);
    setError(null);

    try {
      const resp = await fetch(`/api/bets/${betId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });

      const body = (await resp.json()) as { message?: string };
      if (!resp.ok) {
        throw new Error(body.message ?? "结算失败");
      }

      await loadSnapshot({ background: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "结算失败");
    } finally {
      setSettlingBetId(null);
    }
  }

  useEffect(() => {
    loadSnapshot();
  }, [userId]);

  const gameStats = useMemo(() => {
    if (!snapshot) {
      return {
        total: 0,
        active: 0,
        settled: 0,
        wins: 0,
        losses: 0,
        totalAmount: 0,
        totalPayout: 0,
        pendingAmount: 0,
      };
    }

    const total = snapshot.bets.length;
    const active = snapshot.bets.filter((bet) => bet.status === "PLACED").length;
    const settledBets = snapshot.bets.filter((bet) => bet.status === "SETTLED");
    const wins = settledBets.filter((bet) => bet.result === "WIN").length;
    const losses = settledBets.filter((bet) => bet.result === "LOSE").length;
    const totalAmount = snapshot.bets.reduce((sum, bet) => sum + bet.amount, 0);
    const totalPayout = snapshot.bets.reduce((sum, bet) => sum + bet.payoutAmount, 0);
    const pendingAmount = snapshot.bets
      .filter((bet) => bet.status === "PLACED")
      .reduce((sum, bet) => sum + bet.amount, 0);

    return {
      total,
      active,
      settled: total - active,
      wins,
      losses,
      totalAmount,
      totalPayout,
      pendingAmount,
    };
  }, [snapshot]);

  const parsedBetAmount = useMemo(() => parsePositiveInteger(betAmount), [betAmount]);
  const hasInvalidBetAmount = betAmount.trim().length > 0 && parsedBetAmount === null;
  const potentialPayout = parsedBetAmount ? parsedBetAmount * 2 : null;
  const winRate = gameStats.settled > 0 ? Math.round((gameStats.wins / gameStats.settled) * 100) : 0;
  const activeBets = useMemo(
    () => snapshot?.bets.filter((bet) => bet.status === "PLACED").slice(0, 6) ?? [],
    [snapshot],
  );
  const hasMoreActiveBets = (snapshot?.bets.filter((bet) => bet.status === "PLACED").length ?? 0) > activeBets.length;
  const activeSettling = settlingBetId !== null;

  return (
    <main className="stack dashboard-shell game-dashboard-shell">
      <section className="card dashboard-hero game-hero stack">
        <div className="row dashboard-header">
          <div className="stack compact-stack">
            <h1>投注面板</h1>
            <p className="muted">实时下注、待结算处理与胜率追踪。</p>
          </div>
          <Link className="button-link secondary-link" href="/users">
            返回用户列表
          </Link>
        </div>

        {snapshot ? (
          <div className="game-profile-strip">
            <div className="game-user-block">
              <span className="game-user-avatar">{snapshot.user.displayName.slice(0, 1).toUpperCase()}</span>
              <div className="stack compact-stack">
                <span className="muted">当前玩家</span>
                <strong>{snapshot.user.displayName}</strong>
                <span className="muted">{snapshot.user.email}</span>
              </div>
            </div>
            <div className="game-balance-block">
              <span className="muted">可用余额</span>
              <strong>{amountFormatter.format(snapshot.balance)}</strong>
              <span className="chip chip-balance">实时资金池</span>
            </div>
          </div>
        ) : null}

        {snapshot ? (
          <div className="dashboard-metrics game-metrics">
            <article className="metric-card">
              <span className="muted">投注概览</span>
              <strong>
                {gameStats.active} 待结算 / {gameStats.total} 总笔数
              </strong>
              <span className="muted">已结算 {gameStats.settled}</span>
            </article>
            <article className="metric-card">
              <span className="muted">胜率</span>
              <strong className="metric-number">{winRate}%</strong>
              <span className="muted">
                WIN {gameStats.wins} / LOSE {gameStats.losses}
              </span>
            </article>
            <article className="metric-card">
              <span className="muted">累计投注额</span>
              <strong className="metric-number">{amountFormatter.format(gameStats.totalAmount)}</strong>
              <span className="muted">累计返还 {amountFormatter.format(gameStats.totalPayout)}</span>
            </article>
            <article className="metric-card">
              <span className="muted">待结算本金</span>
              <strong className="metric-number">{amountFormatter.format(gameStats.pendingAmount)}</strong>
              <span className="chip chip-brand">风险敞口</span>
            </article>
          </div>
        ) : null}
      </section>

      <section className="card stack game-action-card">
        <div className="row dashboard-header">
          <h2 className="section-title no-bottom">下注区</h2>
          <span className="chip chip-brand">WIN = 2X 赔付</span>
        </div>
        <div className="game-action-grid">
          <div className="bet-controls">
            <label className="field-label" htmlFor="betAmount">
              下注金额
            </label>
            <div className="controls stretch-controls">
              <input
                id="betAmount"
                className="bet-amount-input"
                type="number"
                min={1}
                step={1}
                value={betAmount}
                onChange={(event) => {
                  setBetAmount(event.target.value);
                  if (error) {
                    setError(null);
                  }
                }}
              />
              <button
                className="primary strong-action"
                onClick={handlePlaceBet}
                disabled={placingBet || loading || refreshing || parsedBetAmount === null || activeSettling}
              >
                {placingBet ? "下注中..." : "立即下注"}
              </button>
            </div>
            <div className="quick-bet-group">
              {quickBetAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={`quick-bet-btn ${betAmount === String(amount) ? "is-active" : ""}`}
                  onClick={() => {
                    setBetAmount(String(amount));
                    if (error) {
                      setError(null);
                    }
                  }}
                >
                  {amountFormatter.format(amount)}
                </button>
              ))}
            </div>
            <div className="game-preview-line">
              <span className="muted">预计最高返还</span>
              <strong>{potentialPayout ? amountFormatter.format(potentialPayout) : "--"}</strong>
            </div>
            {hasInvalidBetAmount ? (
              <p className="error">请输入大于 0 的整数金额。</p>
            ) : (
              <p className="muted">建议额度：50 / 100 / 200 / 500 / 1000</p>
            )}
          </div>
          <aside className="game-rule-card">
            <h3>结算规则</h3>
            <p className="muted">1. 下注后状态为待结算。</p>
            <p className="muted">2. 结算 WIN 时返还投注额 2 倍。</p>
            <p className="muted">3. 结算 LOSE 时返还为 0。</p>
          </aside>
        </div>
      </section>

      {error ? <p className="status-banner error">{error}</p> : null}
      {loading ? <p className="status-banner muted-banner">加载中...</p> : null}
      {refreshing ? <p className="status-banner muted-banner">正在刷新数据...</p> : null}

      {activeBets.length > 0 ? (
        <section className="card stack">
          <div className="row dashboard-header">
            <h2 className="section-title no-bottom">待结算投注</h2>
            <span className="chip chip-brand">{gameStats.active} 笔待处理</span>
          </div>
          <div className="game-active-bets">
            {activeBets.map((bet) => (
              <article className="game-active-item" key={`active-${bet.id}`}>
                <div className="game-active-top">
                  <span className="status-pill status-open">待结算</span>
                  <span className="muted">{timeFormatter.format(new Date(bet.createdAt))}</span>
                </div>
                <strong className="metric-number">{amountFormatter.format(bet.amount)}</strong>
                <div className="controls stretch-controls">
                  <button
                    className="primary settle-win"
                    disabled={settlingBetId === bet.id || placingBet}
                    onClick={() => handleSettle(bet.id, "WIN")}
                  >
                    {settlingBetId === bet.id ? "处理中..." : "结算 WIN"}
                  </button>
                  <button
                    className="danger settle-lose"
                    disabled={settlingBetId === bet.id || placingBet}
                    onClick={() => handleSettle(bet.id, "LOSE")}
                  >
                    {settlingBetId === bet.id ? "处理中..." : "结算 LOSE"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {hasMoreActiveBets ? <p className="muted">仅展示最近 6 笔待结算记录，请在历史投注中查看完整列表。</p> : null}
        </section>
      ) : null}

      <section className="card">
        <h2 className="section-title">历史投注</h2>
        {!snapshot || snapshot.bets.length === 0 ? (
          <p className="muted">暂无投注记录。</p>
        ) : (
          <div className="table-scroll">
            <table className="table game-history-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>金额</th>
                  <th>状态</th>
                  <th>结果</th>
                  <th>赔付</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.bets.map((bet) => (
                  <tr key={bet.id}>
                    <td data-label="时间">{timeFormatter.format(new Date(bet.createdAt))}</td>
                    <td data-label="金额">{amountFormatter.format(bet.amount)}</td>
                    <td data-label="状态">
                      <span className={`status-pill ${bet.status === "PLACED" ? "status-open" : "status-done"}`}>
                        {bet.status === "PLACED" ? "待结算" : "已结算"}
                      </span>
                    </td>
                    <td data-label="结果">
                      {bet.result ? (
                        <span className={`result-pill ${bet.result === "WIN" ? "result-win" : "result-lose"}`}>
                          {bet.result === "WIN" ? "WIN" : "LOSE"}
                        </span>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                    <td data-label="赔付">{amountFormatter.format(bet.payoutAmount)}</td>
                    <td data-label="操作">
                      {bet.status === "PLACED" ? (
                        <div className="controls history-row-actions">
                          <button
                            className="primary settle-win"
                            disabled={settlingBetId === bet.id || placingBet}
                            onClick={() => handleSettle(bet.id, "WIN")}
                          >
                            {settlingBetId === bet.id ? "处理中..." : "结算 WIN"}
                          </button>
                          <button
                            className="danger settle-lose"
                            disabled={settlingBetId === bet.id || placingBet}
                            onClick={() => handleSettle(bet.id, "LOSE")}
                          >
                            {settlingBetId === bet.id ? "处理中..." : "结算 LOSE"}
                          </button>
                        </div>
                      ) : (
                        <span className="muted">已结算</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
