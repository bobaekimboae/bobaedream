import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(appRoot, '..', '..');
const source = resolve(appRoot, 'public', 'admin-demo');
const destination = resolve(repositoryRoot, 'dist', 'client', 'category-admin');

if (!existsSync(source)) throw new Error(`Missing category admin source: ${source}`);
if (!existsSync(resolve(repositoryRoot, 'dist', 'client', 'index.html'))) {
  throw new Error('Run the root Vite build before syncing the category admin demo.');
}

rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, { recursive: true });
console.log('Synced policy matrix admin to dist/client/category-admin');
