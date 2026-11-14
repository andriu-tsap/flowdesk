import { spawn } from 'node:child_process';
const args = process.argv.slice(2).filter((x) => x !== '--strictPort');
const child = spawn(
  'node',
  ['node_modules/@angular/cli/bin/ng.js', 'serve', ...args],
  { stdio: 'inherit' },
);
child.on('exit', (code) => process.exit(code ?? 1));
