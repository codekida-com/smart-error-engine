const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXAMPLES_DIR = path.join(__dirname, '../examples');
const TEST_LAB_DIR = path.join(__dirname, '../test-lab');
const ERROR_ENGINE_BIN = path.join(__dirname, '../bin/smart-error-engine.js');

const files = [
  ...fs.readdirSync(TEST_LAB_DIR).map(f => path.join(TEST_LAB_DIR, f)),
];

console.log('🧪 Running Test Lab...\n');

async function runTest(file, envVars = {}) {
  return new Promise((resolve) => {
    const proc = spawn('node', [ERROR_ENGINE_BIN, file], {
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '1', ...envVars }
    });

    let output = '';
    proc.stdout.on('data', d => output += d.toString());
    proc.stderr.on('data', d => output += d.toString());

    proc.on('close', (code) => {
      let passed = false;
      const fileName = path.basename(file);

      if (envVars.ERROR_ENGINE_FORMAT === 'json') {
          try {
              const json = JSON.parse(output.trim());
              passed = !!json.category && !!json.message;
          } catch(e) { passed = false; }
      } else if (envVars.ERROR_ENGINE_FORMAT === 'plain') {
          passed = output.includes('[X]') && !output.includes('❌');
      } else {
          // Standard pretty mode
          passed = output.includes('❌') || output.includes('Recursion Limit Exceeded'); 
      }
      
      // Special case for ignore.js
      if (fileName === 'ignore.js') {
         // Should fail standard check (no @codekida/smart-error-engine output) -> Passed
         if (!passed) {
             console.log(`✅ ${fileName} (ignored as expected)`);
         } else {
             console.log(`❌ ${fileName} (FAILED: output detected)`);
             console.log(output);
         }
      } else {
          if (passed) {
            console.log(`✅ ${fileName} (${envVars.ERROR_ENGINE_FORMAT || 'pretty'})`);
          } else {
            console.log(`❌ ${fileName} (${envVars.ERROR_ENGINE_FORMAT || 'pretty'})`);
            console.log(output);
          }
      }
      resolve();
    });
  });
}

(async () => {
  // 1. Run standard pretty tests
  console.log('--- PRETTY MODE ---');
  for (const file of files) {
    if (file.endsWith('.js')) {
      await runTest(file);
    }
  }

  // 2. Run JSON tests on a sample
  console.log('\n--- JSON MODE ---');
  await runTest(path.join(TEST_LAB_DIR, 'type-error.js'), { ERROR_ENGINE_FORMAT: 'json' });

  // 3. Run Plain tests on a sample
  console.log('\n--- PLAIN MODE ---');
  await runTest(path.join(TEST_LAB_DIR, 'recursion.js'), { ERROR_ENGINE_FORMAT: 'plain' });

  // 4. Run Ignored test
  console.log('\n--- IGNORE TEST ---');
  await runTest(path.join(TEST_LAB_DIR, 'ignore.js'), { });

  // 5. Run Prod Mode
  console.log('\n--- PROD MODE ---');
  // We expect JSON output
  await runTest(path.join(TEST_LAB_DIR, 'prod-mode.js'), { NODE_ENV: 'production' });

  console.log('\nDone.');
})();
