const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { ensureSingleInstance } = require('../src/index');

function makeProc(pid, livePids = [pid]) {
  const handlers = new Map();

  return {
    pid,
    kill(targetPid, signal) {
      if (signal !== 0) {
        throw new Error(`unexpected signal ${signal}`);
      }
      if (!livePids.includes(targetPid)) {
        throw new Error(`ESRCH:${targetPid}`);
      }
    },
    exit(code) {
      throw new Error(`EXIT:${code}`);
    },
    on(event, handler) {
      handlers.set(event, handler);
    }
  };
}

test('ensureSingleInstance does not exit when pid file points to current process', () => {
  const pidPath = path.join(
    os.tmpdir(),
    `gridai-self-pid-${Date.now()}-${Math.random().toString(16).slice(2)}.pid`
  );
  fs.writeFileSync(pidPath, '4242');
  const proc = makeProc(4242);

  assert.doesNotThrow(() => {
    ensureSingleInstance({ pidPath, processRef: proc });
  });
  assert.equal(fs.readFileSync(pidPath, 'utf8'), '4242');

  fs.rmSync(pidPath, { force: true });
});

test('ensureSingleInstance exits when pid file points to another live process', () => {
  const pidPath = path.join(
    os.tmpdir(),
    `gridai-other-pid-${Date.now()}-${Math.random().toString(16).slice(2)}.pid`
  );
  fs.writeFileSync(pidPath, '31337');
  const proc = makeProc(4242, [31337]);

  assert.throws(
    () => ensureSingleInstance({ pidPath, processRef: proc }),
    /EXIT:1/
  );

  fs.rmSync(pidPath, { force: true });
});
