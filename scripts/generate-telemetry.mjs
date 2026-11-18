import fs from 'node:fs';
import path from 'node:path';

const USERNAME = process.env.GITHUB_USERNAME || 'josiascardosodias-glitch';
const TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'telemetry-svg-generator',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function fetchJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Erro na API (${res.status}): ${url}`);
  return res.json();
}

async function getTelemetryData() {
  const repos = await fetchJson(
    `https://api.github.com/users/${USERNAME}/repos?per_page=100&type=owner`
  );
  const repositories = repos.length;
  const stars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);
  const forks = repos.reduce((acc, r) => acc + r.forks_count, 0);

  const [commitsRes, prsRes, issuesRes] = await Promise.all([
    fetch(
      `https://api.github.com/search/commits?q=author:${USERNAME}&sort=author-date&order=desc&per_page=1`,
      { headers: { ...headers, Accept: 'application/vnd.github.cloak-preview+json' } }
    ).then((r) => r.json()),
    fetchJson(`https://api.github.com/search/issues?q=author:${USERNAME}+type:pr&per_page=1`),
    fetchJson(`https://api.github.com/search/issues?q=author:${USERNAME}+type:issue&per_page=1`),
  ]);

  const total_commits = commitsRes.total_count ?? 0;
  const pull_requests = prsRes.total_count ?? 0;
  const issues = issuesRes.total_count ?? 0;

  const rawDate = commitsRes.items?.[0]?.commit?.author?.date;
  const last_commit = rawDate
    ? rawDate.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    username: USERNAME,
    repositories,
    stars,
    forks,
    total_commits,
    last_commit,
    pull_requests,
    issues,
  };
}

// Componente 1: Card JSON (telemetry.svg)
function buildTelemetryJsonSvg(data) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 244" width="460" height="244">
  <defs>
    <clipPath id="cardClip">
      <rect x="0.6" y="0.6" width="458.8" height="242.8" rx="10"/>
    </clipPath>
  </defs>
  <g clip-path="url(#cardClip)">
    <rect x="0" y="0" width="460" height="244" fill="#0a0612"/>
    <rect x="0" y="0" width="460" height="30" fill="#120b20"/>
    <line x1="0" y1="30" x2="460" y2="30" stroke="#24143b" stroke-width="1"/>
    <circle cx="18" cy="15" r="4" fill="#9333ea"/>
    <circle cx="31" cy="15" r="4" fill="#3b235c"/>
    <circle cx="44" cy="15" r="4" fill="#27173d"/>
    <text x="60" y="18.5" fill="#a77be0" font-family="monospace" font-size="11" font-weight="bold" letter-spacing="0.4">telemetry_payload.json</text>
    <text x="442" y="18.5" text-anchor="end" fill="#6e5a8a" font-family="monospace" font-size="9.5">UTF-8 • LIVE</text>
    <text x="22" y="54" fill="#6e5a8a" font-family="monospace" font-size="11.5">{</text>
    <text x="38" y="71" font-family="monospace" font-size="11.5"><tspan fill="#9d6be0">"github"</tspan><tspan fill="#6e5a8a">: {</tspan></text>
    <text x="54" y="88" font-family="monospace" font-size="11.5"><tspan fill="#9d6be0">"username"</tspan><tspan fill="#6e5a8a">: </tspan><tspan fill="#d8b4fe">"${data.username}"</tspan><tspan fill="#6e5a8a">,</tspan></text>
    <text x="54" y="105" font-family="monospace" font-size="11.5"><tspan fill="#9d6be0">"repositories"</tspan><tspan fill="#6e5a8a">: </tspan><tspan fill="#c084fc" font-weight="bold">${data.repositories}</tspan><tspan fill="#6e5a8a">,</tspan></text>
    <text x="54" y="122" font-family="monospace" font-size="11.5"><tspan fill="#9d6be0">"stars"</tspan><tspan fill="#6e5a8a">: </tspan><tspan fill="#c084fc" font-weight="bold">${data.stars}</tspan><tspan fill="#6e5a8a">,</tspan></text>
    <text x="54" y="139" font-family="monospace" font-size="11.5"><tspan fill="#9d6be0">"forks"</tspan><tspan fill="#6e5a8a">: </tspan><tspan fill="#c084fc" font-weight="bold">${data.forks}</tspan><tspan fill="#6e5a8a">,</tspan></text>
    <text x="54" y="156" font-family="monospace" font-size="11.5"><tspan fill="#9d6be0">"total_commits"</tspan><tspan fill="#6e5a8a">: </tspan><tspan fill="#c084fc" font-weight="bold">${data.total_commits}</tspan><tspan fill="#6e5a8a">,</tspan></text>
    <text x="54" y="173" font-family="monospace" font-size="11.5"><tspan fill="#9d6be0">"last_commit"</tspan><tspan fill="#6e5a8a">: </tspan><tspan fill="#d8b4fe">"${data.last_commit}"</tspan><tspan fill="#6e5a8a">,</tspan></text>
    <text x="54" y="190" font-family="monospace" font-size="11.5"><tspan fill="#9d6be0">"pull_requests"</tspan><tspan fill="#6e5a8a">: </tspan><tspan fill="#c084fc" font-weight="bold">${data.pull_requests}</tspan><tspan fill="#6e5a8a">,</tspan></text>
    <text x="54" y="207" font-family="monospace" font-size="11.5"><tspan fill="#9d6be0">"issues"</tspan><tspan fill="#6e5a8a">: </tspan><tspan fill="#c084fc" font-weight="bold">${data.issues}</tspan></text>
    <text x="38" y="222" fill="#6e5a8a" font-family="monospace" font-size="11.5">}</text>
    <text x="22" y="235" fill="#6e5a8a" font-family="monospace" font-size="11.5">}</text>
  </g>
  <rect x="0.6" y="0.6" width="458.8" height="242.8" rx="10" fill="none" stroke="#2b1845" stroke-width="1.2"/>
</svg>`;
}

// Componente 2: Banner Event Horizon Telemetry (event-horizon.svg)
function buildEventHorizonSvg(data) {
  const pad2 = (n) => String(n).padStart(2, '0');
  const commitsText = String(data.total_commits);
  const reposText = pad2(data.repositories);
  const prsText = pad2(data.pull_requests);
  const syncText = data.last_commit;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 184" width="880" height="184">
  <defs>
    <radialGradient id="bhGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#9333ea" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#581c87" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#09040f" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="diskGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b0764" stop-opacity="0.3"/>
      <stop offset="45%" stop-color="#9333ea" stop-opacity="0.85"/>
      <stop offset="75%" stop-color="#c084fc" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#4c1d95" stop-opacity="0.3"/>
    </linearGradient>
    <linearGradient id="beamGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.2"/>
      <stop offset="50%" stop-color="#f3e8ff" stop-opacity="1"/>
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <rect x="0.75" y="0.75" width="878.5" height="182.5" rx="12" fill="#09040f" stroke="#281642" stroke-width="1.5"/>

  <text x="26" y="34" fill="#9333ea" font-family="monospace" font-size="11" font-weight="bold" letter-spacing="0.8">SYS.CORE // SINGULARITY_NODE</text>
  <text x="26" y="57" fill="#f3e8ff" font-family="monospace" font-size="17" font-weight="bold" letter-spacing="1.2">EVENT HORIZON TELEMETRY</text>

  <text x="854" y="34" text-anchor="end" fill="#6b5b7b" font-family="monospace" font-size="11" letter-spacing="0.6">GRAVITY_LOCK: 99.8%</text>
  <text x="854" y="57" text-anchor="end" font-family="monospace" font-size="14" font-weight="bold" letter-spacing="0.8">
    <tspan fill="#7e6994">STATUS: </tspan><tspan fill="#a855f7">ACTIVE_BUILD</tspan>
  </text>

  <g transform="translate(440, 92)">
    <ellipse cx="0" cy="0" rx="125" ry="62" fill="url(#bhGlow)"/>
    <g transform="rotate(-14)">
      <ellipse cx="0" cy="0" rx="112" ry="24" fill="none" stroke="url(#diskGrad)" stroke-width="6"/>
      <ellipse cx="0" cy="0" rx="92" ry="16" fill="none" stroke="#c084fc" stroke-width="1.5" stroke-dasharray="14 8 5 8" opacity="0.75"/>
      <ellipse cx="0" cy="0" rx="122" ry="29" fill="none" stroke="#6b21a8" stroke-width="1" opacity="0.5"/>
    </g>
    <circle cx="0" cy="0" r="36" fill="#050208" stroke="#a855f7" stroke-width="2"/>
    <circle cx="0" cy="0" r="34" fill="none" stroke="#e9d5ff" stroke-width="0.6" opacity="0.6"/>
    <g transform="rotate(-14)">
      <line x1="-116" y1="0" x2="116" y2="0" stroke="url(#beamGrad)" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="0" cy="2" rx="98" ry="18" fill="none" stroke="#d8b4fe" stroke-width="1.2" stroke-dasharray="22 10 6 12" opacity="0.65"/>
    </g>
  </g>

  <g transform="translate(26, 82)">
    <rect x="0" y="0" width="114" height="74" rx="10" fill="#0e0817" stroke="#24143b" stroke-width="1.2"/>
    <text x="16" y="25" fill="#6b5b7b" font-family="monospace" font-size="11" font-weight="bold" letter-spacing="0.8">COMMITS</text>
    <text x="16" y="56" fill="#a855f7" font-family="monospace" font-size="24" font-weight="bold">${commitsText}</text>
  </g>

  <g transform="translate(152, 82)">
    <rect x="0" y="0" width="114" height="74" rx="10" fill="#0e0817" stroke="#24143b" stroke-width="1.2"/>
    <text x="16" y="25" fill="#6b5b7b" font-family="monospace" font-size="11" font-weight="bold" letter-spacing="0.8">REPOS</text>
    <text x="16" y="56" fill="#f3e8ff" font-family="monospace" font-size="24" font-weight="bold">${reposText}</text>
  </g>

  <g transform="translate(596, 82)">
    <rect x="0" y="0" width="114" height="74" rx="10" fill="#0e0817" stroke="#24143b" stroke-width="1.2"/>
    <text x="16" y="25" fill="#6b5b7b" font-family="monospace" font-size="11" font-weight="bold" letter-spacing="0.8">PULL REQ</text>
    <text x="16" y="56" fill="#a855f7" font-family="monospace" font-size="24" font-weight="bold">${prsText}</text>
  </g>

  <g transform="translate(722, 82)">
    <rect x="0" y="0" width="132" height="74" rx="10" fill="#0e0817" stroke="#24143b" stroke-width="1.2"/>
    <text x="16" y="25" fill="#6b5b7b" font-family="monospace" font-size="11" font-weight="bold" letter-spacing="0.8">LAST SYNC</text>
    <text x="16" y="53" fill="#f3e8ff" font-family="monospace" font-size="16" font-weight="bold">${syncText}</text>
  </g>
</svg>`;
}

const data = await getTelemetryData();

fs.mkdirSync('assets', { recursive: true });
fs.writeFileSync(path.join('assets', 'telemetry.svg'), buildTelemetryJsonSvg(data), 'utf-8');
fs.writeFileSync(path.join('assets', 'event-horizon.svg'), buildEventHorizonSvg(data), 'utf-8');

console.log('SVGs atualizados com sucesso:', data);
