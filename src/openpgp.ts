import * as openpgp from 'openpgp';
import addressparser from 'addressparser';

export interface UserId {
  name: string;
  email: string;
}

export interface PrivateKey {
  fingerprint: string;
  keyID: string;
  primaryUserId: UserId;
  allUserIds: UserId[];
  creationTime: Date;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export const readPrivateKey = async (key: string): Promise<PrivateKey> => {
  const privateKey = await openpgp.readKey({
    armoredKey: (await isArmored(key)) ? key : Buffer.from(key, 'base64').toString()
  });

  const primaryUserId: UserId = await privateKey.getPrimaryUser().then(primaryUser => {
    const address = addressparser(primaryUser.user.userID?.userID)[0];
    return {name: address.name, email: address.address};
  });
  const allUserIds: UserId[] = privateKey.getUserIDs().map(userId => {
    const address = addressparser(userId)[0];
    return {name: address.name, email: address.address};
  });

  return {
    fingerprint: privateKey.getFingerprint().toUpperCase(),
    keyID: privateKey.getKeyID().toHex().toUpperCase(),
    primaryUserId: primaryUserId,
    allUserIds: allUserIds,
    creationTime: privateKey.getCreationTime()
  };
};

export const generateKeyPair = async (name: string, email: string, passphrase: string, type?: 'ecc' | 'rsa'): Promise<KeyPair> => {
  const keyPair = await openpgp.generateKey({
    userIDs: [{name: name, email: email}],
    passphrase: passphrase,
    type: type
  });

  return {
    publicKey: keyPair.publicKey.replace(/\r\n/g, '\n').trim(),
    privateKey: keyPair.privateKey.replace(/\r\n/g, '\n').trim()
  };
};

export const isArmored = async (text: string): Promise<boolean> => {
  return text.trimLeft().startsWith('---');
};
