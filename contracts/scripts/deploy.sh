#!/usr/bin/env bash
# Deploy NairaFlow Soroban contracts to Stellar Testnet
set -e

NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

echo "Building contracts..."
cargo build --release --target wasm32-unknown-unknown

echo "Deploying payroll contract..."
PAYROLL_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payroll.wasm \
  --source "$STELLAR_SECRET_KEY" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE")
echo "Payroll contract: $PAYROLL_ID"

echo "Deploying salary_stream contract..."
STREAM_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/salary_stream.wasm \
  --source "$STELLAR_SECRET_KEY" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE")
echo "Salary stream contract: $STREAM_ID"

echo ""
echo "Add to your .env:"
echo "PAYROLL_CONTRACT_ID=$PAYROLL_ID"
echo "SALARY_STREAM_CONTRACT_ID=$STREAM_ID"
