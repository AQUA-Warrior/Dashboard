const { getMCProcID, getMCScreenSession, getMCServers, countMCServers } = require('./functions/minecraft');

const servers = getMCServers();

servers.forEach(({ pid, screenSession }) => {
  console.log(`MC PID: ${pid} → Screen session ${screenSession}`);
});

const online = countMCServers();
console.log(`Online MC servers: ${online}`);


// all system info
const getSystemInfo = require('./functions/system');

(async () => {
  const systemData = await getSystemInfo();
  console.log('System Information:', JSON.stringify(systemData, null, 2));
})();