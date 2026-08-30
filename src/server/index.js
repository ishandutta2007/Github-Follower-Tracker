/**
 * Express server for the follower tracker dashboard.
 * Serves the static dashboard UI and JSON API endpoints.
 */

const express = require('express');
const path = require('path');
const { getSnapshots, getRange, getLatestSnapshot } = require('../lib/store');

/**
 * Create and configure the Express app (does not call .listen()).
 * @returns {import('express').Express}
 */
function createServer() {
  const app = express();

  // ---------- Static files ----------
  app.use(express.static(path.join(__dirname, 'public')));

  // ---------- API: all or filtered snapshots ----------
  app.get('/api/snapshots', (_req, res) => {
    const days = _req.query.days;
    let snapshots;
    if (days && days !== 'all') {
      snapshots = getRange(parseInt(days, 10));
    } else {
      snapshots = getSnapshots();
    }
    res.json({ snapshots });
  });

  // ---------- API: latest snapshot ----------
  app.get('/api/latest', (_req, res) => {
    res.json({ snapshot: getLatestSnapshot() });
  });

  // ---------- API: summary statistics ----------
  app.get('/api/stats', (_req, res) => {
    const all = getSnapshots();
    const week = getRange(7);
    const month = getRange(30);

    function calcStats(snaps) {
      if (snaps.length === 0) {
        return { change: 0, gained: 0, lost: 0, avgDaily: 0 };
      }
      const first = snaps[0];
      const last = snaps[snaps.length - 1];
      const change = last.count - first.count;
      const gained = snaps.reduce(
        (sum, s) => sum + (s.gained ? s.gained.length : 0),
        0
      );
      const lost = snaps.reduce(
        (sum, s) => sum + (s.lost ? s.lost.length : 0),
        0
      );
      const avgDaily =
        snaps.length > 1
          ? +(change / (snaps.length - 1)).toFixed(1)
          : 0;
      return { change, gained, lost, avgDaily };
    }

    const latest = all.length > 0 ? all[all.length - 1] : null;

    res.json({
      current: latest ? latest.count : 0,
      totalSnapshots: all.length,
      week: calcStats(week),
      month: calcStats(month),
      allTime: calcStats(all),
    });
  });

  return app;
}

module.exports = { createServer };
