import * as core from '@actions/core';

export const IsPost = !!process.env['STATE_isPost'];
export const gpgPrivateKey = process.env['STATE_gpgPrivateKey'] || '';

export function setGpgPrivateKey(gpgPrivateKey: string) {
  core.saveState('gpgPrivateKey', gpgPrivateKey);
}

if (!IsPost) {
  core.saveState('isPost', 'true');
}
