# Gerador de sinais pro – site estático

Publicado via GitHub Pages (Actions). Conteúdo servido de `site_novo/`.

Estrutura:
- `index.html`: splash com loader e redirecionamento para `login.html`.
- `login.html`, `register.html`, `trading.html`.
- `assets/` com CSS/JS/Imagens locais.
- `404.html` e `.nojekyll` para compatibilidade do Pages.

Publicação:
- Workflow: `.github/workflows/deploy-pages.yml` (envia `site_novo/`).
- URL: `https://<usuario>.github.io/<repo>/` (ex.: `https://b4ss21.github.io/gerador_sinal/`).

Notas:
- Links e assets são relativos (ex.: `index.html`, `assets/...`) para funcionar sob `/NOME_DO_REPO/`.
- Ajuste títulos/cores em `index.html` e `assets/css/styles.css`.
