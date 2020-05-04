import * as core from '@actions/core';
import * as gpg from './gpg';
import * as openpgp from './openpgp';
import * as stateHelper from './state-helper';
import * as exec from '@actions/exec';

async function run(): Promise<void> {
  try {
    if (!process.env.SIGNING_KEY) {
      core.setFailed('Signing key required');
      return;
    }

    core.info('📣 GnuPG info');
    await exec.exec('which', ['gpg']);
    const version = await gpg.getVersion();
    const dirs = await gpg.getDirs();
    core.info(`Version    : ${version.gnupg} (libgcrypt ${version.libgcrypt})`);
    core.info(`Libdir     : ${dirs.libdir}`);
    core.info(`Libexecdir : ${dirs.libexecdir}`);
    core.info(`Datadir    : ${dirs.datadir}`);
    core.info(`Homedir    : ${dirs.homedir}`);

    core.info('🔮 Checking signing key...');
    const privateKey = await openpgp.readPrivateKey(process.env.SIGNING_KEY);
    core.debug(`Fingerprint  : ${privateKey.fingerprint}`);
    core.debug(`KeyID        : ${privateKey.keyID}`);
    core.debug(`UserID       : ${privateKey.userID}`);
    core.debug(`CreationTime : ${privateKey.creationTime}`);

    core.info('🔑 Importing secret key...');
    await gpg.importKey(process.env.SIGNING_KEY).then(stdout => {
      core.debug(stdout);
    });

    if (process.env.PASSPHRASE) {
      core.info('⚙️ Configuring GnuPG agent...');
      await gpg.configureAgent(gpg.agentConfig);

      core.info('📌 Getting keygrip...');
      const keygrip = await gpg.getKeygrip(privateKey.fingerprint);
      core.debug(`${keygrip}`);

      core.info('🔓 Preset passphrase...');
      await gpg.presetPassphrase(keygrip, process.env.PASSPHRASE).then(stdout => {
        core.debug(stdout);
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function cleanup(): Promise<void> {
  if (!process.env.SIGNING_KEY) {
    core.debug('Signing key is not defined. Skipping cleanup.');
    return;
  }
  try {
    core.info('🚿 Removing keys...');
    const privateKey = await openpgp.readPrivateKey(process.env.SIGNING_KEY);
    await gpg.deleteKey(privateKey.fingerprint);
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
