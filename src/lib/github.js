/**
 * GitHub API wrapper using the `gh` CLI.
 * Requires: GitHub CLI (gh) installed and authenticated.
 *
 * Install:  https://cli.github.com/
 * Auth:     gh auth login
 */

const { execSync } = require('child_process');

/**
 * Execute a gh CLI command and return trimmed stdout.
 * @param {string} args - Arguments to pass after `gh`.
 * @returns {string}
 */
function ghExec(args) {
  try {
    return execSync(`gh ${args}`, {
      encoding: 'utf-8',
      timeout: 60000,
      windowsHide: true,
    }).trim();
  } catch (err) {
    const msg = err.stderr || err.message;
    throw new Error(
      `GitHub CLI error: ${msg}\n` +
        'Ensure the GitHub CLI is installed and authenticated:\n' +
        '  Install: https://cli.github.com/\n' +
        '  Auth:    gh auth login'
    );
  }
}

/**
 * Get the authenticated user's profile.
 * @returns {{ login: string, name: string, followers: number, following: number, avatar_url: string, public_repos: number }}
 */
function getProfile() {
  const raw = ghExec('api user');
  const profile = JSON.parse(raw);
  return {
    login: profile.login,
    name: profile.name || profile.login,
    followers: profile.followers,
    following: profile.following,
    avatar_url: profile.avatar_url,
    public_repos: profile.public_repos,
  };
}

/**
 * Get the follower count for the authenticated user.
 * Uses the lightweight `--jq` filter so we avoid parsing the full response.
 * @returns {number}
 */
function getFollowerCount() {
  const raw = ghExec('api user --jq ".followers"');
  return parseInt(raw, 10);
}

/**
 * Get the full list of follower logins for the authenticated user.
 * Handles pagination for accounts with > 100 followers.
 * @returns {string[]} Array of GitHub usernames.
 */
function getFollowersList() {
  const followers = [];
  let page = 1;

  while (true) {
    const raw = ghExec(
      `api "user/followers?per_page=100&page=${page}"`
    );
    const batch = JSON.parse(raw);
    if (!Array.isArray(batch) || batch.length === 0) break;
    followers.push(...batch.map(f => f.login));
    if (batch.length < 100) break;
    page++;
  }

  return followers;
}

module.exports = { getProfile, getFollowerCount, getFollowersList };
