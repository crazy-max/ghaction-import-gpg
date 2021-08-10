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

    const version = await gpg.getVersion();
    const dirs = await gpg.getDirs();
    await core.group(`📣 GnuPG info`, async () => {
      core.info(`Version    : ${version.gnupg} (libgcrypt ${version.libgcrypt})`);
      core.info(`Libdir     : ${dirs.libdir}`);
      core.info(`Libexecdir : ${dirs.libexecdir}`);
      core.info(`Datadir    : ${dirs.datadir}`);
      core.info(`Homedir    : ${dirs.homedir}`);
    });

    const privateKey = await openpgp.readPrivateKey(inputs.gpgPrivateKey);
    await core.group(`🔮 Checking GPG private key`, async () => {
      core.info(`Fingerprint  : ${privateKey.fingerprint}`);
      core.info(`KeyID        : ${privateKey.keyID}`);
      core.info(`Name         : ${privateKey.name}`);
      core.info(`Email        : ${privateKey.email}`);
      core.info(`CreationTime : ${privateKey.creationTime}`);
    });

    await core.group(`🔑 Importing GPG private key`, async () => {
      await gpg.importKey(inputs.gpgPrivateKey).then(stdout => {
        core.info(stdout);
      });
    });

    if (inputs.passphrase) {
      core.info('⚙️ Configuring GnuPG agent');
      await gpg.configureAgent(gpg.agentConfig);

      core.info('📌 Getting keygrips');
      await core.group(`📌 Getting keygrips`, async () => {
        for (let keygrip of await gpg.getKeygrips(privateKey.fingerprint)) {
          core.info(`🔓 Presetting passphrase for ${keygrip}`);
          await gpg.presetPassphrase(keygrip, inputs.passphrase).then(stdout => {
            core.debug(stdout);
          });
        }
      });
    }

    core.info('🛒 Setting outputs...');
    context.setOutput('fingerprint', privateKey.fingerprint);
    context.setOutput('keyid', privateKey.keyID);
    context.setOutput('name', privateKey.name);
    context.setOutput('email', privateKey.email);

    if (inputs.gitUserSigningkey) {
      core.info('🔐 Setting GPG signing keyID for this Git repository');
      await git.setConfig('user.signingkey', privateKey.keyID);

      const userEmail = inputs.gitCommitterEmail || privateKey.email;
      const userName = inputs.gitCommitterName || privateKey.name;

      if (userEmail != privateKey.email) {
        core.setFailed(`Committer email "${inputs.gitCommitterEmail}" (name: "${inputs.gitCommitterName}") does not match GPG private key email "${privateKey.email}" (name: "${privateKey.name}")`);
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
        await git.setConfig('push.gpgsign', inputs.gitPushGpgsign);
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
