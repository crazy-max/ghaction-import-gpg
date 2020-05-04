[![GitHub release](https://img.shields.io/github/release/crazy-max/ghaction-import-gpg.svg?style=flat-square)](https://github.com/crazy-max/ghaction-import-gpg/releases/latest)
[![GitHub marketplace](https://img.shields.io/badge/marketplace-import--gpg-blue?logo=github&style=flat-square)](https://github.com/marketplace/actions/import-gpg)
[![Test workflow](https://github.com/crazy-max/ghaction-import-gpg/workflows/test/badge.svg)](https://github.com/crazy-max/ghaction-import-gpg/actions?workflow=test)
[![Become a sponsor](https://img.shields.io/badge/sponsor-crazy--max-181717.svg?logo=github&style=flat-square)](https://github.com/sponsors/crazy-max)
[![Paypal Donate](https://img.shields.io/badge/donate-paypal-00457c.svg?logo=paypal&style=flat-square)](https://www.paypal.me/crazyws)

## About

GitHub Action to easily import your GPG key to sign commits and tags.

If you are interested, [check out](https://git.io/Je09Y) my other :octocat: GitHub Actions!

![Import GPG key](.res/ghaction-import-gpg.png)

## Features

* Works on Linux and MacOS [virtual environments](https://help.github.com/en/articles/virtual-environments-for-github-actions#supported-virtual-environments-and-hardware-resources)
* Allow to seed the internal cache of `gpg-agent` with provided passphrase
* Purge imported GPG key and cache information from runner (security)

## Usage

```yaml
name: import-gpg

on:
  push:
    branches: master

jobs:
  import-gpg:
    runs-on: ubuntu-latest
    steps:
      -
        name: Checkout
        uses: actions/checkout@v2
      -
        name: Import GPG key
        uses: crazy-max/ghaction-import-gpg@master
        env:
          SIGNING_KEY: ${{ secrets.SIGNING_KEY }}
          PASSPHRASE: ${{ secrets.PASSPHRASE }}
```

## Customizing

### environment variables

Following environment variables can be used as `step.env` keys

| Name           | Description                           |
|----------------|---------------------------------------|
| `SIGNING_KEY`  | GPG private key exported as an ASCII armored version |
| `PASSPHRASE`   | Passphrase of your GPG key if setted for your `SIGNING_KEY` |

## How can I help?

All kinds of contributions are welcome :raised_hands:! The most basic way to show your support is to star :star2: the project, or to raise issues :speech_balloon: You can also support this project by [**becoming a sponsor on GitHub**](https://github.com/sponsors/crazy-max) :clap: or by making a [Paypal donation](https://www.paypal.me/crazyws) to ensure this journey continues indefinitely! :rocket:

Thanks again for your support, it is much appreciated! :pray:

## License

MIT. See `LICENSE` for more details.
