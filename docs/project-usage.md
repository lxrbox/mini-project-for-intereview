# 项目使用说明

## 1. 项目简介
本项目是一个基础投注系统，基于 Next.js + Node.js API Route Handlers + Prisma + SQLite 实现。

核心能力：
- 用户余额展示
- 充值（写入 `ledger_entries` 的 `DEPOSIT`）
- 下注（写入 `BET_DEBIT`，并创建 `bets`）
- 结算（WIN/LOSE，防重复结算）

## 2. 运行环境
- Node.js 18+（建议 20+）
- npm 9+

## 3. 快速启动
在项目根目录执行：

```bash
npm install
npm run db:push
npm run prisma:seed
npm run dev
```

启动后访问：
- `http://localhost:3000/`（会跳转到用户页）
- `http://localhost:3000/users`

## 4. 页面说明
### 4.1 用户列表页 `/users`
- 显示全部用户
- 显示每个用户当前余额
- 支持输入充值金额并点击“充值”
- 支持进入对应用户游戏页

### 4.2 游戏页 `/game/[userId]`
- 显示当前用户余额
- 输入投注金额并下单
- 显示历史投注
- 对 `PLACED` 状态投注执行 WIN/LOSE 结算

## 5. 数据库查看
### 5.1 Prisma Studio（推荐）
```bash
npx prisma studio
```
默认访问：`http://localhost:5555`

### 5.2 SQLite 命令行（可选）
```bash
sqlite3 prisma/dev.db
.tables
SELECT * FROM users;
SELECT * FROM ledger_entries;
SELECT * FROM bets;
.quit
```

## 6. 测试与构建
```bash
npm test
npm run build
```

## 7. 关键业务规则
- 余额计算：`DEPOSIT + BET_CREDIT - BET_DEBIT`
- 下注金额必须大于 0
- 下注金额不能超过余额（防止负余额）
- 只允许结算 `PLACED` 状态投注（防重复结算）
- WIN 赔付 `投注额 * 2`，LOSE 不返还

## 8. 常见问题
- 若看不到用户数据：请先执行 `npm run prisma:seed`
- 若数据库结构异常：重新执行 `npm run db:push`
- 若需要重置演示数据：再次执行 `npm run prisma:seed`
