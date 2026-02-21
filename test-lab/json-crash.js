// test-lab/json-crash.js
const badJson = '{"name": "@codekida/smart-error-engine", "broken": }';

function parseConfig() {
    JSON.parse(badJson);
}

parseConfig();
