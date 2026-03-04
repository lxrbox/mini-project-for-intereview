"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type UserWithBalance = {
  id: string;
  email: string;
  displayName: string;
  balance: number;
};

const amountFormatter = new Intl.NumberFormat("zh-CN");

function parsePositiveInteger(value: string): number | null {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount <= 0) {
    return null;
  }
  return amount;
}

export function UsersDashboard() {
  const [users, setUsers] = useState<UserWithBalance[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const hasUsers = useMemo(() => users.length > 0, [users]);
  const totalBalance = useMemo(() => users.reduce((sum, user) => sum + user.balance, 0), [users]);
  const lowBalanceCount = useMemo(() => users.filter((user) => user.balance < 100).length, [users]);

  async function loadUsers(options?: { background?: boolean }) {
    if (options?.background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const resp = await fetch("/api/users", { cache: "no-store" });
      const body = (await resp.json()) as { users?: UserWithBalance[]; message?: string };

      if (!resp.ok) {
        throw new Error(body.message ?? "加载用户失败");
      }

      setUsers(body.users ?? []);
      setInputs((prev) => {
        const next = { ...prev };
        for (const user of body.users ?? []) {
          if (!next[user.id]) {
            next[user.id] = "";
          }
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载用户失败");
    } finally {
      if (options?.background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  async function handleDeposit(userId: string) {
    const amount = parsePositiveInteger(inputs[userId] ?? "");
    if (amount === null) {
      setError("充值金额必须是大于 0 的整数。");
      return;
    }

    setBusyUserId(userId);
    setError(null);

    try {
      const resp = await fetch(`/api/users/${userId}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const body = (await resp.json()) as { message?: string };
      if (!resp.ok) {
        throw new Error(body.message ?? "充值失败");
      }

      await loadUsers({ background: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "充值失败");
    } finally {
      setBusyUserId(null);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <main className="stack dashboard-shell">
      <section className="card dashboard-hero stack">
        <div className="row dashboard-header">
          <div className="stack compact-stack">
            <h1>玩家总览</h1>
            <p className="muted">统一管理余额、充值与游戏入口。</p>
          </div>
          <button className="secondary-btn" onClick={() => loadUsers({ background: true })} disabled={refreshing}>
            {refreshing ? "刷新中..." : "刷新列表"}
          </button>
        </div>

        <div className="dashboard-metrics">
          <article className="metric-card">
            <span className="muted">用户数量</span>
            <strong className="metric-number">{users.length}</strong>
            <span className="muted">活跃数据源：/api/users</span>
          </article>
          <article className="metric-card">
            <span className="muted">账户总余额</span>
            <strong className="metric-number">{amountFormatter.format(totalBalance)}</strong>
            <span className="chip chip-balance">资金概览</span>
          </article>
          <article className="metric-card">
            <span className="muted">操作建议</span>
            <strong>低余额用户 {lowBalanceCount} 人</strong>
            <span className="chip chip-brand">蓝色主题 · 高可读</span>
          </article>
        </div>
      </section>

      {error ? <p className="status-banner error">{error}</p> : null}

      {loading ? <p className="status-banner muted-banner">加载中...</p> : null}
      {refreshing ? <p className="status-banner muted-banner">正在刷新数据...</p> : null}

      {!loading && !hasUsers ? <p className="muted">暂无用户，请先执行 seed。</p> : null}

      {!loading && hasUsers ? (
        <section className="card stack">
          <div className="row dashboard-header">
            <h2 className="section-title no-bottom">用户列表</h2>
            <span className="chip chip-brand">快速充值 + 一键进入游戏</span>
          </div>

          <div className="users-mobile-list">
            {users.map((user) => {
              const value = inputs[user.id] ?? "";
              const parsedAmount = parsePositiveInteger(value);
              const hasInvalidInput = value.trim().length > 0 && parsedAmount === null;

              return (
                <article className="user-mobile-card" key={`mobile-${user.id}`}>
                  <div className="user-mobile-top">
                    <div className="user-identity">
                      <span className="user-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span>
                      <div className="stack compact-stack">
                        <strong>{user.displayName}</strong>
                        <div className="muted">{user.email}</div>
                      </div>
                    </div>
                    <div className="user-mobile-balance">
                      <span className="muted">余额</span>
                      <span className="balance-pill">{amountFormatter.format(user.balance)}</span>
                    </div>
                  </div>
                  <div className="user-mobile-actions">
                    <div className="deposit-controls user-mobile-deposit">
                      <input
                        className="compact-input"
                        type="number"
                        min={1}
                        step={1}
                        value={value}
                        placeholder="输入充值金额"
                        onChange={(event) => {
                          setInputs((prev) => ({
                            ...prev,
                            [user.id]: event.target.value,
                          }));
                          if (error) {
                            setError(null);
                          }
                        }}
                      />
                      {hasInvalidInput ? <span className="error">请输入整数</span> : null}
                      <button
                        className="primary strong-action"
                        onClick={() => handleDeposit(user.id)}
                        disabled={busyUserId === user.id || parsedAmount === null}
                      >
                        {busyUserId === user.id ? "充值中..." : "充值"}
                      </button>
                    </div>
                    <Link className="button-link primary user-mobile-enter" href={`/game/${user.id}`}>
                      进入游戏页
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="table-scroll users-desktop-table">
            <table className="table users-table">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>余额</th>
                  <th>充值</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const value = inputs[user.id] ?? "";
                  const parsedAmount = parsePositiveInteger(value);
                  const hasInvalidInput = value.trim().length > 0 && parsedAmount === null;

                  return (
                    <tr key={user.id}>
                      <td data-label="用户">
                        <div className="user-identity">
                          <span className="user-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span>
                          <div className="stack compact-stack">
                            <strong>{user.displayName}</strong>
                            <div className="muted">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="余额">
                        <span className="balance-pill">{amountFormatter.format(user.balance)}</span>
                      </td>
                      <td data-label="充值">
                        <div className="deposit-controls">
                          <input
                            className="compact-input"
                            type="number"
                            min={1}
                            step={1}
                            value={value}
                            placeholder="输入充值金额"
                            onChange={(event) => {
                              setInputs((prev) => ({
                                ...prev,
                                [user.id]: event.target.value,
                              }));
                              if (error) {
                                setError(null);
                              }
                            }}
                          />
                          {hasInvalidInput ? <span className="error">请输入整数</span> : null}
                          <button
                            className="primary strong-action"
                            onClick={() => handleDeposit(user.id)}
                            disabled={busyUserId === user.id || parsedAmount === null}
                          >
                            {busyUserId === user.id ? "充值中..." : "充值"}
                          </button>
                        </div>
                      </td>
                      <td data-label="操作">
                        <Link className="button-link primary table-action-link" href={`/game/${user.id}`}>
                          进入游戏页
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
