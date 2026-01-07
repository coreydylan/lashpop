#!/usr/bin/env node
const detect = require('detect-port').default;
const { spawn } = require('child_process');

const PREFERRED_PORT = 3004;

detect(PREFERRED_PORT).then(availablePort => {
  if (availablePort !== PREFERRED_PORT) {
    console.log(`Port ${PREFERRED_PORT} in use, using port ${availablePort}`);
  }

  const next = spawn('npx', ['next', 'dev', '-p', availablePort], {
    stdio: 'inherit',
    shell: true
  });

  next.on('close', code => process.exit(code));
});
