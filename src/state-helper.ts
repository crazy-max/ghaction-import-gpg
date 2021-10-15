import * as core from '@actions/core';

export const IsPost = !!process.env['STATE_isPost'];
export const fingerprint = process.env['STATE_fingerprint'] || '';

export function setFingerprint(fingerprint: string) {
  core.saveState('fingerprint', fingerprint);
}

if (!IsPost) {
  core.saveState('isPost', 'true');
}
