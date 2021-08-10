import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as openpgp from './openpgp';

export const agentConfig = `default-cache-ttl 7200
max-cache-ttl 31536000
allow-preset-passphrase`;

export interface Version {
  gnupg: string;
  libgcrypt: string;
}

export interface Dirs {
  libdir: string;
  libexecdir: string;
  datadir: string;
  homedir: string;
}

const getGnupgHome = async (): Promise<string> => {
  if (process.env.GNUPGHOME) {
    return process.env.GNUPGHOME;
  }
  let homedir: string = path.join(process.env.HOME || '', '.gnupg');
  if (os.platform() == 'win32' && !process.env.HOME) {
    homedir = path.join(process.env.USERPROFILE || '', '.gnupg');
  }
  return homedir;
};

const gpgConnectAgent = async (command: string): Promise<string> => {
  return await exec
    .getExecOutput(`gpg-connect-agent "${command}" /bye`, [], {
      ignoreReturnCode: true,
      silent: true
    })
    .then(res => {
      if (res.stderr.length > 0 && res.exitCode != 0) {
        throw new Error(res.stderr);
      }
      for (let line of res.stdout.replace(/\r/g, '').trim().split(/\n/g)) {
        if (line.startsWith('ERR')) {
          throw new Error(line);
        }
      }
      return res.stdout.trim();
    });
};

export const getVersion = async (): Promise<Version> => {
  return await exec
    .getExecOutput('gpg', ['--version'], {
      ignoreReturnCode: true,
      silent: true
    })
    .then(res => {
      if (res.stderr.length > 0 && res.exitCode != 0) {
        throw new Error(res.stderr);
      }

      let gnupgVersion: string = '';
      let libgcryptVersion: string = '';

      for (let line of res.stdout.replace(/\r/g, '').trim().split(/\n/g)) {
        if (line.startsWith('gpg (GnuPG) ')) {
          gnupgVersion = line.substr('gpg (GnuPG) '.length).trim();
        } else if (line.startsWith('gpg (GnuPG/MacGPG2) ')) {
          gnupgVersion = line.substr('gpg (GnuPG/MacGPG2) '.length).trim();
        } else if (line.startsWith('libgcrypt ')) {
          libgcryptVersion = line.substr('libgcrypt '.length).trim();
        }
      }

      return {
        gnupg: gnupgVersion,
        libgcrypt: libgcryptVersion
      };
    });
};

export const getDirs = async (): Promise<Dirs> => {
  return await exec
    .getExecOutput('gpgconf', ['--list-dirs'], {
      ignoreReturnCode: true,
      silent: true
    })
    .then(res => {
      if (res.stderr.length > 0 && res.exitCode != 0) {
        throw new Error(res.stderr);
      }

      let libdir: string = '';
      let libexecdir: string = '';
      let datadir: string = '';
      let homedir: string = '';

      for (let line of res.stdout.replace(/\r/g, '').trim().split(/\n/g)) {
        if (line.startsWith('libdir:')) {
          libdir = line.substr('libdir:'.length).replace('%3a', ':').trim();
        } else if (line.startsWith('libexecdir:')) {
          libexecdir = line.substr('libexecdir:'.length).replace('%3a', ':').trim();
        } else if (line.startsWith('datadir:')) {
          datadir = line.substr('datadir:'.length).replace('%3a', ':').trim();
        } else if (line.startsWith('homedir:')) {
          homedir = line.substr('homedir:'.length).replace('%3a', ':').trim();
        }
      }

      return {
        libdir: libdir,
        libexecdir: libexecdir,
        datadir: datadir,
        homedir: homedir
      };
    });
};

export const importKey = async (key: string): Promise<string> => {
  const keyFolder: string = fs.mkdtempSync(path.join(os.tmpdir(), 'ghaction-import-gpg-'));
  const keyPath: string = `${keyFolder}/key.pgp`;
  fs.writeFileSync(keyPath, (await openpgp.isArmored(key)) ? key : Buffer.from(key, 'base64').toString(), {mode: 0o600});

  return await exec
    .getExecOutput('gpg', ['--import', '--batch', '--yes', keyPath], {
      ignoreReturnCode: true,
      silent: true
    })
    .then(res => {
      if (res.stderr.length > 0 && res.exitCode != 0) {
        throw new Error(res.stderr);
      }
      if (res.stderr != '') {
        return res.stderr.trim();
      }
      return res.stdout.trim();
    })
    .finally(() => {
      fs.unlinkSync(keyPath);
    });
};

export const getKeygrips = async (fingerprint: string): Promise<Array<string>> => {
  return await exec
    .getExecOutput('gpg', ['--batch', '--with-colons', '--with-keygrip', '--list-secret-keys', fingerprint], {
      ignoreReturnCode: true,
      silent: true
    })
    .then(res => {
      let keygrips: Array<string> = [];
      for (let line of res.stdout.replace(/\r/g, '').trim().split(/\n/g)) {
        if (line.startsWith('grp')) {
          keygrips.push(line.replace(/(grp|:)/g, '').trim());
        }
      }
      return keygrips;
    });
};

export const configureAgent = async (config: string): Promise<void> => {
  const gpgAgentConf = path.join(await getGnupgHome(), 'gpg-agent.conf');
  await fs.writeFile(gpgAgentConf, config, function (err) {
    if (err) throw err;
  });
  await gpgConnectAgent('RELOADAGENT');
};

export const presetPassphrase = async (keygrip: string, passphrase: string): Promise<string> => {
  const hexPassphrase: string = Buffer.from(passphrase, 'utf8').toString('hex').toUpperCase();
  await gpgConnectAgent(`PRESET_PASSPHRASE ${keygrip} -1 ${hexPassphrase}`);
  return await gpgConnectAgent(`KEYINFO ${keygrip}`);
};

export const deleteKey = async (fingerprint: string): Promise<void> => {
  await exec
    .getExecOutput('gpg', ['--batch', '--yes', '--delete-secret-keys', fingerprint], {
      ignoreReturnCode: true,
      silent: true
    })
    .then(res => {
      if (res.stderr.length > 0 && res.exitCode != 0) {
        throw new Error(res.stderr);
      }
    });
  await exec
    .getExecOutput('gpg', ['--batch', '--yes', '--delete-keys', fingerprint], {
      ignoreReturnCode: true,
      silent: true
    })
    .then(res => {
      if (res.stderr.length > 0 && res.exitCode != 0) {
        throw new Error(res.stderr);
      }
    });
};

export const killAgent = async (): Promise<void> => {
  await gpgConnectAgent('KILLAGENT');
};
