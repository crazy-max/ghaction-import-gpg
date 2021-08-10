import * as core from '@actions/core';
import {issueCommand} from '@actions/core/lib/command';

export interface Inputs {
  gpgPrivateKey: string;
  passphrase: string;
  gitUserSigningkey: boolean;
  gitCommitGpgsign: boolean;
  gitTagGpgsign: boolean;
  gitPushGpgsign: string;
  gitCommitterName: string;
  gitCommitterEmail: string;
  workdir: string;
}

export async function getInputs(): Promise<Inputs> {
  return {
    gpgPrivateKey: core.getInput('gpg-private-key', {required: true}),
    passphrase: core.getInput('passphrase'),
    gitUserSigningkey: core.getBooleanInput('git-user-signingkey'),
    gitCommitGpgsign: core.getBooleanInput('git-commit-gpgsign'),
    gitTagGpgsign: core.getBooleanInput('git-tag-gpgsign'),
    gitPushGpgsign: core.getInput('git-push-gpgsign') || 'if-asked',
    gitCommitterName: core.getInput('git-committer-name'),
    gitCommitterEmail: core.getInput('git-committer-email'),
    workdir: core.getInput('workdir') || '.'
  };
}

// FIXME: Temp fix https://github.com/actions/toolkit/issues/777
export function setOutput(name: string, value: any): void {
  issueCommand('set-output', {name}, value);
}
