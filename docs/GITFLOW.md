# Gitflow

O repositório começou vazio. A implementação inicial foi preparada em `feature/initial-platform`, sem commits e sem atribuição de autoria automática.

Após revisar os arquivos, faça o primeiro commit com sua identidade Git:

```powershell
git add .
git commit -m "feat: estrutura inicial de pesquisas de satisfação"
git branch main
git branch develop
```

Esse commit inicial estabelece a base comum. A partir daí, crie novas funcionalidades a partir de `develop` e abra PRs; não faça commits diretamente em `main` ou `develop`.

```powershell
git switch develop
git switch -c feature/survey-form
# implementar, verificar, commitar e abrir PR para develop
```

- `main`: produção estável e testada; receber releases e hotfixes por PR.
- `develop`: integração contínua; receber features e bugfixes por PR.
- `feature/*`: desenvolvimento a partir de `develop`.
- `bugfix/*`: correções em desenvolvimento, a partir de `develop`.
- `hotfix/*`: correções urgentes a partir de `main`, integradas também em `develop`.

Sugestões seguintes: `feature/user-management`, `feature/survey-versioning`, `feature/tv-wall-dashboard`. Proteja as branches principais, exija revisão e execução de lint, TypeScript, testes e build no provedor Git. Exclua branches de suporte após integrar. Não inclua ferramentas de assistência como autores, contribuidores ou coautores nos commits.
