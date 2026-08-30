/**
 * History command — displays follower growth history in the terminal.
 */

const { getSnapshots, getRange } = require('../lib/store');

function run(options) {
  const days = options.days || 'all';
  const snapshots =
    days === 'all' ? getSnapshots() : getRange(parseInt(days, 10));

  if (snapshots.length === 0) {
    console.log(
      'No snapshots found. Run "snapshot" first to start tracking.'
    );
    return;
  }

  const rangeLabel = days === 'all' ? 'All Time' : `Last ${days} Days`;
  console.log(`\n📊 Follower History — ${rangeLabel}\n`);
  console.log('  Date         Count   Change   Gained   Lost');
  console.log('  ' + '─'.repeat(50));

  snapshots.forEach((snap, i) => {
    const prev = i > 0 ? snapshots[i - 1] : null;
    const change = prev ? snap.count - prev.count : 0;
    const changeStr = prev
      ? (change >= 0 ? `+${change}` : `${change}`).padStart(6)
      : '     —';
    const gained = (snap.gained ? snap.gained.length : 0)
      .toString()
      .padStart(6);
    const lost = (snap.lost ? snap.lost.length : 0)
      .toString()
      .padStart(6);

    console.log(
      `  ${snap.date}   ${snap.count.toString().padStart(5)}   ${changeStr}   ${gained}   ${lost}`
    );
  });

  // Summary
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const totalChange = last.count - first.count;
  const avgChange =
    snapshots.length > 1
      ? (totalChange / (snapshots.length - 1)).toFixed(1)
      : 0;

  console.log('\n  ' + '─'.repeat(50));
  console.log(
    `  Total change: ${totalChange >= 0 ? '+' : ''}${totalChange}`
  );
  console.log(`  Avg daily:    ${avgChange >= 0 ? '+' : ''}${avgChange}`);
  console.log(`  Snapshots:    ${snapshots.length}`);
  console.log();
}

module.exports = { run };
