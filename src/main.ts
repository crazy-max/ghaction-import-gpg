import * as core from '@actions/core';
import * as context from './context';
import * as git from './git';
import * as gpg from './gpg';
import * as openpgp from './openpgp';
import * as stateHelper from './state-helper';

async function run(): Promise<void> {
  try {
    let inputs: context.Inputs = await context.getInputs();
    stateHelper.setGpgPrivateKey(inputs.gpgPrivateKey);

    if (inputs.workdir && inputs.workdir !== '.') {
      core.info(`📂 Using ${inputs.workdir} as working directory...`);
      process.chdir(inputs.workdir);
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
    const privateKey = await openpgp.readPrivateKey(inputs.gpgPrivateKey);
    core.debug(`Fingerprint  : ${privateKey.fingerprint}`);
    core.debug(`KeyID        : ${privateKey.keyID}`);
    core.debug(`Name         : ${privateKey.name}`);
    core.debug(`Email        : ${privateKey.email}`);
    core.debug(`CreationTime : ${privateKey.creationTime}`);

    core.info('🔑 Importing GPG private key');
    await gpg.importKey(inputs.gpgPrivateKey).then(stdout => {
      core.debug(stdout);
    });

    if (inputs.passphrase) {
      core.info('⚙️ Configuring GnuPG agent');
      await gpg.configureAgent(gpg.agentConfig);

      core.info('📌 Getting keygrips');
      for (let keygrip of await gpg.getKeygrips(privateKey.fingerprint)) {
        core.info(`🔓 Presetting passphrase for ${keygrip}`);
        await gpg.presetPassphrase(keygrip, inputs.passphrase).then(stdout => {
          core.debug(stdout);
        });
      }
    }

    core.info('🛒 Setting outputs...');
    core.setOutput('fingerprint', privateKey.fingerprint);
    core.setOutput('keyid', privateKey.keyID);
    core.setOutput('name', privateKey.name);
    core.setOutput('email', privateKey.email);

    if (inputs.gitUserSigningkey) {
      core.info('🔐 Setting GPG signing keyID for this Git repository');
      await git.setConfig('user.signingkey', privateKey.keyID);

      const userEmail = inputs.gitCommitterEmail || privateKey.email;
      const userName = inputs.gitCommitterName || privateKey.name;

      if (userEmail != privateKey.email) {
        core.setFailed('Committer email does not match GPG key user address');
        return;
      }

      core.info(`🔨 Configuring Git committer (${userName} <${userEmail}>)`);
      await git.setConfig('user.name', userName);
      await git.setConfig('user.email', userEmail);

      if (inputs.gitCommitGpgsign) {
        core.info('💎 Sign all commits automatically');
        await git.setConfig('commit.gpgsign', 'true');
      }
      if (inputs.gitTagGpgsign) {
        core.info('💎 Sign all tags automatically');
        await git.setConfig('tag.gpgsign', 'true');
      }
      if (inputs.gitPushGpgsign) {
        core.info('💎 Sign all pushes automatically');
        await git.setConfig('push.gpgsign', 'true');
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function cleanup(): Promise<void> {
  if (stateHelper.gpgPrivateKey.length <= 0) {
    core.debug('GPG private key is not defined. Skipping cleanup.');
    return;
  }
  try {
    core.info('🚿 Removing keys');
    const privateKey = await openpgp.readPrivateKey(stateHelper.gpgPrivateKey);
    await gpg.deleteKey(privateKey.fingerprint);

    core.info('💀 Killing GnuPG agent');
    await gpg.killAgent();
  } catch (error) {
    core.warning(error.message);
  }
}

if (!stateHelper.IsPost) {
  run();
} else {
  cleanup();
}
