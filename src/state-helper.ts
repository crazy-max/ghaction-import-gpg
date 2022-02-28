import * as core from '@actions/core';

export const IsPost = !!process.env['STATE_isPost'];
export const fingerprint = process.env['STATE_fingerprint'] || '';
export const keyId = process.env['STATE_keyId'] || '';

export function setFingerprint(fingerprint: string) {
  core.saveState('fingerprint', fingerprint);
}

export function setKeyID(keyID: string) {
  core.saveState('keyId', keyID);
}

if (!IsPost) {
  core.saveState('isPost', 'true');
}
