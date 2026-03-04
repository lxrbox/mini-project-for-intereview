# 基础游戏投注系统（三天 Mini Project）

## 作业说明

### 项目目标
构建一个简单的投注系统，用户可以查看余额、进行充值、下注以及结算。
系统不需要接入真实支付网关，充值为模拟操作。

### 技术要求
- 前端：Next.js（推荐 TypeScript）
- 后端：Node.js（可使用 Next.js API 路由）
- 数据库：PostgreSQL + Prisma

### 数据结构

#### 1. `users` 表
- `id`（uuid）
- `email`（字符串）
- `display_name`（字符串）

#### 2. `ledger_entries` 表（不可修改或删除，只允许新增）
- `id`（uuid）
- `user_id`
- `type`（`DEPOSIT` | `BET_DEBIT` | `BET_CREDIT`）
- `amount`（整数，最小单位）
- `created_at`

余额计算方式：
`余额 = 所有 DEPOSIT + 所有 BET_CREDIT - 所有 BET_DEBIT`

#### 3. `bets` 表
- `id`（uuid）
- `user_id`
- `amount`（整数）
- `status`（`PLACED` | `SETTLED`）
- `result`（`WIN` | `LOSE` | `null`）
- `payout_amount`（整数，默认 `0`）
- `created_at`

### 核心功能要求
1. 预置 10 个用户（必须通过 seed 脚本创建）。
2. 充值功能：管理员可为用户增加余额，创建一条 `ledger_entries` 记录，`type = DEPOSIT`。
3. 下单（投注）：
- 金额必须大于 0。
- 金额不能超过当前余额。
- 成功后创建 `BET_DEBIT` 记录。
- 创建 `bet`，状态为 `PLACED`。
4. 结算：
- 只能结算状态为 `PLACED` 的投注。
- `WIN`：赔付金额为投注金额的 2 倍，并创建 `BET_CREDIT` 记录。
- `LOSE`：不返还金额。
- 更新状态为 `SETTLED`。
- 不允许重复结算。

### 页面要求
1. 用户列表页：
- 显示所有用户。
- 显示余额。
- 提供充值按钮。

2. 游戏页面：
- 显示余额。
- 输入投注金额。
- 下单按钮。
- 显示历史投注。
- 提供结算按钮。

### 评估重点
- 余额计算是否正确。
- 是否防止余额为负数。
- 是否防止重复结算。
- 数据结构是否清晰。
- 代码是否易读。

### 时间限制
最多三天完成。请优先保证功能正确性，而不是界面美观。

---

## 本仓库实现说明

### 技术栈
- Next.js + TypeScript
- Next.js Route Handlers（API）
- Prisma + PostgreSQL

### 页面
- `/users`：用户列表（余额展示 + 充值 + 进入游戏页）
- `/game/[userId]`：游戏页（余额、下注、投注历史、WIN/LOSE 结算）

### API
- `GET /api/users`
- `POST /api/users/:userId/deposit`
- `GET /api/users/:userId/bets`
- `POST /api/users/:userId/bets`
- `POST /api/bets/:betId/settle`

## 本地运行

```bash
npm install
cp .env.example .env
# 把 .env 中的 DATABASE_URL 改成可用的 PostgreSQL 连接串
npm run db:push
npm run prisma:seed
npm run dev
```

## 测试与构建

```bash
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mini_project_test?schema=public"
npm test
npm run build
```

## 生产环境配置（Supabase PostgreSQL）

在部署平台设置环境变量：
- `DATABASE_URL=postgresql://postgres:<YOUR-PASSWORD>@db.rxoccomjduyizakxnulx.supabase.co:5432/postgres?sslmode=require`

部署后执行一次：
- `npm run db:push`
- `npm run prisma:seed`（仅首次需要演示数据时）
