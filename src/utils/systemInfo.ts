import os from "os";
import fs from "fs/promises";

/**
 * Formats bytes into a human-readable string (e.g., GB, MB).
 */
const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Formats seconds into a human-readable uptime string.
 */
const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
  const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
  const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
  const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
  return (dDisplay + hDisplay + mDisplay + sDisplay).replace(/,\s*$/, "");
};

/**
 * Retrieves system storage information.
 */
const getStorageInfo = async () => {
  try {
    const path = process.platform === "win32" ? "C:" : "/";
    const stats = await fs.statfs(path);
    const total = stats.bsize * stats.blocks;
    const free = stats.bsize * stats.bfree;
    const used = total - free;

    return {
      total: formatBytes(total),
      free: formatBytes(free),
      used: formatBytes(used),
      usagePercentage: ((used / total) * 100).toFixed(2) + "%",
    };
  } catch (error) {
    return "Storage info unavailable";
  }
};

/**
 * Gathers comprehensive system information.
 */
export const getSystemHealthInfo = async () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const uptime = os.uptime();
  const appUptime = process.uptime();

  const memoryUsage = process.memoryUsage();
  const storage = await getStorageInfo();

  return {
    status: "Service is running smoothly",
    message: "Welcome to the Tourenzo API!",
    systemInfo: {
      ram: {
        total: formatBytes(totalMem),
        free: formatBytes(freeMem),
        used: formatBytes(usedMem),
        usagePercentage: ((usedMem / totalMem) * 100).toFixed(2) + "%",
      },
      storage,
      nodeHeap: {
        total: formatBytes(memoryUsage.heapTotal),
        used: formatBytes(memoryUsage.heapUsed),
        rss: formatBytes(memoryUsage.rss),
      },
      uptime: {
        system: formatUptime(uptime),
        app: formatUptime(appUptime),
      },
      environment: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        cpus: os.cpus().length,
        loadAverage: os
          .loadavg()
          .map((avg) => avg.toFixed(2))
          .join(", "),
      },
    },
    timestamp: new Date().toISOString(),
  };
};
