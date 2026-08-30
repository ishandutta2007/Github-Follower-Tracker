/**
 * Snapshot command — fetches current follower data from GitHub
 * and saves a dated snapshot, tracking gained / lost followers.
 */

const { getProfile, getFollowersList } = require('../lib/github');
const { addSnapshot, getLatestSnapshot } = require('../lib/store');

async function run() {
  console.log('📸 Taking follower snapshot...\n');

  // Fetch current data from GitHub via gh CLI
  const profile = getProfile();
  const currentFollowers = getFollowersList();
  const today = new Date().toISOString().split('T')[0];

  console.log(`  User:      ${profile.login}`);
  console.log(`  Date:      ${today}`);
  console.log(`  Followers: ${currentFollowers.length}`);

  // Compare with the most recent previous snapshot to detect changes
  const previous = getLatestSnapshot();
  let gained = [];
  let lost = [];

  if (previous && previous.followers) {
    const prevSet = new Set(previous.followers);
    const currSet = new Set(currentFollowers);

    gained = currentFollowers.filter(f => !prevSet.has(f));
    lost = previous.followers.filter(f => !currSet.has(f));
  }

  // Build and persist the snapshot
  const snapshot = {
    date: today,
    timestamp: new Date().toISOString(),
    count: currentFollowers.length,
    followers: currentFollowers,
    gained,
    lost,
  };

  addSnapshot(snapshot);

  // Report results
  if (gained.length > 0) {
    console.log(`\n  ✅ New followers (${gained.length}):`);
    gained.forEach(u => console.log(`     + ${u}`));
  }
  if (lost.length > 0) {
    console.log(`\n  ❌ Lost followers (${lost.length}):`);
    lost.forEach(u => console.log(`     - ${u}`));
  }
  if (gained.length === 0 && lost.length === 0 && previous) {
    console.log('\n  No changes since last snapshot.');
  }

  console.log('\n✅ Snapshot saved successfully.');
}

module.exports = { run };
