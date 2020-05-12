import * as fs from 'fs';
import * as gpg from '../src/gpg';

const userInfo = {
  pgp: fs.readFileSync('.github/test-key.pgp', {
    encoding: 'utf8',
    flag: 'r'
  }),
  passphrase: fs.readFileSync('.github/test-key.pass', {
    encoding: 'utf8',
    flag: 'r'
  }),
  name: 'Joe Tester',
  email: 'joe@foo.bar',
  keyID: 'D523BD50DD70B0BA',
  fingerprint: '27571A53B86AF0C799B38BA77D851EB72D73BDA0',
  keygrip: '3E2D1142AA59E08E16B7E2C64BA6DDC773B1A627'
};

describe('gpg', () => {
  describe('getVersion', () => {
    it('returns GnuPG and libgcrypt version', async () => {
      await gpg.getVersion().then(version => {
        console.log(version);
        expect(version.gnupg).not.toEqual('');
        expect(version.libgcrypt).not.toEqual('');
      });
    });
  });

  describe('getDirs', () => {
    it('returns GnuPG dirs', async () => {
      await gpg.getDirs().then(dirs => {
        console.log(dirs);
        expect(dirs.libdir).not.toEqual('');
        expect(dirs.datadir).not.toEqual('');
        expect(dirs.homedir).not.toEqual('');
      });
    });
  });

  describe('importKey', () => {
    it('imports key to GnuPG', async () => {
      await gpg.importKey(userInfo.pgp).then(output => {
        console.log(output);
        expect(output).not.toEqual('');
      });
    });
  });

  describe('getKeygrip', () => {
    it('returns the keygrip', async () => {
      await gpg.importKey(userInfo.pgp);
      await gpg.getKeygrip(userInfo.fingerprint).then(keygrip => {
        console.log(keygrip);
        expect(keygrip).toEqual(userInfo.keygrip);
      });
    });
  });

  describe('configureAgent', () => {
    it('configures GnuPG agent', async () => {
      await gpg.configureAgent(gpg.agentConfig);
    });
  });

  describe('presetPassphrase', () => {
    it('presets passphrase', async () => {
      await gpg.importKey(userInfo.pgp);
      const keygrip = await gpg.getKeygrip(userInfo.fingerprint);
      await gpg.configureAgent(gpg.agentConfig);
      await gpg.presetPassphrase(keygrip, userInfo.passphrase).then(output => {
        console.log(output);
        expect(output).not.toEqual('');
      });
    });
  });

  describe('deleteKey', () => {
    it('removes key from GnuPG', async () => {
      await gpg.importKey(userInfo.pgp);
      await gpg.deleteKey(userInfo.fingerprint);
    });
  });

  describe('killAgent', () => {
    it('kills GnuPG agent', async () => {
      await gpg.killAgent();
    });
  });
});
