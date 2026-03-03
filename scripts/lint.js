const { execFileSync } = require('child_process');

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: 'inherit' });
}

function listJsFiles() {
  const out = execFileSync('rg', ['--files', '-g', '*.js', 'src', 'web', 'scripts', 'tests'], {
    encoding: 'utf8'
  });
  return out.split('\n').map(s => s.trim()).filter(Boolean);
}

function main() {
  const files = listJsFiles();
  for (const file of files) {
    run('node', ['--check', file]);
  }
  run('npx', ['tsc', '--noEmit']);
}

main();
