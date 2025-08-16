const { execSync } = require('child_process');

// gets Minecraft server process IDs
const MCProcID = () => {
  try {
    const rawPIDs = execSync(`pgrep -f "java.*jar.*(minecraft|paper|fabric|forge|spigot|purpur)"`)
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(Number);

    return rawPIDs.filter(pid => {
      try {
        const cmd = execSync(`ps -p ${pid} -o args=`).toString();
        return /java.*jar.*(minecraft|paper|fabric|forge|spigot|purpur)/.test(cmd);
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
};

// gets the screen session IDs which each server is running in
const MCScreenSession = (pids = MCProcID()) => {
  return pids
    .map(pid => {
      try {
        const ppid = parseInt(execSync(`ps -o ppid= -p ${pid}`).toString().trim());
        return ppid - 1;
      } catch {
        return null;
      }
    })
    .filter(id => id !== null && !isNaN(id));
};

// gets Minecraft server process IDs with their corresponding screen sessions
const getMinecraftServers = () => {
  try {
    const rawPIDs = execSync(`pgrep -f "java.*jar.*(minecraft|paper|fabric|forge|spigot|purpur)"`)
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(Number);

    return rawPIDs
      .map(pid => {
        try {
          const cmd = execSync(`ps -p ${pid} -o args=`).toString();
          if (!/java.*jar.*(minecraft|paper|fabric|forge|spigot|purpur)/.test(cmd)) return null;
          const ppid = parseInt(execSync(`ps -o ppid= -p ${pid}`).toString().trim());
          return {
            pid,
            screenSession: ppid - 1,
            cmd: cmd.trim()
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

module.exports = { MCProcID, MCScreenSession, getMinecraftServers };