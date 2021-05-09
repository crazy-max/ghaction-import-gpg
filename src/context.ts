import * as core from '@actions/core';
import {issueCommand} from '@actions/core/lib/command';

export interface Inputs {
  gpgPrivateKey: string;
  passphrase: string;
  gitUserSigningkey: boolean;
  gitCommitGpgsign: boolean;
  gitTagGpgsign: boolean;
  gitPushGpgsign: boolean;
  gitCommitterName: string;
  gitCommitterEmail: string;
  workdir: string;
}

export async function getInputs(): Promise<Inputs> {
  return {
    gpgPrivateKey: core.getInput('gpg-private-key', {required: true}),
    passphrase: core.getInput('passphrase'),
    gitUserSigningkey: /true/i.test(core.getInput('git-user-signingkey')),
    gitCommitGpgsign: /true/i.test(core.getInput('git-commit-gpgsign')),
    gitTagGpgsign: /true/i.test(core.getInput('git-tag-gpgsign')),
    gitPushGpgsign: /true/i.test(core.getInput('git-push-gpgsign')),
    gitCommitterName: core.getInput('git-committer-name'),
    gitCommitterEmail: core.getInput('git-committer-email'),
    workdir: core.getInput('workdir') || '.'
  };
}

// FIXME: Temp fix https://github.com/actions/toolkit/issues/777
export function setOutput(name: string, value: any): void {
  issueCommand('set-output', {name}, value);
}
