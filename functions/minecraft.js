const path = require("path");
const { execSync } = require("child_process");

const CACHE_TTL = 5000;
let cache = { servers: [], timestamp: 0 };

function sanitizeString(str) {
  return String(str).replace(/[&<>"'`=\/]/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  })[s] || s);
}

async function getMCServers() {
  if (Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.servers;
  }
  let servers = [];
  try {
    const psListModule = await import("ps-list");
    const processes = await psListModule.default();
    const mcProcs = processes.filter(
      p =>
        p.cmd &&
        /java.*jar.*(minecraft|paper|fabric|forge|spigot|purpur)/i.test(p.cmd)
    );
    for (const proc of mcProcs) {
      try {
        // get full directory path of server
        let cwd = "";
        try {
          cwd = execSync(`readlink -f /proc/${proc.pid}/cwd`, { encoding: "utf8" }).trim();
        } catch (err) {
          cwd = "";
        }
        const serverName = cwd ? path.basename(cwd) : "unknown";
        // get listening port(s) for this process
        let ports = [];
        try {
          const ssOut = execSync(`ss -ltnp 2>/dev/null | grep ",pid=${proc.pid}," || true`, { encoding: "utf8" })
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
        servers.push({
          pid: proc.pid,
          screenSession: proc.ppid ? proc.ppid - 1 : null,
          directory: sanitizeString(serverName),
          ports
        });
      } catch (err) {
        console.error("Error processing MC server:", err);
      }
    }
  } catch (err) {
    console.error("Error listing MC servers:", err);
    servers = [];
  }
  cache = { servers, timestamp: Date.now() };
  return servers;
}

async function countMCServers() {
  try {
    const servers = await getMCServers();
    return servers.length;
  } catch {
    return 0;
  }
}

module.exports = { getMCServers, countMCServers };