#!/usr/bin/env node

/**
 * GitHub Follower Tracker — CLI entry point.
 *
 * Commands:
 *   snapshot   Take a daily follower snapshot
 *   history    Show follower history in the terminal
 *   dashboard  Launch the interactive web dashboard
 *   widget     Generate an embeddable SVG chart widget
 */

const { program } = require('commander');
const pkg = require('../package.json');

program
  .name('gh-tracker')
  .description(pkg.description)
  .version(pkg.version);

program
  .command('snapshot')
  .description('Take a daily follower snapshot')
  .action(async () => {
    const { run } = require('../src/commands/snapshot');
    await run();
  });

program
  .command('history')
  .description('Show follower history in the terminal')
  .option('-d, --days <days>', 'Number of days to show (default: all)', 'all')
  .action(options => {
    const { run } = require('../src/commands/history');
    run(options);
  });

program
  .command('dashboard')
  .description('Launch the interactive web dashboard')
  .option('-p, --port <port>', 'Port number', '3000')
  .action(async options => {
    const { run } = require('../src/commands/dashboard');
    await run(options);
  });

program
  .command('widget')
  .description('Generate an embeddable SVG chart widget')
  .option('-d, --days <days>', 'Number of days to include (0 = all)', '30')
  .option('-W, --width <px>', 'Widget width in pixels', '600')
  .option('-H, --height <px>', 'Widget height in pixels', '200')
  .action(options => {
    const { run } = require('../src/commands/widget');
    run(options);
  });

program.parse();
