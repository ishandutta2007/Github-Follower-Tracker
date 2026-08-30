/**
 * Client-side JSON data store for follower snapshots.
 * All data is persisted locally in data/snapshots.json.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const SNAPSHOTS_FILE = path.join(DATA_DIR, 'snapshots.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load the full data store from disk.
 * @returns {{ snapshots: Array }} The parsed data, or an empty structure.
 */
function load() {
  ensureDataDir();
  if (!fs.existsSync(SNAPSHOTS_FILE)) {
    return { snapshots: [] };
  }
  try {
    const raw = fs.readFileSync(SNAPSHOTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { snapshots: [] };
  }
}

/**
 * Persist the full data store to disk.
 * @param {{ snapshots: Array }} data
 */
function save(data) {
  ensureDataDir();
  fs.writeFileSync(SNAPSHOTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Add or update a snapshot for a given date.
 * If a snapshot for the same date already exists it is replaced.
 *
 * @param {Object} snapshot - { date, timestamp, count, followers, gained, lost }
 * @returns {Object} The saved snapshot.
 */
function addSnapshot(snapshot) {
  const data = load();
  const existingIndex = data.snapshots.findIndex(s => s.date === snapshot.date);
  if (existingIndex >= 0) {
    data.snapshots[existingIndex] = snapshot;
  } else {
    data.snapshots.push(snapshot);
  }
  // Keep sorted by date ascending
  data.snapshots.sort((a, b) => a.date.localeCompare(b.date));
  save(data);
  return snapshot;
}

/**
 * Get all snapshots sorted by date ascending.
 * @returns {Array}
 */
function getSnapshots() {
  return load().snapshots;
}

/**
 * Get the most recent snapshot, or null if none exist.
 * @returns {Object|null}
 */
function getLatestSnapshot() {
  const snapshots = getSnapshots();
  return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
}

/**
 * Get snapshots within a rolling window.
 * @param {number|string} days - Number of days, or 'all' / 0 for everything.
 * @returns {Array}
 */
function getRange(days) {
  const snapshots = getSnapshots();
  if (!days || days === 'all' || days === 0) return snapshots;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  return snapshots.filter(s => s.date >= cutoffStr);
}

module.exports = {
  load,
  save,
  addSnapshot,
  getSnapshots,
  getLatestSnapshot,
  getRange,
  DATA_DIR,
  SNAPSHOTS_FILE,
};
