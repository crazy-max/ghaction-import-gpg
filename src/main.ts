import * as core from '@actions/core';
import * as gpg from './gpg';
import * as openpgp from './openpgp';
import * as stateHelper from './state-helper';

async function run(): Promise<void> {
  try {
    if (!process.env.SIGNING_KEY) {
      core.setFailed('Signing key required');
      return;
    }

    core.info('📣 GnuPG info');
    const version = await gpg.getVersion();
    core.info(`GnuPG version: ${version.gnupg}`);
    core.info(`libgcrypt version: ${version.libgcrypt}`);

    core.info('🔮 Checking signing key...');
    const privateKey = await openpgp.readPrivateKey(process.env.SIGNING_KEY);
    core.debug(`key.fingerprint=${privateKey.fingerprint}`);
    core.debug(`key.keyID=${privateKey.keyID}`);
    core.debug(`key.userID=${privateKey.userID}`);
    core.debug(`key.creationTime=${privateKey.creationTime}`);

    core.info('🔑 Importing secret key...');
    await gpg.importKey(process.env.SIGNING_KEY);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function cleanup(): Promise<void> {
  if (!process.env.SIGNING_KEY) {
    core.debug('Private key is not defined. Skipping cleanup.');
    return;
  }
  try {
    core.info('🚿 Removing keys from GnuPG...');
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
