import fs from 'node:fs';
import path from 'node:path';

const USERNAME = process.env.GITHUB_USERNAME || 'josiascardosodias-glitch';
const TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'event-horizon-telemetry-generator',
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

  const [commitsRes, prsRes] = await Promise.all([
    fetch(
      `https://api.github.com/search/commits?q=author:${USERNAME}&sort=author-date&order=desc&per_page=1`,
      { headers: { ...headers, Accept: 'application/vnd.github.cloak-preview+json' } }
    ).then((r) => r.json()),
    fetchJson(`https://api.github.com/search/issues?q=author:${USERNAME}+type:pr&per_page=1`),
  ]);

  const total_commits = commitsRes.total_count ?? 0;
  const pull_requests = prsRes.total_count ?? 0;

  const rawDate = commitsRes.items?.[0]?.commit?.author?.date;
  const last_commit = rawDate
    ? rawDate.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    repositories,
    total_commits,
    pull_requests,
    last_commit,
  };
}

function buildEventHorizonSvg(data) {
  const pad2 = (n) => String(n).padStart(2, '0');
  const commitsText = String(data.total_commits);
  const reposText = pad2(data.repositories);
  const prsText = pad2(data.pull_requests);
  const syncText = data.last_commit;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 184" width="880" height="184" role="img" aria-label="Event Horizon Telemetry">
  <defs>
    <radialGradient id="bhGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#9333ea" stop-opacity="0.42"/>
      <stop offset="55%" stop-color="#581c87" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#09040f" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="diskGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b0764" stop-opacity="0.35"/>
      <stop offset="40%" stop-color="#9333ea" stop-opacity="0.9"/>
      <stop offset="75%" stop-color="#c084fc" stop-opacity="1"/>
      <stop offset="100%" stop-color="#4c1d95" stop-opacity="0.35"/>
    </linearGradient>

    <linearGradient id="diskFrontGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7e22ce" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#e9d5ff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#7e22ce" stop-opacity="0.25"/>
    </linearGradient>

    <radialGradient id="coreShade" cx="38%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#140824"/>
      <stop offset="70%" stop-color="#07030c"/>
      <stop offset="100%" stop-color="#030106"/>
    </radialGradient>

    <clipPath id="backHalfClip">
      <rect x="-150" y="-80" width="300" height="80"/>
    </clipPath>
    <clipPath id="frontHalfClip">
      <rect x="-150" y="0" width="300" height="80"/>
    </clipPath>
  </defs>

  <rect x="0.75" y="0.75" width="878.5" height="182.5" rx="12" fill="#09040f" stroke="#281642" stroke-width="1.5"/>

  <text x="26" y="34" fill="#9333ea" font-family="monospace" font-size="11" font-weight="bold" letter-spacing="0.8">SYS.CORE // SINGULARITY_NODE</text>
  <text x="26" y="57" fill="#f3e8ff" font-family="monospace" font-size="17" font-weight="bold" letter-spacing="1.2">EVENT HORIZON TELEMETRY</text>

  <text x="854" y="34" text-anchor="end" fill="#6b5b7b" font-family="monospace" font-size="11" letter-spacing="0.6">GRAVITY_LOCK: 99.8%</text>
  <text x="854" y="57" text-anchor="end" font-family="monospace" font-size="14" font-weight="bold" letter-spacing="0.8">
    <tspan fill="#7e6994">STATUS: </tspan><tspan fill="#a855f7">ACTIVE_BUILD</tspan>
  </text>

  <g transform="translate(440, 92)">
    <ellipse cx="0" cy="0" rx="130" ry="64" fill="url(#bhGlow)">
      <animate attributeName="rx" values="124;136;124" dur="4.5s" repeatCount="indefinite"/>
      <animate attributeName="ry" values="60;68;60" dur="4.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.75;1;0.75" dur="4.5s" repeatCount="indefinite"/>
    </ellipse>

    <g transform="rotate(-14)">
      <g clip-path="url(#backHalfClip)">
        <ellipse cx="0" cy="0" rx="112" ry="24" fill="none" stroke="url(#diskGrad)" stroke-width="6.5"/>
        <ellipse cx="0" cy="0" rx="94" ry="17" fill="none" stroke="#c084fc" stroke-width="1.6" stroke-dasharray="18 10 6 10" opacity="0.85">
          <animate attributeName="stroke-dashoffset" from="0" to="-132" dur="4s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="0" cy="0" rx="78" ry="13" fill="none" stroke="#e9d5ff" stroke-width="1" stroke-dasharray="10 14" opacity="0.65">
          <animate attributeName="stroke-dashoffset" from="0" to="96" dur="6s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="0" cy="0" rx="122" ry="29" fill="none" stroke="#6b21a8" stroke-width="1" opacity="0.5"/>
      </g>

      <g transform="rotate(14)">
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,-1.8; 0,1.8; 0,-1.8" dur="5s" repeatCount="indefinite"/>
          <circle cx="0" cy="0" r="35" fill="url(#coreShade)" stroke="#a855f7" stroke-width="2"/>
          <circle cx="0" cy="0" r="33.2" fill="none" stroke="#f3e8ff" stroke-width="0.7" opacity="0.65"/>
        </g>
      </g>

      <g clip-path="url(#frontHalfClip)">
        <ellipse cx="0" cy="0" rx="112" ry="24" fill="none" stroke="url(#diskGrad)" stroke-width="6.5"/>
        <ellipse cx="0" cy="0" rx="112" ry="24" fill="none" stroke="url(#diskFrontGrad)" stroke-width="2" opacity="0.85"/>
        <ellipse cx="0" cy="0" rx="94" ry="17" fill="none" stroke="#d8b4fe" stroke-width="1.6" stroke-dasharray="18 10 6 10" opacity="0.9">
          <animate attributeName="stroke-dashoffset" from="0" to="-132" dur="4s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="0" cy="0" rx="78" ry="13" fill="none" stroke="#f3e8ff" stroke-width="1" stroke-dasharray="10 14" opacity="0.7">
          <animate attributeName="stroke-dashoffset" from="0" to="96" dur="6s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="0" cy="0" rx="122" ry="29" fill="none" stroke="#6b21a8" stroke-width="1" opacity="0.55"/>
      </g>

      <circle r="2.6" fill="#f3e8ff">
        <animateMotion dur="5.5s" repeatCount="indefinite" path="M -112,0 A 112,24 0 1,0 112,0 A 112,24 0 1,0 -112,0"/>
        <animate attributeName="opacity" values="0.95;1;0.35;0.95" keyTimes="0;0.45;0.75;1" dur="5.5s" repeatCount="indefinite"/>
      </circle>
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
fs.writeFileSync(path.join('assets', 'event-horizon.svg'), buildEventHorizonSvg(data), 'utf-8');
console.log('event-horizon.svg atualizado com sucesso:', data);
