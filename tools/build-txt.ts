import path from 'path';
import fs from 'fs-extra';

import { version } from '../package.json';

const DIST_DIR = '../dist';
const BUILD_TXT_FILENAME = 'build.txt';

const buildTxt = async () => {
    const content = `version=${version}`;
    await fs.ensureDir(DIST_DIR);
    await fs.writeFile(path.resolve(__dirname, DIST_DIR, BUILD_TXT_FILENAME), content);
};

buildTxt();
