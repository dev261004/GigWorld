import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const pythonBin = process.env.PYTHON_BIN || "python";
const sixHoursMs = 6 * 60 * 60 * 1000;
const intervalMs = Number(process.env.SCRAPER_INTERVAL_MS || sixHoursMs);
const allowedFailures = Number(process.env.SCRAPER_ALLOWED_FAILURES || "1");
const normalizeSourceKey = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const disabledSources = new Set(
  (process.env.SCRAPER_DISABLED_SOURCES || "")
    .split(",")
    .map((source) => normalizeSourceKey(source.trim()))
    .filter(Boolean)
);

const scraperSources = [
  {
    id: "freelancer",
    name: "Freelancer",
    script: "freelancer.py",
    args: ["--pages", process.env.FREELANCER_SYNC_PAGES || "3", "--delay", "5"],
  },
  {
    id: "truelancer",
    name: "Truelancer",
    script: "truelancer.py",
    args: ["--pages", process.env.TRUELANCER_SYNC_PAGES || "3", "--delay", "5"],
  },
  {
    id: "hubstaff",
    name: "Hubstaff Talent",
    script: "hubstaff.py",
    args: ["--pages", process.env.HUBSTAFF_SYNC_PAGES || "3", "--delay", "5"],
  },
  {
    id: "guru",
    name: "Guru",
    script: "guru.py",
    args: ["--pages", process.env.GURU_SYNC_PAGES || "3", "--delay", "5"],
  },
  { id: "twine", name: "Twine", script: "twine.py", args: [] },
  {
    id: "designcrowd",
    name: "DesignCrowd",
    script: "designcrowd.py",
    args: ["--pages", process.env.DESIGNCROWD_SYNC_PAGES || "3", "--delay", "5"],
  },
  { id: "remotive", name: "Remotive", script: "remotive.py", args: [] },
  { id: "remoteok", name: "RemoteOK", script: "remoteok.py", args: [] },
  { id: "weworkremotely", name: "We Work Remotely", script: "weworkremotely.py", args: [] },
];

let running = false;

const sourceKeys = ({ id, name, script }) => [
  id,
  name,
  script,
  script?.replace(/\.py$/i, ""),
].map(normalizeSourceKey);

const scraperSourcesToRun = scraperSources.filter(
  (source) => !sourceKeys(source).some((key) => disabledSources.has(key))
);

if (disabledSources.size > 0) {
  const skippedSources = scraperSources.filter(
    (source) => sourceKeys(source).some((key) => disabledSources.has(key))
  );
  console.log(
    `[scraper-worker] Disabled sources: ${
      skippedSources.map((source) => source.name).join(", ") || "none matched"
    }`
  );
}

const runScraper = ({ name, script, args }) => new Promise((resolve) => {
  const commandArgs = [
    path.join("scraper", script),
    ...args,
    "--sync-lifecycle",
  ];

  console.log(`[scraper-worker] Starting ${name}`);
  const child = spawn(pythonBin, commandArgs, {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("close", (code) => {
    if (code === 0) {
      console.log(`[scraper-worker] Finished ${name}`);
      resolve({ name, ok: true });
      return;
    }

    console.error(`[scraper-worker] ${name} failed with exit code ${code}`);
    resolve({ name, ok: false });
  });

  child.on("error", (error) => {
    console.error(`[scraper-worker] ${name} failed to start`, error);
    resolve({ name, ok: false });
  });
});

const runAllScrapers = async () => {
  if (running) {
    console.log("[scraper-worker] Previous scrape cycle is still running; skipping.");
    return false;
  }

  running = true;
  const startedAt = new Date();
  console.log(`[scraper-worker] Scrape cycle started at ${startedAt.toISOString()}`);

  const results = [];
  try {
    for (const source of scraperSourcesToRun) {
      results.push(await runScraper(source));
    }
  } finally {
    running = false;
  }

  const failed = results.filter((result) => !result.ok);
  const toleratedFailureCount = Number.isFinite(allowedFailures) && allowedFailures >= 0
    ? Math.floor(allowedFailures)
    : 1;
  console.log(
    `[scraper-worker] Scrape cycle complete. Success: ${
      results.length - failed.length
    }, failed: ${failed.length}, tolerated failures: ${toleratedFailureCount}.`
  );

  if (failed.length > 0) {
    console.error(
      `[scraper-worker] Failed sources: ${failed.map((result) => result.name).join(", ")}`
    );
  }

  return failed.length <= toleratedFailureCount;
};

if (process.argv.includes("--once")) {
  runAllScrapers()
    .then((ok) => process.exit(ok ? 0 : 1))
    .catch((error) => {
      console.error("[scraper-worker] Fatal scrape cycle error", error);
      process.exit(1);
    });
} else {
  const runOnStart = process.env.SCRAPER_WORKER_RUN_ON_START !== "false";
  if (runOnStart) {
    runAllScrapers();
  }

  console.log(`[scraper-worker] Scheduled every ${intervalMs}ms`);
  setInterval(runAllScrapers, intervalMs);
}
