/**
 * Dashboard command — launches a local web server
 * that serves the interactive follower dashboard.
 */

const { createServer } = require('../server');

async function run(options) {
  const port = parseInt(options.port || '3000', 10);
  const server = createServer();

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`\n🚀 Dashboard running at ${url}\n`);
    console.log('Press Ctrl+C to stop.\n');

    // Try to open the dashboard in the default browser
    import('open')
      .then(({ default: open }) => open(url))
      .catch(() => {
        // 'open' package unavailable — user can navigate manually
      });
  });
}

module.exports = { run };
