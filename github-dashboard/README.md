# GitHub Dashboard

Gera o bloco JSON de métricas ao lado da apresentação no [README do perfil](../README.md).

O script `src/index.js` consulta a API do GitHub e reescreve apenas o trecho entre
`<!-- GITHUB_STATS_START -->` e `<!-- GITHUB_STATS_END -->` no `README.md` da raiz.
O workflow [`.github/workflows/update-stats.yml`](../.github/workflows/update-stats.yml)
roda isso de hora em hora e só commita quando os números mudam.

## Executar localmente

Node.js 18 ou superior, a partir da raiz do repositório:

```bash
GITHUB_USERNAME=seu_usuario node github-dashboard/src/index.js
```

- `GITHUB_TOKEN` (opcional): token pessoal; inclui repositórios privados e aumenta o limite da API.
- `README_PATH` (opcional): outro arquivo para atualizar no lugar do README da raiz.

Os dados brutos também são salvos em `github-dashboard/data/github-stats.json` (ignorado pelo git); o README exibe as métricas como JSON.

## Repositórios privados no Action

Crie o secret `GH_PAT` no repositório com um token pessoal de leitura. Sem ele, o
workflow usa o `GITHUB_TOKEN` padrão e conta só os repositórios públicos.

## Como as métricas são contadas

- Repositórios, estrelas e forks: repositórios pertencentes à conta.
- Commits: commits atribuídos ao usuário na branch padrão dos repositórios próprios.
- Último commit: commit mais recente encontrado nesses repositórios.
- Pull requests e Issues: itens criados pelo usuário em repositórios públicos pesquisáveis.
