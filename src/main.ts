import * as core from '@actions/core';
import * as context from './context';
import * as git from './git';
import * as gpg from './gpg';
import * as openpgp from './openpgp';
import * as stateHelper from './state-helper';

async function run(): Promise<void> {
  try {
    const inputs: context.Inputs = await context.getInputs();

    if (inputs.workdir && inputs.workdir !== '.') {
      core.info(`Using ${inputs.workdir} as working directory...`);
      process.chdir(inputs.workdir);
    }

    const version = await gpg.getVersion();
    const dirs = await gpg.getDirs();
    await core.group(`GnuPG info`, async () => {
      core.info(`Version    : ${version.gnupg} (libgcrypt ${version.libgcrypt})`);
      core.info(`Libdir     : ${dirs.libdir}`);
      core.info(`Libexecdir : ${dirs.libexecdir}`);
      core.info(`Datadir    : ${dirs.datadir}`);
      core.info(`Homedir    : ${dirs.homedir}`);
    });

    const privateKey = await openpgp.readPrivateKey(inputs.gpgPrivateKey);
    await core.group(`GPG private key info`, async () => {
      core.info(`Fingerprint  : ${privateKey.fingerprint}`);
      core.info(`KeyID        : ${privateKey.keyID}`);
      core.info(`Name         : ${privateKey.name}`);
      core.info(`Email        : ${privateKey.email}`);
      core.info(`CreationTime : ${privateKey.creationTime}`);
    });

    stateHelper.setFingerprint(privateKey.fingerprint);

    let fingerprint = privateKey.fingerprint;
    if (inputs.fingerprint) {
      fingerprint = inputs.fingerprint;
    }

    await core.group(`Fingerprint to use`, async () => {
      core.info(fingerprint);
    });

    await core.group(`Importing GPG private key`, async () => {
      await gpg.importKey(inputs.gpgPrivateKey).then(stdout => {
        core.info(stdout);
      });
    });

    if (inputs.passphrase && !inputs.fingerprint) {
      // Set the passphrase for all subkeys

      core.info('Configuring GnuPG agent');
      await gpg.configureAgent(gpg.agentConfig);

      await core.group(`Getting keygrips`, async () => {
        for (const keygrip of await gpg.getKeygrips(fingerprint)) {
          core.info(`Presetting passphrase for ${keygrip}`);
          await gpg.presetPassphrase(keygrip, inputs.passphrase).then(stdout => {
            core.debug(stdout);
          });
        }
      });
    }

    if (inputs.passphrase && inputs.fingerprint) {
      // Set the passphrase only for the subkey specified in the input `fingerprint`

      core.info('Configuring GnuPG agent');
      await gpg.configureAgent(gpg.agentConfig);

      await core.group(`Getting keygrip for fingerprint`, async () => {
        const keygrip = await gpg.getKeygrip(fingerprint);
        core.info(`Presetting passphrase for key ${fingerprint} with keygrip ${keygrip}`);
        await gpg.presetPassphrase(keygrip, inputs.passphrase).then(stdout => {
          core.debug(stdout);
        });
      });
    }

    if (inputs.trustLevel) {
      await core.group(`Setting key's trust level`, async () => {
        await gpg.setTrustLevel(privateKey.keyID, inputs.trustLevel).then(() => {
          core.info(`Trust level set to ${inputs.trustLevel} for ${privateKey.keyID}`);
        });
      });
    }

    await core.group(`Setting outputs`, async () => {
      core.info(`fingerprint=${fingerprint}`);
      core.setOutput('fingerprint', fingerprint);
      core.info(`keyid=${privateKey.keyID}`);
      core.setOutput('keyid', privateKey.keyID);
      core.info(`name=${privateKey.name}`);
      core.setOutput('name', privateKey.name);
      core.info(`email=${privateKey.email}`);
      core.setOutput('email', privateKey.email);
    });

    if (inputs.gitUserSigningkey) {
      core.info('Setting GPG signing keyID for this Git repository');
      await git.setConfig('user.signingkey', privateKey.keyID, inputs.gitConfigGlobal);

      const userEmail = inputs.gitCommitterEmail || privateKey.email;
      const userName = inputs.gitCommitterName || privateKey.name;

      if (userEmail != privateKey.email) {
        core.setFailed(`Committer email "${inputs.gitCommitterEmail}" (name: "${inputs.gitCommitterName}") does not match GPG private key email "${privateKey.email}" (name: "${privateKey.name}")`);
        return;
      }

      core.info(`Configuring Git committer (${userName} <${userEmail}>)`);
      await git.setConfig('user.name', userName, inputs.gitConfigGlobal);
      await git.setConfig('user.email', userEmail, inputs.gitConfigGlobal);

      if (inputs.gitCommitGpgsign) {
        core.info('Sign all commits automatically');
        await git.setConfig('commit.gpgsign', 'true', inputs.gitConfigGlobal);
      }
      if (inputs.gitTagGpgsign) {
        core.info('Sign all tags automatically');
        await git.setConfig('tag.gpgsign', 'true', inputs.gitConfigGlobal);
      }
      if (inputs.gitPushGpgsign) {
        core.info('Sign all pushes automatically');
        await git.setConfig('push.gpgsign', inputs.gitPushGpgsign, inputs.gitConfigGlobal);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function cleanup(): Promise<void> {
  if (stateHelper.fingerprint.length <= 0) {
    core.debug('Primary key fingerprint is not defined. Skipping cleanup.');
    return;
  }
  try {
    core.info(`Removing key ${stateHelper.fingerprint}`);
    await gpg.deleteKey(stateHelper.fingerprint);

    core.info('Killing GnuPG agent');
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
