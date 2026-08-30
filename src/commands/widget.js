/**
 * Widget command — generates embeddable SVG and HTML chart files
 * for use in README files or personal websites.
 */

const fs = require('fs');
const path = require('path');
const { getRange, getSnapshots } = require('../lib/store');

const WIDGETS_DIR = path.join(__dirname, '..', '..', 'widgets');

function ensureWidgetsDir() {
  if (!fs.existsSync(WIDGETS_DIR)) {
    fs.mkdirSync(WIDGETS_DIR, { recursive: true });
  }
}

/**
 * Generate a GitHub-themed SVG area chart from snapshot data.
 *
 * @param {Array} snapshots
 * @param {{ width?: number, height?: number }} options
 * @returns {string} SVG markup
 */
function generateSVG(snapshots, options = {}) {
  const width = options.width || 600;
  const height = options.height || 200;
  const pad = { top: 30, right: 20, bottom: 40, left: 50 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  if (snapshots.length === 0) {
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
      `  <rect width="${width}" height="${height}" fill="#0d1117" rx="8"/>`,
      `  <text x="${width / 2}" y="${height / 2}" text-anchor="middle"`,
      `        fill="#8b949e" font-family="sans-serif" font-size="14">`,
      `    No data yet — run a snapshot first`,
      `  </text>`,
      `</svg>`,
    ].join('\n');
  }

  const counts = snapshots.map(s => s.count);
  const minC = Math.min(...counts);
  const maxC = Math.max(...counts);
  const range = maxC - minC || 1;

  // Polyline points
  const pts = snapshots.map((s, i) => {
    const x = pad.left + (i / Math.max(snapshots.length - 1, 1)) * cw;
    const y = pad.top + ch - ((s.count - minC) / range) * ch;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  // Area polygon
  const areaPts = [
    `${pad.left},${pad.top + ch}`,
    ...pts,
    `${(pad.left + cw).toFixed(1)},${pad.top + ch}`,
  ];

  const lastSnap = snapshots[snapshots.length - 1];
  const firstSnap = snapshots[0];
  const change = lastSnap.count - firstSnap.count;
  const changeLabel = change >= 0 ? `+${change}` : `${change}`;
  const changeColor = change >= 0 ? '#3fb950' : '#f85149';

  // Grid lines at 0%, 25%, 50%, 75%, 100%
  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map(pct => {
      const y = pad.top + ch - pct * ch;
      const val = Math.round(minC + pct * range);
      return [
        `  <line x1="${pad.left}" y1="${y}" x2="${pad.left + cw}" y2="${y}" stroke="#21262d" stroke-width="1"/>`,
        `  <text x="${pad.left - 6}" y="${y + 4}" text-anchor="end" fill="#484f58" font-family="sans-serif" font-size="10">${val}</text>`,
      ].join('\n');
    })
    .join('\n');

  // Data point circles (only when ≤ 30 points)
  const circles =
    snapshots.length <= 30
      ? snapshots
          .map((s, i) => {
            const x =
              pad.left + (i / Math.max(snapshots.length - 1, 1)) * cw;
            const y = pad.top + ch - ((s.count - minC) / range) * ch;
            return `  <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#58a6ff" stroke="#0d1117" stroke-width="1.5"/>`;
          })
          .join('\n')
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#58a6ff" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#58a6ff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#0d1117" rx="8"/>

  <!-- Title -->
  <text x="${pad.left}" y="20" fill="#c9d1d9" font-family="Segoe UI, sans-serif" font-size="13" font-weight="600">
    GitHub Followers: ${lastSnap.count}
    <tspan fill="${changeColor}" font-size="12"> (${changeLabel})</tspan>
  </text>

  <!-- Grid -->
${gridLines}

  <!-- Area fill -->
  <polygon points="${areaPts.join(' ')}" fill="url(#areaGrad)"/>

  <!-- Line -->
  <polyline points="${pts.join(' ')}" fill="none" stroke="#58a6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Data points -->
${circles}

  <!-- Date labels -->
  <text x="${pad.left}" y="${height - 8}" fill="#484f58" font-family="sans-serif" font-size="10">${firstSnap.date}</text>
  <text x="${pad.left + cw}" y="${height - 8}" text-anchor="end" fill="#484f58" font-family="sans-serif" font-size="10">${lastSnap.date}</text>
</svg>`;
}

function run(options) {
  const days = options.days ? parseInt(options.days, 10) : 30;
  const snapshots = days === 0 ? getSnapshots() : getRange(days);

  ensureWidgetsDir();

  const svg = generateSVG(snapshots, {
    width: parseInt(options.width || '600', 10),
    height: parseInt(options.height || '200', 10),
  });

  const svgPath = path.join(WIDGETS_DIR, 'follower-growth.svg');
  fs.writeFileSync(svgPath, svg, 'utf-8');

  // Also write an HTML snippet for easy embedding
  const htmlEmbed = `<!-- GitHub Follower Growth Widget -->\n<div style="max-width:600px">\n${svg}\n</div>`;
  const htmlPath = path.join(WIDGETS_DIR, 'follower-growth.html');
  fs.writeFileSync(htmlPath, htmlEmbed, 'utf-8');

  console.log('\n📊 Widget generated!\n');
  console.log(`  SVG:  ${svgPath}`);
  console.log(`  HTML: ${htmlPath}`);
  console.log('\n  Embed in your README:\n');
  console.log('  ```markdown');
  console.log('  ![Follower Growth](./widgets/follower-growth.svg)');
  console.log('  ```\n');
  console.log('  Or in HTML:\n');
  console.log('  ```html');
  console.log(
    '  <img src="./widgets/follower-growth.svg" alt="Follower Growth" width="600" />'
  );
  console.log('  ```\n');
}

module.exports = { run, generateSVG };
