import cron from "node-cron";
import { retryUntilSuccess } from "../utils/common.js";
import { logger } from "../utils/logger.js";
import {
  SetPoolInterestRateParams,
  setPoolInterestRateViaSecretKey,
} from "../utils/ton.js";

let lastRecord: any = null;
let _getter_lock = false;
async function getInterestRate() {
  if (_getter_lock) {
    //logger.warn("Interest rate getter is already running");
    return lastRecord;
  } else {
    _getter_lock = true;
  }
  logger.debug("Fetching interest rate...");
  try {
    const interestRate = await retryUntilSuccess(
      async () => {
        const url = "https://toncenter.com/api/v2/runGetMethod";

        const body = {
          address: "EQCkWxfyhAkim3g2DjKQQg8T5P4g-Q1-K_jErGcDJZ4i-vqR",
          method: "get_pool_full_data",
          stack: [],
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const responseJson = await response.json();
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        } else if (
          !responseJson.ok ||
          !responseJson.result ||
          responseJson.result.stack.length < 30
        ) {
          throw new Error(
            `Error: done=${responseJson.ok}, exit_code=${responseJson.result?.exit_code}, stack=${responseJson.result?.stack}`
          );
        }

        const stack = responseJson.result.stack;
        const interestRate = Number(stack[3][1]);
        const governanceFee = Number(stack[11][1]);

        if (isNaN(interestRate)) {
          throw new Error(`Error: Interest rate is not a number`);
        } else if (isNaN(governanceFee)) {
          throw new Error(`Error: Governance fee is not a number`);
        }
        return {
          interestRate: {
            value: interestRate,
            ratio: interestRate / 2 ** 24,
          },
          governanceFee: {
            value: governanceFee,
            ratio: governanceFee / 2 ** 24,
          },
          apy: {
            pool:
              (interestRate / 2 ** 24) *
              ((365 * 24 * 60 * 60) / (65536 + 32768)) *
              (1 - governanceFee / 2 ** 24),
            poolTaxFree:
              (interestRate / 2 ** 24) *
              ((365 * 24 * 60 * 60) / (65536 + 32768)),
          },
        };
      },
      30,
      1000
    ); // 30 seconds, 1 second interval, 30 * 1s = 30s < cron job interval = 5 minutes

    return interestRate;
  } catch (error) {
    logger.error(`Error fetching interest rate: ${error}`);
  } finally {
    _getter_lock = false;
  }
}

export function scheduleGetInterestRate(params?: SetPoolInterestRateParams) {
  logger.info("Scheduling interest rate fetch every 10 seconds");
  // Schedule the task to run every 10 seconds
  cron.schedule("*/10 * * * * *", () => {
    getInterestRate()
      .then((interestRate) => {
        if (
          !lastRecord ||
          (interestRate &&
            (lastRecord.interestRate?.value !==
              interestRate.interestRate.value ||
              lastRecord.governanceFee?.value !==
                interestRate.governanceFee.value))
        ) {
          logger.info(
            `Interest rate: ${interestRate!.interestRate.value}, APY: ${(
              interestRate!.apy.pool * 100
            ).toFixed(2)}%, Governance fee: ${
              interestRate!.governanceFee.value
            }`
          );
          lastRecord = interestRate;
          if (params && params.base64Seed && params.poolAddress) {
            logger.info("Setting pool interest rate via secret key");
            const setParams: SetPoolInterestRateParams = {
              ...params,
              interestRate: interestRate.interestRate.value,
            };
            setPoolInterestRateViaSecretKey(setParams);
          }
        }
      })
      .catch((error) => {
        logger.error(`Error in scheduled task: ${error}`);
      });
  });
}

export function getLatestTonstakersPoolInterestRate() {
  return lastRecord;
}
