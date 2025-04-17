import express from "express";
import dotenv from "dotenv";
import {
  getLatestTonstakersPoolInterestRate,
  scheduleGetInterestRate,
} from "./jobs/pool.js";
import { SlackNotifier } from "./utils/slackNotifier.js";

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

// setup private pool information
let setPoolInterestRateParams;
if (!process.env.WALLET_PRIVATE_KEY) {
  console.warn("WALLET_PRIVATE_KEY is not set in the environment variables");
  setPoolInterestRateParams = undefined;
} else if (!process.env.POOL_ADDRESS) {
  console.warn("POOL_ADDRESS is not set in the environment variables");
  setPoolInterestRateParams = undefined;
} else if (
  process.env.WALLET_VERSION &&
  process.env.WALLET_VERSION !== "v1r3"
) {
  console.warn("WALLET_VERSION is not supported");
  setPoolInterestRateParams = undefined;
} else {
  setPoolInterestRateParams = {
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
}

// setup slack notifier
let slack;
if (process.env.SLACK_WEBHOOK_URL) {
  slack = new SlackNotifier(process.env.SLACK_WEBHOOK_URL);
}

// Initialize cron jobs
scheduleGetInterestRate(setPoolInterestRateParams, slack);

export default app;
