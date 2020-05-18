import * as fs from 'fs';
import * as openpgp from '../src/openpgp';

const userInfo = {
  pgp: fs.readFileSync('.github/test-key.pgp', {
    encoding: 'utf8',
    flag: 'r'
  }),
  pgp_base64: fs.readFileSync('.github/test-key-base64.pgp', {
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

describe('openpgp', () => {
  describe('readPrivateKey', () => {
    it('returns a PGP private key from an armored string', async () => {
      await openpgp.readPrivateKey(userInfo.pgp).then(privateKey => {
        expect(privateKey.keyID).toEqual(userInfo.keyID);
        expect(privateKey.name).toEqual(userInfo.name);
        expect(privateKey.email).toEqual(userInfo.email);
        expect(privateKey.fingerprint).toEqual(userInfo.fingerprint);
      });
    });
    it('returns a PGP private key from a base64 armored string', async () => {
      await openpgp.readPrivateKey(userInfo.pgp_base64).then(privateKey => {
        expect(privateKey.keyID).toEqual(userInfo.keyID);
        expect(privateKey.name).toEqual(userInfo.name);
        expect(privateKey.email).toEqual(userInfo.email);
        expect(privateKey.fingerprint).toEqual(userInfo.fingerprint);
      });
    });
  });

  describe('generateKeyPair', () => {
    it('generates a PGP key pair', async () => {
      await openpgp.generateKeyPair(userInfo.name, userInfo.email, userInfo.passphrase).then(keyPair => {
        expect(keyPair).not.toBeUndefined();
        expect(keyPair.publicKey).not.toBeUndefined();
        expect(keyPair.privateKey).not.toBeUndefined();
      });
    }, 30000);
  });

  describe('isArmored', () => {
    it('returns true for armored key string', async () => {
      await openpgp.isArmored(userInfo.pgp).then(armored => {
        expect(armored).toEqual(true);
      });
    });
    it('returns false for base64 key string', async () => {
      await openpgp.isArmored(userInfo.pgp_base64).then(armored => {
        expect(armored).toEqual(false);
      });
    });
  });
});
