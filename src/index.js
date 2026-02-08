const fs = require('fs');
const path = require('path');

function ensureEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  const examplePath = path.join(__dirname, '../.env.example');
  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
  }
}

ensureEnvFile();
require('dotenv').config();

const { initDb } = require('./db');
const { startBot } = require('./bot/bot');

function main() {
  initDb();
  startBot();
}

main();
