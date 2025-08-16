const { getMCProcID, getMCScreenSession, getMCServers, countMCServers } = require('./functions/minecraft');

const servers = getMCServers();

servers.forEach(({ pid, screenSession }) => {
  console.log(`MC PID: ${pid} → Screen session ${screenSession}`);
});

const online = countMCServers();
console.log(`Online MC servers: ${online}`);