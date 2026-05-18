import {
  Keypair,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Asset,
  Memo,
  Server,
} from "stellar-sdk";
import prisma from "../lib/prisma";

// Stellar Testnet server
const server = new Server(process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org");

const USDC_ASSET = new Asset(
  process.env.USDC_ASSET_CODE || "USDC",
  process.env.USDC_ISSUER || "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
);

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  employee: { walletAddress: string };
}

export async function executeStellarPayroll(payments: PaymentRecord[]) {
  const sourceKeypair = Keypair.fromSecret(process.env.STELLAR_SECRET_KEY!);
  const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

  const txBuilder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: process.env.STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET,
  }).addMemo(Memo.text("NairaFlow Payroll"));

  for (const payment of payments) {
    txBuilder.addOperation(
      Operation.payment({
        destination: payment.employee.walletAddress,
        asset: USDC_ASSET,
        amount: payment.amount.toFixed(7),
      })
    );
  }

  const tx = txBuilder.setTimeout(30).build();
  tx.sign(sourceKeypair);

  const result = await server.submitTransaction(tx);

  // Update payment statuses
  await Promise.all(
    payments.map((p) =>
      prisma.payment.update({
        where: { id: p.id },
        data: { status: "CONFIRMED", txHash: result.hash },
      })
    )
  );

  return { txHash: result.hash, count: payments.length };
}
