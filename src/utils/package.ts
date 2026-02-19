import fs from 'fs';
import path from 'path';

// Read package.json from the root directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
export const parseJson = JSON.parse(packageJsonContent);
