# 基础投注系统设计文档

## 1. 范围与目标
- 按 README 实现基础投注系统：用户列表、充值、下注、结算。
- 后端使用 Node.js runtime（基于 Next.js Route Handlers）。
- 数据库使用 SQLite + Prisma。
- 不实现登录/鉴权，聚焦评估点：余额正确、防负余额、防重复结算、结构清晰。

## 2. 数据模型
- `users`：`id`、`email`、`display_name`
- `ledger_entries`（仅新增）：`id`、`user_id`、`type`、`amount`、`created_at`
- `bets`：`id`、`user_id`、`amount`、`status`、`result`、`payout_amount`、`created_at`

余额规则：
- `balance = sum(DEPOSIT + BET_CREDIT) - sum(BET_DEBIT)`

## 3. 后端架构
- 服务层（`src/server/betting-service.ts`）封装核心业务逻辑：
  - 充值
  - 下单
  - 结算
  - 查询用户及余额
  - 查询用户投注历史
- API 层（`src/app/api/**/route.ts`）仅做输入解析、错误映射与调用服务层。
- 所有 API 显式设置 `runtime = "nodejs"`。

## 4. 一致性与防错策略
- 余额不足校验：下注时在事务内读取账本余额并校验。
- 防重复结算：使用 `updateMany(where: {id, status: PLACED})` 原子状态迁移。
  - 若更新计数为 0，则返回“已结算或不存在”。
- WIN 结算：赔付 `amount * 2`，新增 `BET_CREDIT`。
- LOSE 结算：不新增返还流水。
- 账本追加式：不提供更新/删除 ledger 接口。

## 5. 前端页面
- `/users`：展示所有用户和实时余额，支持充值，支持跳转游戏页面。
- `/game/[userId]`：展示当前余额、下注输入、历史投注、结算按钮。
- 页面以功能正确性优先，UI 简洁。

## 6. 测试策略
- 采用 TDD 优先覆盖服务层关键行为：
  - 下注金额 > 0
  - 下注不超过余额
  - 下注成功写入 `BET_DEBIT` 与 `bets`
  - WIN 结算写入 `BET_CREDIT`
  - 防重复结算
- 使用 SQLite 测试库执行集成级服务测试。
