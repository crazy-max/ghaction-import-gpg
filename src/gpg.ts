import {unlinkSync, writeFileSync} from 'fs';
import child_process from 'child_process';

export interface Version {
  gnupg: string;
  libgcrypt: string;
}

const gpg = async (args: string[] = []): Promise<string> => {
  return child_process
    .execSync(`gpg ${args.join(' ')}`, {
      encoding: 'utf8'
    })
    .trim();
};

export const getVersion = async (): Promise<Version> => {
  let gnupgVersion: string = '';
  let libgcryptVersion: string = '';

  await gpg(['--version']).then(stdout => {
    for (let line of stdout.replace(/\r/g, '').trim().split(/\n/g)) {
      if (line.startsWith('gpg (GnuPG) ')) {
        gnupgVersion = line.substr('gpg (GnuPG) '.length).trim();
      } else if (line.startsWith('gpg (GnuPG/MacGPG2) ')) {
        gnupgVersion = line.substr('gpg (GnuPG/MacGPG2) '.length).trim();
      } else if (line.startsWith('libgcrypt ')) {
        libgcryptVersion = line.substr('libgcrypt '.length).trim();
      }
    }
  });

  return {
    gnupg: gnupgVersion,
    libgcrypt: libgcryptVersion
  };
};

export const importKey = async (armoredText: string): Promise<void> => {
  const keyPath: string = `${process.env.HOME}/key.pgp`;
  writeFileSync(keyPath, armoredText, {mode: 0o600});

  await gpg(['--import', '--batch', '--yes', keyPath]).finally(() => {
    unlinkSync(keyPath);
  });
};

export const deleteKey = async (fingerprint: string): Promise<void> => {
  await gpg(['--batch', '--yes', ' --delete-secret-keys', fingerprint]);
  await gpg(['--batch', '--yes', ' --delete-keys', fingerprint]);
};
