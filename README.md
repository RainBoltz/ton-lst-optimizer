# TON LSt Optimizer

Find the optimal parameters for liquid staking on TON blockchain

## Progress

- [x] Track the latest pool interest rate from Tonstakers liquid staking pool
- [x] Automatically update the interest rate to our pool every 10 seconds
- [x] Send update message info to Slack channel
- [ ] Calculate the local optimal interest rate for liquid staking poo
- [ ] Find the optimal interest rate for liquid staking pool for ones validator
- [ ] Calculate the reserve amount for target loan request

## How to Run

### commands

```bash
nvm use
npm install
npm run build
npm run start
```

### Environment Variables

- `PORT`: default=3000, port of api server
- `POOL_ADDRESS`: address of the maintaining pool
- `WALLET_PRIVATE_KEY`: address of any wallet
- `WALLET_VERSION`: default=v1r3, version of wallet (currently only v1r3 is supported)
- `JSON_RPC_ENDPOINT`: endpoint of the TON JSON RPC server (if not set, it will use the default endpoint=toncenter mainnet)
