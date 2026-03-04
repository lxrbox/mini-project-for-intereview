基础投注系统作业说明 三天mini project: 基础游戏投注系统 项目目标:构建一个简单的投注系统，用户可以查看余额、进行充值、下注以及结算。 系统不需要接入真实支付网关，充值为模拟操作。 技术要求:- 前端: Next.js(推荐使用 TypeScript)- 后端: Node.js(可使用 Next.js API 路由) - 数据库:SQLite + Prisma(推荐) 数据结构: 1. users 表:- id(uuid)- email(字符串)- display_name(字符串) 2. ledger_entries 表(不可修改或删除，只允许新增): - id(uuid)- user_id- type(DEPOSIT | BET_DEBIT | BET_CREDIT) - amount(整数，最小单位) - created_at 余额计算方式:余额 = 所有 DEPOSIT + BET_CREDIT - 所有 BET_DEBIT 3. bets 表:- id(uuid)- user_id- amount(整数)- status(PLACED | SETTLED)- result(WIN | LOSE | null)
- payout_amount(整数，默认 0) - created_at 核心功能要求:1. 预置 10 个用户(必须通过 seed 脚本创建)。 2. 充值功能:管理员可为用户增加余额。创建一条 ledger_entries 记录，type 为 DEPOSIT。 3. 下单(投注):- 金额必须大于 0- 金额不能超过当前余额- 成功后创建 BET_DEBIT 记录 - 创建 bet，状态为 PLACED 4. 结算:- 只能结算状态为 PLACED 的投注- WIN: 赔付金额为投注金额的 2 倍，并创建 BET_CREDIT 记录 - LOSE: 不返还金额- 更新状态为 SETTLED- 不允许重复结算 页面要求: 1. 用户列表页: - 显示所有用户 - 显示余额- 提供充值按钮 2. 游戏页面:- 显示余额- 输入投注金额 - 下单按钮- 显示历史投注 - 提供结算按钮 评估重点:
- 余额计算是否正确- 是否防止余额为负数 - 是否防止重复结算- 数据结构是否清晰- 代码是否易读 时间限制:最多三天完成。请优先保证功能正确性，而不是界面美观。

---

实现说明（本仓库）

- 技术栈：Next.js + TypeScript + Node.js Route Handlers + Prisma + SQLite
- 已实现页面：
  - `/users` 用户列表（余额展示 + 充值 + 进入游戏页）
  - `/game/[userId]` 游戏页（余额、下注、投注历史、WIN/LOSE 结算）
- 已实现接口：
  - `GET /api/users`
  - `POST /api/users/:userId/deposit`
  - `GET /api/users/:userId/bets`
  - `POST /api/users/:userId/bets`
  - `POST /api/bets/:betId/settle`

本地运行：

```bash
npm install
npm run db:push
npm run prisma:seed
npm run dev
```

测试与构建：

```bash
npm test
npm run build
```
