const path = require("path");
const { execSync } = require('child_process');

// gets Minecraft server process IDs with their corresponding screen sessions and directory
const getMCServers = () => {
  try {
    const rawPIDs = execSync(
      `pgrep -f "java.*jar.*(minecraft|paper|fabric|forge|spigot|purpur)"`
    )
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(Number);

    return rawPIDs
      .map(pid => {
        try {
          const cmd = execSync(`ps -p ${pid} -o args=`).toString();
          if (!/java.*jar.*(minecraft|paper|fabric|forge|spigot|purpur)/.test(cmd)) return null;

          const ppid = parseInt(execSync(`ps -o ppid= -p ${pid}`).toString().trim());

          // get full directory path of server
          const cwd = execSync(`readlink -f /proc/${pid}/cwd`).toString().trim();

          // get just the directory name (server name)
          const serverName = path.basename(cwd);

          // get listening port(s) for this process
          let ports = [];
          try {
            const ssOut = execSync(`ss -ltnp 2>/dev/null | grep ",pid=${pid}," || true`)
              .toString()
              .trim()
              .split("\n")
              .filter(Boolean);

            ports = ssOut.map(line => {
              const match = line.match(/:(\d+)\s+/);
              return match ? parseInt(match[1]) : null;
            }).filter(Boolean);
          } catch {
            ports = [];
          }

          return {
            pid,
            screenSession: ppid - 1,
            directory: serverName,
            ports
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

// function to see how many minecraft servers are running
const countMCServers = () => {
  try {
    const rawPIDs = execSync(`pgrep -f "java.*jar.*(minecraft|paper|fabric|forge|spigot|purpur)"`)
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);

    let count = 0;
    for (const pidStr of rawPIDs) {
      const pid = Number(pidStr);
      if (!isNaN(pid)) {
        try {
          const cmd = execSync(`ps -p ${pid} -o args=`).toString();
          if (/java.*jar.*(minecraft|paper|fabric|forge|spigot|purpur)/.test(cmd)) {
            count++;
          }
        } catch {
        }
      }
    }
    return count;
  } catch {
    return 0;
  }
};

/*
// gets Minecraft server process IDs
const getMCProcID = () => {
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
const getMCScreenSession = (pids = getMCProcID()) => {
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

module.exports = { getMCProcID, getMCScreenSession, getMCServers, countMCServers };
*/

module.exports = {getMCServers, countMCServers};