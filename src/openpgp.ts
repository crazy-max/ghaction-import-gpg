import * as openpgp from 'openpgp';
import addressparser from 'addressparser';

export interface PrivateKey {
  fingerprint: string;
  keyID: string;
  name: string;
  email: string;
  creationTime: Date;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export const readPrivateKey = async (armoredText: string): Promise<PrivateKey> => {
  const {
    keys: [privateKey],
    err: err
  } = await openpgp.key.readArmored(armoredText);
  if (err?.length) {
    throw err[0];
  }

  const address = await privateKey.getPrimaryUser().then(primaryUser => {
    return addressparser(primaryUser.user.userId.userid)[0];
  });

  return {
    fingerprint: privateKey.getFingerprint().toUpperCase(),
    keyID: await privateKey.getEncryptionKey().then(encKey => {
      // @ts-ignore
      return encKey?.getKeyId().toHex().toUpperCase();
    }),
    name: address.name,
    email: address.address,
    creationTime: privateKey.getCreationTime()
  };
};

export const generateKeyPair = async (
  name: string,
  email: string,
  passphrase: string,
  numBits: number = 4096
): Promise<KeyPair> => {
  const keyPair = await openpgp.generateKey({
    userIds: [{name: name, email: email}],
    numBits,
    passphrase
  });

  return {
    publicKey: keyPair.publicKeyArmored.replace(/\r\n/g, '\n').trim(),
    privateKey: keyPair.privateKeyArmored.replace(/\r\n/g, '\n').trim()
  };
};
