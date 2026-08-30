/* ── GitHub Follower Tracker — Dashboard Client ── */

let chart = null;
let currentRange = '7';

// ── Bootstrap ──────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.range-btn.active').classList.remove('active');
      btn.classList.add('active');
      currentRange = btn.dataset.days;
      loadData();
    });
  });

  loadData();
});

// ── Data Loading ───────────────────────────────────

async function loadData() {
  try {
    const [snapRes, statsRes] = await Promise.all([
      fetch(`/api/snapshots?days=${currentRange}`),
      fetch('/api/stats'),
    ]);
    const { snapshots } = await snapRes.json();
    const stats = await statsRes.json();

    updateStats(stats);
    updateChart(snapshots);
    updateActivity(snapshots);
    updateTable(snapshots);
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

// ── Stats Cards ────────────────────────────────────

function updateStats(stats) {
  const rangeKey =
    currentRange === '7'
      ? 'week'
      : currentRange === '30'
        ? 'month'
        : 'allTime';
  const rangeStat = stats[rangeKey];

  document.getElementById('current-count').textContent =
    stats.current.toLocaleString();

  const changeEl = document.getElementById('period-change');
  changeEl.textContent =
    (rangeStat.change >= 0 ? '+' : '') + rangeStat.change;
  changeEl.className =
    'stat-value ' + (rangeStat.change >= 0 ? 'gained' : 'lost');

  document.getElementById('period-gained').textContent =
    '+' + rangeStat.gained;
  document.getElementById('period-lost').textContent =
    '-' + rangeStat.lost;
}

// ── Growth Chart ───────────────────────────────────

function updateChart(snapshots) {
  const ctx = document.getElementById('follower-chart').getContext('2d');

  const labels = snapshots.map(s => s.date);
  const data = snapshots.map(s => s.count);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Followers',
          data,
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88, 166, 255, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: snapshots.length <= 30 ? 4 : 0,
          pointBackgroundColor: '#58a6ff',
          pointBorderColor: '#0d1117',
          pointBorderWidth: 2,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#161b22',
          titleColor: '#c9d1d9',
          bodyColor: '#c9d1d9',
          borderColor: '#30363d',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            afterBody(context) {
              const idx = context[0].dataIndex;
              const snap = snapshots[idx];
              const parts = [];
              if (snap.gained && snap.gained.length > 0) {
                parts.push(`Gained: +${snap.gained.length}`);
              }
              if (snap.lost && snap.lost.length > 0) {
                parts.push(`Lost: -${snap.lost.length}`);
              }
              return parts;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#21262d' },
          ticks: { color: '#484f58', maxTicksLimit: 10 },
        },
        y: {
          grid: { color: '#21262d' },
          ticks: { color: '#484f58' },
          beginAtZero: false,
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    },
  });
}

// ── Activity Panels ────────────────────────────────

function updateActivity(snapshots) {
  const gainedList = document.getElementById('gained-list');
  const lostList = document.getElementById('lost-list');

  // Aggregate gained / lost from the most recent 5 snapshots
  const recent = snapshots.slice(-5).reverse();

  const allGained = [];
  const allLost = [];

  recent.forEach(s => {
    (s.gained || []).forEach(u =>
      allGained.push({ user: u, date: s.date })
    );
    (s.lost || []).forEach(u =>
      allLost.push({ user: u, date: s.date })
    );
  });

  gainedList.innerHTML =
    allGained.length > 0
      ? allGained
          .map(
            g =>
              `<li><a href="https://github.com/${g.user}" target="_blank">${g.user}</a> <small style="color:#484f58">${g.date}</small></li>`
          )
          .join('')
      : '<li class="empty-msg">No new followers in this period</li>';

  lostList.innerHTML =
    allLost.length > 0
      ? allLost
          .map(
            g =>
              `<li><a href="https://github.com/${g.user}" target="_blank">${g.user}</a> <small style="color:#484f58">${g.date}</small></li>`
          )
          .join('')
      : '<li class="empty-msg">No unfollowers in this period</li>';
}

// ── Daily Log Table ────────────────────────────────

function updateTable(snapshots) {
  const tbody = document.querySelector('#daily-log tbody');

  const rows = [...snapshots]
    .reverse()
    .map((snap, i, arr) => {
      const next = arr[i + 1]; // previous day (array is reversed)
      const change = next ? snap.count - next.count : 0;
      const changeClass =
        change > 0 ? 'positive' : change < 0 ? 'negative' : '';
      const gained = snap.gained ? snap.gained.length : 0;
      const lost = snap.lost ? snap.lost.length : 0;

      return `<tr>
      <td>${snap.date}</td>
      <td>${snap.count.toLocaleString()}</td>
      <td class="${changeClass}">${change > 0 ? '+' : ''}${change}</td>
      <td class="positive">${gained > 0 ? '+' + gained : '0'}</td>
      <td class="negative">${lost > 0 ? '-' + lost : '0'}</td>
    </tr>`;
    });

  tbody.innerHTML = rows.join('');
}
