[![GitHub release](https://img.shields.io/github/release/crazy-max/ghaction-import-gpg.svg?style=flat-square)](https://github.com/crazy-max/ghaction-import-gpg/releases/latest)
[![GitHub marketplace](https://img.shields.io/badge/marketplace-import--gpg-blue?logo=github&style=flat-square)](https://github.com/marketplace/actions/import-gpg)
[![Test workflow](https://img.shields.io/github/workflow/status/crazy-max/ghaction-import-gpg/test?label=test&logo=github&style=flat-square)](https://github.com/crazy-max/ghaction-import-gpg/actions?workflow=test)
[![Codecov](https://img.shields.io/codecov/c/github/crazy-max/ghaction-import-gpg?logo=codecov&style=flat-square)](https://codecov.io/gh/crazy-max/ghaction-import-gpg)
[![Become a sponsor](https://img.shields.io/badge/sponsor-crazy--max-181717.svg?logo=github&style=flat-square)](https://github.com/sponsors/crazy-max)
[![Paypal Donate](https://img.shields.io/badge/donate-paypal-00457c.svg?logo=paypal&style=flat-square)](https://www.paypal.me/crazyws)

## About

GitHub Action to easily import a GPG key.

If you are interested, [check out](https://git.io/Je09Y) my other :octocat: GitHub Actions!

![Import GPG](.github/ghaction-import-gpg.png)

___

* [Features](#features)
* [Prerequisites](#prerequisites)
* [Usage](#usage)
  * [Workflow](#workflow)
  * [Sign commits](#sign-commits)
* [Customizing](#customizing)
  * [inputs](#inputs)
  * [environment variables](#environment-variables)
* [How can I help?](#how-can-i-help)
* [License](#license)

## Features

* Works on Linux, MacOS and Windows [virtual environments](https://help.github.com/en/articles/virtual-environments-for-github-actions#supported-virtual-environments-and-hardware-resources)
* Allow to seed the internal cache of `gpg-agent` with provided passphrase
* Purge imported GPG key, cache information and kill agent from runner
* (Git) Enable signing for Git commits, tags and pushes
* (Git) Configure and check committer info against GPG key

## Prerequisites

First, export the GPG private key as an ASCII armored version:

```shell
gpg --armor --export-secret-key --output key.pgp joe@foo.bar
```

Copy the content of `key.pgp` file as a [`secret`](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) named `GPG_PRIVATE_KEY` for example. Create another secret with the `PASSPHRASE` if applicable.

## Usage

### Workflow

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
        id: import_gpg
        uses: crazy-max/ghaction-import-gpg@v1
        env:
          GPG_PRIVATE_KEY: ${{ secrets.GPG_PRIVATE_KEY }}
          PASSPHRASE: ${{ secrets.PASSPHRASE }}
      -
        name: GPG user IDs
        run: |
          echo "fingerprint: ${{ steps.import_gpg.outputs.fingerprint }}"
          echo "keyid:       ${{ steps.import_gpg.outputs.keyid }}"
          echo "email:       ${{ steps.import_gpg.outputs.email }}"
```

### Sign commits

```yaml
name: import-gpg

on:
  push:
    branches: master

jobs:
  sign-commit:
    runs-on: ubuntu-latest
    steps:
      -
        name: Checkout
        uses: actions/checkout@v2
      -
        name: Import GPG key
        uses: crazy-max/ghaction-import-gpg@v1
        with:
          git_user_signingkey: true
          git_commit_gpgsign: true
        env:
          GPG_PRIVATE_KEY: ${{ secrets.GPG_PRIVATE_KEY }}
          PASSPHRASE: ${{ secrets.PASSPHRASE }}
      -
        name: Sign commit and push changes
        run: |
          echo foo > bar.txt
          git add .
          git commit -S -m "This commit is signed!"
          git push
```

## Customizing

### inputs

Following inputs can be used as `step.with` keys

| Name                                  | Type   | Description                                    |
|--------------------------------------|---------|------------------------------------------------|
| `git_user_signingkey`                | Bool    | Set GPG signing keyID for this Git repository (default `false`) |
| `git_commit_gpgsign` :pushpin:       | Bool    | Sign all commits automatically. (default `false`) |
| `git_tag_gpgsign` :pushpin:          | Bool    | Sign all tags automatically. (default `false`) |
| `git_push_gpgsign` :pushpin:         | Bool    | Sign all pushes automatically. (default `false`) |
| `git_committer_name` :pushpin:       | String  | Set commit author's name (defaults to the name associated with the GPG key) |
| `git_committer_email` :pushpin:      | String  | Set commit author's email (defaults to the email address associated with the GPG key) |

> :pushpin: `git_user_signingkey` needs to be enabled for these inputs to be used.

### outputs

Following outputs are available

| Name          | Type    | Description                           |
|---------------|---------|---------------------------------------|
| `fingerprint` | String  | Fingerprint of the GPG key (recommended as [user ID](https://www.gnupg.org/documentation/manuals/gnupg/Specify-a-User-ID.html)) |
| `keyid`       | String  | Low 64 bits of the X.509 certificate SHA-1 fingerprint |
| `email`       | String  | Email address associated with the GPG key |
| `name`       | String  | Name associated with the GPG key |

### environment variables

Following environment variables can be used as `step.env` keys

| Name               | Description                           |
|--------------------|---------------------------------------|
| `GPG_PRIVATE_KEY`  | GPG private key exported as an ASCII armored version (**required**) |
| `PASSPHRASE`       | Passphrase of the `GPG_PRIVATE_KEY` key if setted |

## How can I help?

All kinds of contributions are welcome :raised_hands:! The most basic way to show your support is to star :star2: the project, or to raise issues :speech_balloon: You can also support this project by [**becoming a sponsor on GitHub**](https://github.com/sponsors/crazy-max) :clap: or by making a [Paypal donation](https://www.paypal.me/crazyws) to ensure this journey continues indefinitely! :rocket:

Thanks again for your support, it is much appreciated! :pray:

## License

MIT. See `LICENSE` for more details.
