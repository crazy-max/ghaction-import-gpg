# Changelog

## 4.0.0 (2021/09/05)

* OpenPGP.js v5 (#78)
* POSIX-compliant inputs names (#109)
  * Rename `gpg-private-key` input `gpg_private_key`
  * Rename `git-config-global` input `git_config_global`
  * Rename `git-user-signingkey` input `git_user_signingkey`
  * Rename `git-commit-gpgsign` input `git_commit_gpgsign`
  * Rename `git-tag-gpgsign` input `git_tag_gpgsign`
  * Rename `git-push-gpgsign` input `git_push_gpgsign`
  * Rename `git-committer-name` input `git_committer_name`
  * Rename `git-committer-email` input `git_committer_email`
* Bump @actions/core from 1.4.0 to 1.5.0 (#106)

## 3.2.0 (2021/08/10)

* Add `git-config-global` input (#103)
* Use built-in `getExecOutput` (#102)
* Handle `if-asked` for `git-push-gpgsign` input (#100)
* Use `getBooleanInput` (#101)
* Bump @actions/core from 1.2.7 to 1.4.0 (#97)
* Bump @actions/exec from 1.0.4 to 1.1.0 (#96)
* Bump ws from 7.3.1 to 7.5.0 (#98)
* Fix setOutput (#86)
* Bump actions/github-script from v3 to v4.0.2 (#83)
* Bump @actions/core from 1.2.6 to 1.2.7 (#81)
* Bump hosted-git-info from 2.8.8 to 2.8.9 (#85)
* Bump lodash from 4.17.20 to 4.17.21 (#84)
* Bump y18n from 4.0.0 to 4.0.1 (#79)
* Enhance workflow (#77)

## 3.1.0 (2021/01/29)

* Container based developer flow (#76)
* Bump openpgp from 4.10.9 to 4.10.10 (#75)
* Bump node-notifier from 8.0.0 to 8.0.1 (#72)
* Bump openpgp from 4.10.8 to 4.10.9 (#69)

## 3.0.2 (2020/11/24)

* Fix git committer email action input (#67)

## 3.0.1 (2020/10/01)

* Fix CVE-2020-15228

## 3.0.0 (2020/09/06)

* Move `GPG_PRIVATE_KEY` env var to `gpg-private-key` input
* Move `PASSPHRASE` env var to `passphrase` input
* Rename `git_user_signingkey` input to `git-user-signingkey`
* Rename `git_commit_gpgsign` input to `git-commit-gpgsign`
* Rename `git_tag_gpgsign` input to `git-tag-gpgsign`
* Rename `git_push_gpgsign` input to `git-push-gpgsign`
* Rename `git_committer_name` input to `git-committer-name`
* Rename `git_committer_email` input to `git-committer-email`
* Update deps

## 2.3.0 (2020/09/03)

* Preset passphrase for all key keygrips (#57)
* Update deps

## 2.2.0 (2020/08/28)

* Add `workdir` input (#55)
* Update deps

## 2.1.1 (2020/05/18)

* Fix importing of base64 armored string (#18)
* Enhanced tests
* Update deps

## 2.1.0 (2020/05/13)

* Allow importing GPG key as a base64 string (#14)

## 2.0.1 (2020/05/13)

* Committer email does not match

## 2.0.0 (2020/05/13)

* Use GPG key name/email as default values (#13)
* Centralize test key/passphrase

## 1.4.2 (2020/05/11)

* Clean code
* Update deps

## 1.4.1 (2020/05/07)

* Update README

## 1.4.0 (2020/05/07)

* Add `fingerprint`, `keyid` and `email` outputs
* Cleanup local paths from extra fields

## 1.3.0 (2020/05/06)

* Add `git_tag_gpgsign` and `git_push_gpgsign` inputs
* Some inputs and secrets have been renamed

## 1.2.0 (2020/05/05)

* Use `gpg-connect-agent` to seed the internal cache of `gpg-agent`
* Fix keygrip (#10)
* Kill GnuPG agent at POST step
* Bring back support for Windows

## 1.1.0 (2020/05/05)

* Configure and check committer email against GPG user address
* Fix code transpilation (#9)
* Update deps

## 1.0.0 (2020/05/04)

* Enable signing for Git commits and tags (#4)

## 0.2.0 (2020/05/04)

* Allow to seed the internal cache of `gpg-agent` with provided passphrase (#5)
* Better handling of commands output streams

## 0.1.1 (2020/05/03)

* Fix README

## 0.1.0 (2020/05/03)

* Initial version
