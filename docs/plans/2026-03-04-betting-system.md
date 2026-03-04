# Betting System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a functional mini betting system with correct balance accounting, no negative balance bets, and no double settlement.

**Architecture:** Use a single Next.js TypeScript app with Node.js route handlers as backend, Prisma as data layer, and SQLite as storage. Put business rules in a service layer so API handlers and UI stay thin and readable.

**Tech Stack:** Next.js (App Router), TypeScript, Prisma, SQLite, Vitest

---

### Task 1: Bootstrap Project Skeleton

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `.gitignore`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

**Step 1: Create minimal project files**
- Add Next.js scripts and dependencies.
- Add base app layout/page.

**Step 2: Install dependencies**
Run: `npm install`
Expected: package installation succeeds with lockfile.

**Step 3: Verify app starts**
Run: `npm run build`
Expected: successful production build.

### Task 2: Define Database Schema + Seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `.env`

**Step 1: Define Prisma models and enums**
- `users`, `ledger_entries`, `bets`
- enum values exactly from README.

**Step 2: Generate DB schema**
Run: `npx prisma db push`
Expected: SQLite schema created.

**Step 3: Seed 10 users**
Run: `npm run prisma:seed`
Expected: exactly 10 users created.

### Task 3: Write Failing Tests for Core Betting Rules (TDD Red)

**Files:**
- Create: `vitest.config.ts`
- Create: `src/server/__tests__/betting-service.test.ts`

**Step 1: Write test cases first**
- Bet amount must be > 0
- Bet amount must not exceed balance
- Placing bet creates `BET_DEBIT` and `PLACED` bet
- WIN settlement creates `BET_CREDIT` with payout `2x`
- Settled bet cannot be settled twice

**Step 2: Run tests to verify failure**
Run: `npm test`
Expected: tests fail due missing implementation.

### Task 4: Implement Service Layer (TDD Green)

**Files:**
- Create: `src/lib/prisma.ts`
- Create: `src/server/errors.ts`
- Create: `src/server/betting-service.ts`

**Step 1: Implement minimal business logic to pass tests**
- transactional balance check on bet placement
- atomic status transition on settlement
- append-only ledger writes

**Step 2: Run tests**
Run: `npm test`
Expected: all service tests pass.

### Task 5: Build API Route Handlers

**Files:**
- Create: `src/app/api/users/route.ts`
- Create: `src/app/api/users/[userId]/deposit/route.ts`
- Create: `src/app/api/users/[userId]/bets/route.ts`
- Create: `src/app/api/bets/[betId]/settle/route.ts`

**Step 1: Implement routes**
- parse/validate payloads
- call service layer
- map domain errors to HTTP status codes

**Step 2: Verify TypeScript/build**
Run: `npm run build`
Expected: build passes without type errors.

### Task 6: Build Required Pages

**Files:**
- Create: `src/components/users-dashboard.tsx`
- Create: `src/components/game-dashboard.tsx`
- Create: `src/app/users/page.tsx`
- Create: `src/app/game/[userId]/page.tsx`

**Step 1: Users page**
- list users and balances
- deposit action
- link to user game page

**Step 2: Game page**
- show balance
- place bet
- show bet history
- settle placed bets as WIN/LOSE

**Step 3: Smoke verification**
Run: `npm run build`
Expected: page compilation succeeds.

### Task 7: Final Verification

**Files:**
- Modify: `README.md` (append run instructions if needed)

**Step 1: Run full checks**
Run: `npm test && npm run build`
Expected: all pass.

**Step 2: Verify requirement checklist**
- 10 users seed
- correct balance equation
- no overdraft bet
- no double settlement
- required pages and actions present
