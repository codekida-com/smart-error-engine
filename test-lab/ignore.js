// test-lab/ignore.js
// Configure @codekida/smart-error-engine to ignore "IgnoredError"
const { configure } = require('../dist/index'); // Adjust path to built version
configure({ ignore: ['IgnoredError'] });

throw new Error('IgnoredError: This should not be reported by @codekida/smart-error-engine');
