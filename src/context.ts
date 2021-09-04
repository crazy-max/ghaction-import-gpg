import * as core from '@actions/core';
import {issueCommand} from '@actions/core/lib/command';

export interface Inputs {
  gpgPrivateKey: string;
  passphrase: string;
  gitConfigGlobal: boolean;
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
    gpgPrivateKey: core.getInput('gpg_private_key', {required: true}),
    passphrase: core.getInput('passphrase'),
    gitConfigGlobal: core.getBooleanInput('git_config_global'),
    gitUserSigningkey: core.getBooleanInput('git_user_signingkey'),
    gitCommitGpgsign: core.getBooleanInput('git_commit_gpgsign'),
    gitTagGpgsign: core.getBooleanInput('git_tag_gpgsign'),
    gitPushGpgsign: core.getInput('git_push_gpgsign') || 'if-asked',
    gitCommitterName: core.getInput('git_committer_name'),
    gitCommitterEmail: core.getInput('git_committer_email'),
    workdir: core.getInput('workdir') || '.'
  };
}

// FIXME: Temp fix https://github.com/actions/toolkit/issues/777
export function setOutput(name: string, value: any): void {
  issueCommand('set-output', {name}, value);
}
