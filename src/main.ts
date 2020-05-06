import * as core from '@actions/core';
import * as git from './git';
import * as gpg from './gpg';
import * as openpgp from './openpgp';
import * as stateHelper from './state-helper';

async function run(): Promise<void> {
  try {
    if (!process.env.GPG_PRIVATE_KEY) {
      core.setFailed('GPG private key required');
      return;
    }

    const git_user_signingkey = /true/i.test(core.getInput('git_user_signingkey'));
    const git_commit_gpgsign = /true/i.test(core.getInput('git_commit_gpgsign'));
    const git_tag_gpgsign = /true/i.test(core.getInput('git_tag_gpgsign'));
    const git_push_gpgsign = /true/i.test(core.getInput('git_push_gpgsign'));
    const git_committer_name: string = core.getInput('git_committer_name') || process.env['GITHUB_ACTOR'] || 'github-actions';
    const git_committer_email: string = core.getInput('git_committer_email') || `${git_committer_name}@users.noreply.github.com`;

    core.info('📣 GnuPG info');
    const version = await gpg.getVersion();
    const dirs = await gpg.getDirs();
    core.info(`Version    : ${version.gnupg} (libgcrypt ${version.libgcrypt})`);
    core.info(`Libdir     : ${dirs.libdir}`);
    core.info(`Libexecdir : ${dirs.libexecdir}`);
    core.info(`Datadir    : ${dirs.datadir}`);
    core.info(`Homedir    : ${dirs.homedir}`);

    core.info('🔮 Checking GPG private key');
    const privateKey = await openpgp.readPrivateKey(process.env.GPG_PRIVATE_KEY);
    core.debug(`Fingerprint  : ${privateKey.fingerprint}`);
    core.debug(`KeyID        : ${privateKey.keyID}`);
    core.debug(`Name         : ${privateKey.name}`);
    core.debug(`Email        : ${privateKey.email}`);
    core.debug(`CreationTime : ${privateKey.creationTime}`);

    core.info('🔑 Importing GPG private key');
    await gpg.importKey(process.env.GPG_PRIVATE_KEY).then(stdout => {
      core.debug(stdout);
    });

    if (process.env.PASSPHRASE) {
      core.info('⚙️ Configuring GnuPG agent');
      await gpg.configureAgent(gpg.agentConfig);

      core.info('📌 Getting keygrip');
      const keygrip = await gpg.getKeygrip(privateKey.fingerprint);
      core.debug(`${keygrip}`);

      core.info('🔓 Preset passphrase');
      await gpg.presetPassphrase(keygrip, process.env.PASSPHRASE).then(stdout => {
        core.debug(stdout);
      });
    }

    if (git_user_signingkey) {
      core.info('🔐 Setting GPG signing keyID for this Git repository');
      await git.setConfig('user.signingkey', privateKey.keyID);

      if (git_committer_email != privateKey.email) {
        core.setFailed('Committer email does not match GPG key user address');
        return;
      }

      core.info(`🔨 Configuring Git committer (${git_committer_name} <${git_committer_email}>)`);
      await git.setConfig('user.name', git_committer_name);
      await git.setConfig('user.email', git_committer_email);

      if (git_commit_gpgsign) {
        core.info('💎 Sign all commits automatically');
        await git.setConfig('commit.gpgsign', 'true');
      }
      if (git_tag_gpgsign) {
        core.info('💎 Sign all tags automatically');
        await git.setConfig('tag.gpgsign', 'true');
      }
      if (git_push_gpgsign) {
        core.info('💎 Sign all pushes automatically');
        await git.setConfig('push.gpgsign', 'true');
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function cleanup(): Promise<void> {
  if (!process.env.GPG_PRIVATE_KEY) {
    core.debug('GPG private key is not defined. Skipping cleanup.');
    return;
  }
  try {
    core.info('🚿 Removing keys');
    const privateKey = await openpgp.readPrivateKey(process.env.GPG_PRIVATE_KEY);
    await gpg.deleteKey(privateKey.fingerprint);

    core.info('💀 Killing GnuPG agent');
    await gpg.killAgent();
  } catch (error) {
    core.warning(error.message);
  }
}

// Main
if (!stateHelper.IsPost) {
  run();
}
// Post
else {
  cleanup();
}
