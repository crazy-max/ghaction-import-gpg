import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghaction-import-gpg-'));

process.env = Object.assign({}, process.env, {
  TEMP: tmpDir,
  RUNNER_TEMP: path.join(tmpDir, 'runner-temp'),
  RUNNER_TOOL_CACHE: path.join(tmpDir, 'runner-tool-cache')
});
