import express from "express";
import dotenv from "dotenv";
import {
  getLatestTonstakersPoolInterestRate,
  scheduleGetInterestRate,
} from "./jobs/pool.js";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/tonstaker_pool_interest_rate", (_req, res) => {
  const interestRate = getLatestTonstakersPoolInterestRate();
  if (!interestRate) {
    res.status(500).json({ error: "Failed to fetch interest rate" });
    return;
  }
  res.json(interestRate);
});

// Initialize cron jobs
if (!process.env.WALLET_PRIVATE_KEY) {
  console.error("WALLET_PRIVATE_KEY is not set in the environment variables");
  process.exit(1);
} else if (!process.env.POOL_ADDRESS) {
  console.error("POOL_ADDRESS is not set in the environment variables");
  process.exit(1);
} else if (
  process.env.WALLET_VERSION &&
  process.env.WALLET_VERSION !== "v1r3"
) {
  console.error("WALLET_VERSION is not supported");
  process.exit(1);
}
const setPoolInterestRateParams = {
  base64Seed: process.env.WALLET_PRIVATE_KEY!,
  poolAddress: process.env.POOL_ADDRESS!,
  interestRate: 0,
  jsonRpcEndpoint: process.env.JSON_RPC_ENDPOINT
    ? process.env.JSON_RPC_ENDPOINT
    : undefined,
  walletVersion: process.env.WALLET_VERSION
    ? (process.env.WALLET_VERSION as "v1r3" | "v3r2" | "v4" | "v4r2" | "v5")
    : undefined,
};
scheduleGetInterestRate(setPoolInterestRateParams);

export default app;
