[![GitHub release](https://img.shields.io/github/release/crazy-max/ghaction-import-gpg.svg?style=flat-square)](https://github.com/crazy-max/ghaction-import-gpg/releases/latest)
[![GitHub marketplace](https://img.shields.io/badge/marketplace-import--gpg-blue?logo=github&style=flat-square)](https://github.com/marketplace/actions/import-gpg)
[![Test workflow](https://github.com/crazy-max/ghaction-import-gpg/workflows/test/badge.svg)](https://github.com/crazy-max/ghaction-import-gpg/actions?workflow=test)
[![Codecov](https://img.shields.io/codecov/c/github/crazy-max/ghaction-import-gpg?style=flat-square)](https://codecov.io/gh/crazy-max/ghaction-import-gpg)
[![Become a sponsor](https://img.shields.io/badge/sponsor-crazy--max-181717.svg?logo=github&style=flat-square)](https://github.com/sponsors/crazy-max)
[![Paypal Donate](https://img.shields.io/badge/donate-paypal-00457c.svg?logo=paypal&style=flat-square)](https://www.paypal.me/crazyws)

## About

GitHub Action to easily import your GPG key to sign commits and tags.

If you are interested, [check out](https://git.io/Je09Y) my other :octocat: GitHub Actions!

![Import GPG key](.res/ghaction-import-gpg.png)

## Features

* Works on Linux, MacOS and Windows [virtual environments](https://help.github.com/en/articles/virtual-environments-for-github-actions#supported-virtual-environments-and-hardware-resources)
* Allow to seed the internal cache of `gpg-agent` with provided passphrase
* Enable signing for Git commits and tags
* Configure and check committer info against GPG key
* Purge imported GPG key, cache information and kill agent from runner

## Usage

On your local machine, export the GPG private key as an ASCII armored version:

```shell
gpg --armor --export-secret-key --output key.pgp joe@foo.bar
```

Copy the content of `key.pgp` file as a [`secret`](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) named `GPG_PRIVATE_KEY` for example. Create another secret with your `PASSPHRASE` if applicable.

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
        uses: crazy-max/ghaction-import-gpg@v1
        with:
          git_user_signingkey: true
          git_commit_gpgsign: true
          git_tag_gpgsign: true
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

| Name                   | Type    | Description                                              |
|------------------------|---------|----------------------------------------------------------|
| `git_user_signingkey`  | Bool    | Set GPG signing keyID for this Git repository (default `false`) |
| `git_commit_gpgsign`   | Bool    | Sign all commits automatically. `git_user_signingkey` needs to be enabled. (default `false`) |
| `git_tag_gpgsign`      | Bool    | Sign all tags automatically. `git_user_signingkey` needs to be enabled. (default `false`) |
| `git_push_gpgsign`     | Bool    | Sign all pushes automatically. `git_user_signingkey` needs to be enabled. (default `false`) |
| `git_committer_name`   | String  | Commit author's name (default [GITHUB_ACTOR](https://help.github.com/en/github/automating-your-workflow-with-github-actions/using-environment-variables#default-environment-variables) or `github-actions`) |
| `git_committer_email`  | String  | Commit author's email (default `<committer_name>@users.noreply.github.com`) |

### environment variables

Following environment variables can be used as `step.env` keys

| Name               | Description                           |
|--------------------|---------------------------------------|
| `GPG_PRIVATE_KEY`  | GPG private key exported as an ASCII armored version |
| `PASSPHRASE`       | Passphrase of your `GPG_PRIVATE_KEY` key if setted |

## How can I help?

All kinds of contributions are welcome :raised_hands:! The most basic way to show your support is to star :star2: the project, or to raise issues :speech_balloon: You can also support this project by [**becoming a sponsor on GitHub**](https://github.com/sponsors/crazy-max) :clap: or by making a [Paypal donation](https://www.paypal.me/crazyws) to ensure this journey continues indefinitely! :rocket:

Thanks again for your support, it is much appreciated! :pray:

## License

MIT. See `LICENSE` for more details.
