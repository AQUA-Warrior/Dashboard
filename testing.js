const {getMCServers, countMCServers} = require('./functions/minecraft');

const servers = getMCServers();

servers.forEach(({ pid, screenSession, directory, ports }) => {
  console.log(`MC PID: ${pid} → Screen session: ${screenSession} → Directory: ${directory} → Port(s): ${ports}`);
});

const online = countMCServers();
console.log(`Online MC servers: ${online}`);


// all system info
const getSystemInfo = require('./functions/system');

(async () => {
  const systemData = await getSystemInfo();
  console.log('System Information:', JSON.stringify(systemData, null, 2));
})();