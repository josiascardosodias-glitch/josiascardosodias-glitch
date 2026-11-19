import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const USERNAME = process.env.GITHUB_USERNAME || 'josiascardosodias-glitch';
const TOKEN = process.env.GITHUB_TOKEN;
const TEMPLATES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates');

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'telemetry-svg-generator',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function fetchJson(url, extraHeaders = {}) {
  const res = await fetch(url, { headers: { ...headers, ...extraHeaders } });
  if (!res.ok) throw new Error(`Erro na API (${res.status}): ${url}`);
  return res.json();
}

export async function getTelemetryData() {
  const repos = await fetchJson(
    `https://api.github.com/users/${USERNAME}/repos?per_page=100&type=owner`
  );

  const [commitsRes, prsRes, issuesRes] = await Promise.all([
    fetchJson(
      `https://api.github.com/search/commits?q=author:${USERNAME}&sort=author-date&order=desc&per_page=1`,
      { Accept: 'application/vnd.github.cloak-preview+json' }
    ),
    fetchJson(`https://api.github.com/search/issues?q=author:${USERNAME}+type:pr&per_page=1`),
    fetchJson(`https://api.github.com/search/issues?q=author:${USERNAME}+type:issue&per_page=1`),
  ]);

  const rawDate = commitsRes.items?.[0]?.commit?.author?.date;

  return {
    username: USERNAME,
    repositories: repos.length,
    stars: repos.reduce((acc, r) => acc + r.stargazers_count, 0),
    forks: repos.reduce((acc, r) => acc + r.forks_count, 0),
    total_commits: commitsRes.total_count ?? 0,
    last_commit: rawDate ? rawDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    pull_requests: prsRes.total_count ?? 0,
    issues: issuesRes.total_count ?? 0,
  };
}

// Preenche um template de scripts/templates/ e grava em assets/.
// O visual mora no template; o script só troca os {{campos}}.
export function renderTemplate(name, values) {
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, name), 'utf-8');
  const svg = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Template ${name}: campo {{${key}}} sem valor`);
    return String(values[key]);
  });
  fs.mkdirSync('assets', { recursive: true });
  fs.writeFileSync(path.join('assets', name), svg, 'utf-8');
}

export function renderEventHorizon(data) {
  const pad2 = (n) => String(n).padStart(2, '0');
  renderTemplate('event-horizon.svg', {
    commits: data.total_commits,
    repos: pad2(data.repositories),
    prs: pad2(data.pull_requests),
    last_sync: data.last_commit,
  });
}

export function renderTelemetryPayload(data) {
  renderTemplate('telemetry-payload.svg', data);
}
