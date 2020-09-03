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
    const git_committer_name: string = core.getInput('git_committer_name');
    const git_committer_email: string = core.getInput('git_committer_email');
    const workdir: string = core.getInput('workdir') || '.';

    if (workdir && workdir !== '.') {
      core.info(`📂 Using ${workdir} as working directory...`);
      process.chdir(workdir);
    }

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

      core.info('📌 Getting keygrips');
      const keygrips = await gpg.getKeygrips(privateKey.fingerprint);

      for (let keygrip of await gpg.getKeygrips(privateKey.fingerprint)) {
        core.info(`🔓 Presetting passphrase for ${keygrip}`);
        await gpg.presetPassphrase(keygrip, process.env.PASSPHRASE).then(stdout => {
          core.debug(stdout);
        });
      }
    }

    core.info('🛒 Setting outputs...');
    core.setOutput('fingerprint', privateKey.fingerprint);
    core.setOutput('keyid', privateKey.keyID);
    core.setOutput('name', privateKey.name);
    core.setOutput('email', privateKey.email);

    if (git_user_signingkey) {
      core.info('🔐 Setting GPG signing keyID for this Git repository');
      await git.setConfig('user.signingkey', privateKey.keyID);

      const user_email = git_committer_email || privateKey.email;
      const user_name = git_committer_name || privateKey.name;

      if (user_email != privateKey.email) {
        core.setFailed('Committer email does not match GPG key user address');
        return;
      }

      core.info(`🔨 Configuring Git committer (${user_name} <${user_email}>)`);
      await git.setConfig('user.name', user_name);
      await git.setConfig('user.email', user_email);

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
