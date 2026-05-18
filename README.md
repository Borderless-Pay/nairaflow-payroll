# NairaFlow — African Cross-Border Payroll

Blockchain-powered payroll platform for paying African remote workers instantly using USDC on Stellar.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, React Query |
| Backend | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL |
| Smart Contracts | Stellar Soroban (Rust) |
| Payments | Stellar Horizon + USDC |

## Project Structure

```
nairaflow-payroll/
├── backend/          # Express API + Prisma ORM
│   ├── prisma/       # DB schema & migrations
│   └── src/
│       ├── routes/   # auth, employees, payroll, payments
│       ├── services/ # stellar.ts — bulk USDC disbursement
│       └── middleware/
├── frontend/         # Next.js app
│   └── src/app/
│       ├── dashboard/  # employees, payroll, payments pages
│       └── auth/       # login
└── contracts/        # Soroban smart contracts
    └── contracts/
        ├── payroll/        # Bulk USDC disburse in one tx
        └── salary_stream/  # Per-second salary streaming
```

## Quick Start

```bash
# 1. Copy env
cp .env.example .env
# Fill in STELLAR_SECRET_KEY and JWT_SECRET

# 2. Start with Docker
docker compose up

# 3. Or run locally
cd backend && npm install && npm run db:migrate && npm run dev
cd frontend && npm install && npm run dev
```

## Smart Contracts

```bash
cd contracts

# Run tests
cargo test

# Deploy to Stellar Testnet (requires stellar CLI)
STELLAR_SECRET_KEY=S... bash scripts/deploy.sh
```

### Contracts

**`payroll`** — Disburse USDC to multiple recipients atomically.
```
initialize(admin, usdc_token)
disburse(from, payments: [{recipient, amount}])
```

**`salary_stream`** — Stream salary per-second; employee withdraws accrued amount anytime.
```
create_stream(employer, employee, token, total_amount, duration_secs) → stream_id
withdraw(stream_id) → amount_claimed
claimable(stream_id) → accrued_amount
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register company + employer |
| POST | `/api/auth/login` | Login |
| GET | `/api/employees` | List employees |
| POST | `/api/employees` | Add employee |
| POST | `/api/payroll` | Create payroll run |
| POST | `/api/payroll/:id/execute` | Execute via Stellar |
| GET | `/api/payments/:payrollId` | List payments |
