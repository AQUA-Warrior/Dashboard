const { getMinecraftServers } = require('./functions/minecraft');

const servers = getMinecraftServers();

servers.forEach(({ pid, screenSession }) => {
  console.log(`MC PID: ${pid} → Screen session ${screenSession}`);
});