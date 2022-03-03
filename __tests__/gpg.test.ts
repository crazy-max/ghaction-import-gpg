import * as fs from 'fs';
import * as gpg from '../src/gpg';
import {parseKeygripFromGpgColonsOutput} from '../src/gpg';

const userInfos = [
  {
    key: 'test-key',
    pgp: fs.readFileSync('__tests__/fixtures/test-key.pgp', {
      encoding: 'utf8',
      flag: 'r'
    }),
    pgp_base64: fs.readFileSync('__tests__/fixtures/test-key-base64.pgp', {
      encoding: 'utf8',
      flag: 'r'
    }),
    passphrase: fs.readFileSync('__tests__/fixtures/test-key.pass', {
      encoding: 'utf8',
      flag: 'r'
    }),
    name: 'Joe Tester',
    email: 'joe@foo.bar',
    keyID: '7D851EB72D73BDA0',
    primary_key_fingerprint: '27571A53B86AF0C799B38BA77D851EB72D73BDA0',
    fingerprint: '27571A53B86AF0C799B38BA77D851EB72D73BDA0',
    fingerprints: ['27571A53B86AF0C799B38BA77D851EB72D73BDA0', '5A282E1460C0BC419615D34DD523BD50DD70B0BA'],
    keygrips: ['3E2D1142AA59E08E16B7E2C64BA6DDC773B1A627', 'BA83FC8947213477F28ADC019F6564A956456163']
  },
  {
    key: 'test-subkey',
    pgp: fs.readFileSync('__tests__/fixtures/test-subkey.pgp', {
      encoding: 'utf8',
      flag: 'r'
    }),
    pgp_base64: fs.readFileSync('__tests__/fixtures/test-subkey-base64.pgp', {
      encoding: 'utf8',
      flag: 'r'
    }),
    passphrase: fs.readFileSync('__tests__/fixtures/test-subkey.pass', {
      encoding: 'utf8',
      flag: 'r'
    }),
    name: 'Joe Bar',
    email: 'joe@bar.foo',
    keyID: '6071D218380FDCC8',
    primary_key_fingerprint: '87F257B89CE462100BEC0FFE6071D218380FDCC8',
    fingerprint: 'C17D11ADF199F12A30A0910F1F80449BE0B08CB8',
    fingerprints: ['87F257B89CE462100BEC0FFE6071D218380FDCC8', 'C17D11ADF199F12A30A0910F1F80449BE0B08CB8'],
    keygrips: ['F5C3ABFAAB36B427FD98C4EDD0387E08EA1E8092', 'DEE0FC98F441519CA5DE5D79773CB29009695FEB']
  }
];

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

describe('configureAgent', () => {
  it('configures GnuPG agent', async () => {
    await gpg.configureAgent(gpg.agentConfig);
  });
});

for (let userInfo of userInfos) {
  describe(userInfo.key, () => {
    describe('importKey', () => {
      it('imports key (as armored string) to GnuPG', async () => {
        await gpg.importKey(userInfo.pgp).then(output => {
          console.log(output);
          expect(output).not.toEqual('');
        });
      });
      it('imports key (as base64 string) to GnuPG', async () => {
        await gpg.importKey(userInfo.pgp_base64).then(output => {
          console.log(output);
          expect(output).not.toEqual('');
        });
      });
    });

    describe('getKeygrips', () => {
      it('returns the keygrips', async () => {
        await gpg.importKey(userInfo.pgp);
        await gpg.getKeygrips(userInfo.fingerprint).then(keygrips => {
          console.log(keygrips);
          expect(keygrips.length).toEqual(userInfo.keygrips.length);
          for (let i = 0; i < keygrips.length; i++) {
            expect(keygrips[i]).toEqual(userInfo.keygrips[i]);
          }
        });
      });
    });

    describe('getKeygrip', () => {
      it('returns the keygrip for a given fingerprint', async () => {
        await gpg.importKey(userInfo.pgp);
        for (let [i, fingerprint] of userInfo.fingerprints.entries()) {
          await gpg.getKeygrip(fingerprint).then(keygrip => {
            console.log(`Fingerprint: ${fingerprint}; Index: ${i}; Keygrip: ${keygrip}`);
            expect(keygrip.length).toEqual(userInfo.keygrips[i].length);
            expect(keygrip).toEqual(userInfo.keygrips[i]);
          });
        }
      });
    });

    describe('presetPassphrase', () => {
      it('presets passphrase', async () => {
        await gpg.importKey(userInfo.pgp);
        await gpg.configureAgent(gpg.agentConfig);
        for (let keygrip of await gpg.getKeygrips(userInfo.fingerprint)) {
          await gpg.presetPassphrase(keygrip, userInfo.passphrase).then(output => {
            console.log(output);
            expect(output).not.toEqual('');
          });
        }
      });
    });

    describe('deleteKey', () => {
      it('removes key from GnuPG', async () => {
        await gpg.importKey(userInfo.pgp);
        await gpg.deleteKey(userInfo.primary_key_fingerprint);
      });
    });
  });
}

describe('killAgent', () => {
  it('kills GnuPG agent', async () => {
    await gpg.killAgent();
  });
});

describe('parseKeygripFromGpgColonsOutput', () => {
  it('returns the keygrip of a given fingerprint from a GPG command output using the option: --with-colons', async () => {
    const outputUsingTestKey = fs.readFileSync('__tests__/fixtures/test-key-gpg-output.txt', {
      encoding: 'utf8',
      flag: 'r'
    });

    const keygripPrimaryTestKey = parseKeygripFromGpgColonsOutput(outputUsingTestKey, '27571A53B86AF0C799B38BA77D851EB72D73BDA0');
    expect(keygripPrimaryTestKey).toBe('3E2D1142AA59E08E16B7E2C64BA6DDC773B1A627');

    const keygripSubkeyTestKey = parseKeygripFromGpgColonsOutput(outputUsingTestKey, '5A282E1460C0BC419615D34DD523BD50DD70B0BA');
    expect(keygripSubkeyTestKey).toBe('BA83FC8947213477F28ADC019F6564A956456163');

    const outputUsingTestSubkey = fs.readFileSync('__tests__/fixtures/test-subkey-gpg-output.txt', {
      encoding: 'utf8',
      flag: 'r'
    });

    const keygripPrimaryTestSubkey = parseKeygripFromGpgColonsOutput(outputUsingTestSubkey, '87F257B89CE462100BEC0FFE6071D218380FDCC8');
    expect(keygripPrimaryTestSubkey).toBe('F5C3ABFAAB36B427FD98C4EDD0387E08EA1E8092');

    const keygripSubkeyTestSubkey = parseKeygripFromGpgColonsOutput(outputUsingTestSubkey, 'C17D11ADF199F12A30A0910F1F80449BE0B08CB8');
    expect(keygripSubkeyTestSubkey).toBe('DEE0FC98F441519CA5DE5D79773CB29009695FEB');
  });
});
