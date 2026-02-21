const { spawn } = require('child_process');
const path = require('path');

console.log('Testing CLI Runner...');

const cliPath = path.resolve(__dirname, '../../bin/smart-error-engine.js');
const scriptPath = path.resolve(__dirname, 'dummy-crash.js');

const child = spawn(process.execPath, [cliPath, 'run', scriptPath], {
    stdio: 'pipe', // Capture output
    env: { ...process.env, ERROR_ENGINE_MODE: 'dev', ERROR_ENGINE_COLOR: 'false' } // Force dev mode for pretty print check
});

let output = '';
child.stdout.on('data', d => output += d.toString());
child.stderr.on('data', d => output += d.toString());

child.on('close', (code) => {
    // We expect exit code 1 because the script crashes
    if (code === 0) {
        console.error('[FAIL] CLI exited with 0 but script crashed');
        process.exit(1);
    }

    if (output.includes('CLI Crash Test') && output.includes('Why:')) {
        console.log('[PASS] CLI caught error and printed errorEngine output');
    } else {
        console.error('[FAIL] CLI output missing @codekida/smart-error-engine content');
        console.error('Output:', output);
        process.exit(1);
    }
});
