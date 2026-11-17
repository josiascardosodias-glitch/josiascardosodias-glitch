import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api.github.com";
const USERNAME = process.env.GITHUB_USERNAME;
const TOKEN = process.env.GITHUB_TOKEN;
const PER_PAGE = 100;

// github-dashboard/src/index.js -> raiz do repositório do perfil
const DASHBOARD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.resolve(DASHBOARD_DIR, "..");
const README_PATH = process.env.README_PATH
  ? path.resolve(process.env.README_PATH)
  : path.join(REPO_ROOT, "README.md");
const DATA_PATH = path.join(DASHBOARD_DIR, "data", "github-stats.json");

const START = "<!-- GITHUB_STATS_START -->";
const END = "<!-- GITHUB_STATS_END -->";

if (!USERNAME) {
  console.error("Defina GITHUB_USERNAME no ambiente.");
  process.exit(1);
}

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "github-readme-stats-script",
};
if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

async function githubGet(endpoint) {
  const response = await fetch(`${API}${endpoint}`, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status} em ${endpoint}: ${body.slice(0, 400)}`);
  }
  return response.json();
}

async function getAllPages(endpoint) {
  const all = [];
  for (let page = 1; ; page++) {
    const separator = endpoint.includes("?") ? "&" : "?";
    const batch = await githubGet(`${endpoint}${separator}per_page=${PER_PAGE}&page=${page}`);
    if (!Array.isArray(batch)) throw new Error(`Resposta inesperada em ${endpoint}`);
    all.push(...batch);
    if (batch.length < PER_PAGE) break;
  }
  return all;
}

async function getRepos() {
  const publicEndpoint =
    `/users/${encodeURIComponent(USERNAME)}/repos?type=owner&sort=updated&direction=desc`;
  if (!TOKEN) return getAllPages(publicEndpoint);

  // Com um token pessoal (GH_PAT) inclui os privados. O GITHUB_TOKEN do Actions
  // não pode chamar /user/repos, então cai para os repositórios públicos.
  try {
    return await getAllPages("/user/repos?affiliation=owner&sort=updated&direction=desc");
  } catch (error) {
    console.warn(`Sem acesso a /user/repos (${error.message.split(":")[0]}); usando só os públicos.`);
    return getAllPages(publicEndpoint);
  }
}

async function getCommitMetrics(repo) {
  // Conta commits do usuário na branch padrão de cada repositório próprio.
  const endpoint =
    `/repos/${encodeURIComponent(repo.owner.login)}/${encodeURIComponent(repo.name)}` +
    `/commits?author=${encodeURIComponent(USERNAME)}`;

  let total = 0;
  let newest = null;

  for (let page = 1; ; page++) {
    let batch;
    try {
      batch = await githubGet(`${endpoint}&per_page=${PER_PAGE}&page=${page}`);
    } catch (error) {
      // Repositório vazio responde 409: não tem commits para contar.
      if (error.message.startsWith("GitHub API 409")) break;
      throw error;
    }
    if (!Array.isArray(batch)) throw new Error(`Resposta inesperada em ${repo.full_name}`);

    total += batch.length;
    if (batch.length) {
      const date = batch[0].commit?.author?.date ?? batch[0].commit?.committer?.date;
      if (date && (!newest || new Date(date) > new Date(newest))) newest = date;
    }
    if (batch.length < PER_PAGE) break;
  }
  return { total, newest };
}

async function getSearchCount(query) {
  const result = await githubGet(`/search/issues?q=${encodeURIComponent(query)}&per_page=1`);
  return result.total_count ?? 0;
}

// Só a data (fuso de Brasília). Sem updated_at, o README só muda quando
// algum número ou a data do último commit muda.
const day = (iso) =>
  iso ? new Date(iso).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }) : null;

function renderSection(stats) {
  const { updated_at, ...github } = stats.github;
  const shown = { github: { ...github, last_commit: day(github.last_commit) } };
  return `${START}\n<pre><code>${JSON.stringify(shown, null, 2)}</code></pre>\n${END}`;
}

async function main() {
  console.log(`Coletando métricas de @${USERNAME}...`);

  const repos = await getRepos();
  const repositories = repos.length;
  const stars = repos.reduce((sum, repo) => sum + (repo.stargazers_count ?? 0), 0);
  const forks = repos.reduce((sum, repo) => sum + (repo.forks_count ?? 0), 0);

  let totalCommits = 0;
  let lastCommit = null;

  for (const repo of repos) {
    try {
      const metrics = await getCommitMetrics(repo);
      totalCommits += metrics.total;
      if (metrics.newest && (!lastCommit || new Date(metrics.newest) > new Date(lastCommit))) {
        lastCommit = metrics.newest;
      }
      console.log(`✓ ${repo.full_name}: ${metrics.total} commits`);
    } catch (error) {
      console.warn(`Aviso: ${repo.full_name}: ${error.message}`);
    }
  }

  // PRs e Issues criados pelo usuário em repositórios públicos pesquisáveis.
  const [pullRequests, issues] = await Promise.all([
    getSearchCount(`author:${USERNAME} is:pr`),
    getSearchCount(`author:${USERNAME} is:issue`),
  ]);

  const stats = {
    github: {
      username: USERNAME,
      repositories,
      stars,
      forks,
      total_commits: totalCommits,
      last_commit: lastCommit,
      pull_requests: pullRequests,
      issues,
      updated_at: new Date().toISOString(),
    },
  };

  const json = JSON.stringify(stats, null, 2);
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, `${json}\n`, "utf8");

  // Substitui somente a área delimitada, preservando o restante do README.
  const readme = await fs.readFile(README_PATH, "utf8");
  const startIndex = readme.indexOf(START);
  const endIndex = readme.indexOf(END);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Adicione os marcadores ${START} e ${END} ao ${README_PATH}.`);
  }

  const updatedReadme =
    readme.slice(0, startIndex) + renderSection(stats) + readme.slice(endIndex + END.length);
  await fs.writeFile(README_PATH, updatedReadme, "utf8");

  console.log(`Atualizados: ${path.relative(REPO_ROOT, DATA_PATH)} e ${path.relative(REPO_ROOT, README_PATH)}`);
  console.log(json);
}

main().catch((error) => {
  console.error("Falha ao atualizar métricas:", error.message);
  process.exit(1);
});
