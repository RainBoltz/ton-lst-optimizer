import fs from "fs/promises";
import {
  TonClient,
  WalletContractV4,
  internal,
  Address,
  WalletContractV1R3,
  WalletContractV5R1,
  SendMode,
  beginCell,
  toNano,
} from "@ton/ton";
import { keyPairFromSeed } from "@ton/crypto";
import { sleep } from "./common.js";

type WalletVersionSupport = "v1r3" | "v3r2" | "v4" | "v4r2" | "v5";
export interface SetPoolInterestRateParams {
  base64Seed: string;
  poolAddress: string;
  interestRate: number;
  walletVersion?: WalletVersionSupport;
  jsonRpcEndpoint?: string;
}

export async function setPoolInterestRateViaSecretKey(
  params: SetPoolInterestRateParams
) {
  const { base64Seed, poolAddress, interestRate, jsonRpcEndpoint } = params;

  // 1. Load private key from file
  const seedBytes = Buffer.from(base64Seed, "base64");

  if (seedBytes.length !== 32) {
    throw new Error("Secret key (seed) must be 32 bytes");
  }

  const keyPair = keyPairFromSeed(seedBytes);
  const { secretKey, publicKey } = keyPair;

  // 2. Create wallet
  let walletType: typeof WalletContractV1R3;
  // | typeof WalletContractV4
  // | typeof WalletContractV5R1;
  switch (params.walletVersion) {
    case "v1r3":
      walletType = WalletContractV1R3;
      break;
    // case "v3r2":
    //   walletType = WalletContractV1R3;
    //   break;
    // case "v4":
    //   walletType = WalletContractV4;
    //   break;
    // case "v4r2":
    //   walletType = WalletContractV4;
    //   break;
    // case "v5":
    //   walletType = WalletContractV5R1;
    //   break;
    default:
      walletType = WalletContractV1R3;
      break;
  }
  const wallet = walletType.create({
    workchain: -1, // masterchain
    publicKey: publicKey,
  });

  // 3. Connect to TON
  const client = new TonClient({
    endpoint: jsonRpcEndpoint ?? "https://toncenter.com/api/v2/jsonRPC",
  });

  // 4. Get latest seqno
  const walletContract = client.open(wallet);
  let seqno = -1;
  while (true) {
    try {
      seqno = await walletContract.getSeqno();
      await sleep(1500);
    } catch (error) {
      console.debug("Error getting seqno:", error);
      await sleep(5000);
    }

    if (seqno !== -1) {
      break;
    }
  }

  let newSeqno = seqno;

  // 5. Create transfer
  while (newSeqno <= seqno) {
    try {
      await walletContract.sendTransfer({
        seqno,
        secretKey,
        message: internal({
          to: Address.parse(poolAddress),
          value: toNano("0.3"),
          body: beginCell()
            .storeUint(0xc9f04485, 32)
            .storeUint(Date.now(), 64)
            .storeUint(interestRate, 24)
            .endCell(),
        }),
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      });
      await sleep(5000);

      newSeqno = await walletContract.getSeqno();
      await sleep(1500);
    } catch (error) {
      console.debug("Error sending transaction:", error);
      await sleep(5000);
    }
  }

  console.log(
    `✅ Transfer submitted from ${walletContract.address} to ${poolAddress}`
  );
}
