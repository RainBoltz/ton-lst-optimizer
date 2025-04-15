import express from "express";
import dotenv from "dotenv";
import { scheduleMyJob } from "./jobs/pool";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Cron job + Express + TypeScript example!");
});

// Initialize cron jobs
scheduleMyJob();

export default app;
