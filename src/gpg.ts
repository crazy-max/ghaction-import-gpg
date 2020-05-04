import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as exec from './exec';

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

const getGpgPresetPassphrasePath = async (): Promise<string> => {
  const {libexecdir: libexecdir} = await getDirs();
  let gpgPresetPassphrasePath = path.join(libexecdir, 'gpg-preset-passphrase');
  if (os.platform() == 'win32' && !gpgPresetPassphrasePath.includes(':')) {
    gpgPresetPassphrasePath = path.join(process.env.HOMEDRIVE || '', libexecdir, 'gpg-preset-passphrase.exe');
  }
  return gpgPresetPassphrasePath;
};

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

export const getVersion = async (): Promise<Version> => {
  return await exec.exec('gpg', ['--version'], true).then(res => {
    if (res.stderr != '') {
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
  return await exec.exec('gpgconf', ['--list-dirs'], true).then(res => {
    if (res.stderr != '' && !res.success) {
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

export const importKey = async (armoredText: string): Promise<string> => {
  const keyFolder: string = fs.mkdtempSync(path.join(os.tmpdir(), 'ghaction-import-gpg-'));
  const keyPath: string = `${keyFolder}/key.pgp`;
  fs.writeFileSync(keyPath, armoredText, {mode: 0o600});

  return await exec
    .exec('gpg', ['--import', '--batch', '--yes', keyPath], true)
    .then(res => {
      if (res.stderr != '' && !res.success) {
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

export const getKeygrip = async (fingerprint: string): Promise<string> => {
  return await exec
    .exec('gpg', ['--batch', '--with-colons', '--with-keygrip', '--list-secret-keys', fingerprint], true)
    .then(res => {
      if (res.stderr != '' && !res.success) {
        throw new Error(res.stderr);
      }
      let keygrip: string = '';
      for (let line of res.stdout.replace(/\r/g, '').trim().split(/\n/g)) {
        if (line.startsWith('grp')) {
          keygrip = line.replace(/(grp|:)/g, '').trim();
        }
      }
      return keygrip;
    });
};

export const configureAgent = async (config: string): Promise<void> => {
  const gpgAgentConf = path.join(await getGnupgHome(), 'gpg-agent.conf');
  await fs.writeFile(gpgAgentConf, config, function (err) {
    if (err) throw err;
  });

  await exec.exec(`gpg-connect-agent "RELOADAGENT" /bye`, [], true).then(res => {
    if (res.stderr != '' && !res.success) {
      throw new Error(res.stderr);
    }
  });
};

export const presetPassphrase = async (keygrip: string, passphrase: string): Promise<string> => {
  await exec
    .exec(
      await getGpgPresetPassphrasePath(),
      ['--verbose', '--preset', '--passphrase', `"${passphrase}"`, keygrip],
      true
    )
    .then(res => {
      if (res.stderr != '' && !res.success) {
        throw new Error(res.stderr);
      }
    });

  return await exec.exec(`gpg-connect-agent "KEYINFO ${keygrip}" /bye`, [], true).then(res => {
    if (res.stderr != '' && !res.success) {
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

export const deleteKey = async (fingerprint: string): Promise<void> => {
  await exec.exec('gpg', ['--batch', '--yes', '--delete-secret-keys', fingerprint], true).then(res => {
    if (res.stderr != '' && !res.success) {
      throw new Error(res.stderr);
    }
  });
  await exec.exec('gpg', ['--batch', '--yes', '--delete-keys', fingerprint], true).then(res => {
    if (res.stderr != '' && !res.success) {
      throw new Error(res.stderr);
    }
  });
};
