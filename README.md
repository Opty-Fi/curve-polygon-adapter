<img src="https://avatars.githubusercontent.com/u/71294241?s=400&u=0b62a061c11a7536c27b1d53760152b5e9bd40f5&v=4" alt="Header" style="width:200px;align=center;float: right;" />

## Adapter for Curve on Polygon

- [x] Deposit Pools
- [x] StableSwap Pools
- [x] Factory Metapools
- [ ] TriCrypto Deposit Pools
- [ ] TriCrypto Swap Pools

## Getting started

### Development Setup

- Create a `.env` file and set a BIP-39 compatible mnemonic as an environment variable. Follow the example in `.env.example`. If you don't already have a mnemonic, use this [website](https://iancoleman.io/bip39/) to generate one.
- You will require access to archive Node URL for forking the mainnet.

Proceed with installing dependencies:

```sh
yarn
```

Run the unit tests

```sh
yarn test:matic:fork
```

### References

- [Curve Polygon UI](https://polygon.curve.fi/)
- [Curve Polygon docs](https://curve.readthedocs.io/ref-addresses.html#polygon)
