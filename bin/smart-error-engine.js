#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const fs = require('fs');

const args = process.argv.slice(2);
const command = args[0];

// Handle Flags
if (!command || command === '-h' || command === '--help') {
  printUsage();
  process.exit(0);
}

if (command === '-v' || command === '--version') {
  const pkg = require('../package.json');
  console.log(`@codekida/smart-error-engine v${pkg.version}`);
  process.exit(0);
}

// Resolve Script Args
let scriptArgs;
if (command === 'run') {
  scriptArgs = args.slice(1);
} else {
  // Implicit run: @codekida/smart-error-engine app.js
  scriptArgs = args;
}

const script = scriptArgs[0];

if (!script) {
  console.error('Error: No script file provided.');
  printUsage();
  process.exit(1);
}

// Calculate strict path to ../dist/register.js
// bin/smart-error-engine.js -> ../dist/register.js
let registerPath = path.resolve(__dirname, '../dist/register.js');

// Normalize for Windows NODE_OPTIONS (backslashes can get stripped)
registerPath = registerPath.replace(/\\/g, '/');

const childEnv = { ...process.env };
const existingOptions = childEnv.NODE_OPTIONS || '';
childEnv.NODE_OPTIONS = `${existingOptions} -r "${registerPath}"`;

const child = spawn(process.execPath, scriptArgs, {
  env: childEnv,
  stdio: 'inherit'
});

child.on('close', (code) => {
  process.exit(code !== null ? code : 1);
});

child.on('error', (err) => {
    console.error('Failed to spawn child process:', err);
    process.exit(1);
});

function printUsage() {
  console.log(`
@codekida/smart-error-engine - Universal Diagnostic Engine

Usage:
  @codekida/smart-error-engine <script>       Run a Node.js script with @codekida/smart-error-engine enabled
  @codekida/smart-error-engine run <script>   Run a Node.js script with @codekida/smart-error-engine enabled (Explicit)

Flags:
  -h, --help            Show this help message
  -v, --version         Show version
`);
}
