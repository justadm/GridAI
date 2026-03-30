const fs = require('fs');
const path = require('path');

const PID_PATH = '/tmp/gridai-bot.pid';

function ensureSingleInstance(options = {}) {
  const pidPath = options.pidPath || PID_PATH;
  const proc = options.processRef || process;

  if (fs.existsSync(pidPath)) {
    const pid = Number(fs.readFileSync(pidPath, 'utf8')) || 0;
    if (pid > 0 && pid !== proc.pid) {
      try {
        proc.kill(pid, 0);
      } catch (_) {
        // stale pid file
        fs.writeFileSync(pidPath, String(proc.pid));
        return attachCleanup(pidPath, proc);
      }
      console.error(`Bot already running with pid ${pid}. Exiting.`);
      proc.exit(1);
    }
  }
  fs.writeFileSync(pidPath, String(proc.pid));
  attachCleanup(pidPath, proc);
}

function attachCleanup(pidPath, proc) {
  const cleanup = () => {
    if (fs.existsSync(pidPath)) {
      try { fs.unlinkSync(pidPath); } catch (_) {}
    }
  };
  proc.on('exit', cleanup);
  proc.on('SIGINT', () => { cleanup(); proc.exit(0); });
  proc.on('SIGTERM', () => { cleanup(); proc.exit(0); });
}

function ensureEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  const examplePath = path.join(__dirname, '../.env.example');
  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
  }
}

ensureEnvFile();
require('dotenv').config();

function main() {
  const { initDb } = require('./db');
  const { startBot } = require('./bot/bot');
  const { startWebServer } = require('./web/server');

  initDb();
  const disableBot = String(process.env.DISABLE_BOT || '').toLowerCase() === 'true';
  const disableWeb = String(process.env.DISABLE_WEB || '').toLowerCase() === 'true';
  if (!disableBot) {
    ensureSingleInstance();
    const jobsToken = process.env.TELEGRAM_BOT_TOKEN_JOBS;
    const hrToken = process.env.TELEGRAM_BOT_TOKEN_HR;
    const legacyToken = process.env.TELEGRAM_BOT_TOKEN;

    if (jobsToken || hrToken) {
      if (jobsToken) {
        startBot({ audience: 'jobs', token: jobsToken });
      }
      if (hrToken) {
        startBot({ audience: 'hr', token: hrToken });
      }
    } else if (legacyToken) {
      startBot({ audience: 'combined', token: legacyToken });
    } else {
      throw new Error('No Telegram bot token configured');
    }
  }
  if (!disableWeb) startWebServer();
}

if (require.main === module) {
  main();
}

module.exports = {
  ensureSingleInstance,
  ensureEnvFile,
  main
};
