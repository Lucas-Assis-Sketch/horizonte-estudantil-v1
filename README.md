# IOS — Iniciação Olímpica Sesi 1.1

IOS (Iniciação Olímpica Sesi) é um espaço estudantil com acesso direto, sem login, cadastro, perfil ou coleta de e-mail/turma. Mantém início, sete módulos de olimpíadas em preparação e personalização de aparência.

## Executar

Requer Node.js 24.x e dependências instaladas. Execute `npm start` ou `npm run dev` e abra http://127.0.0.1:4173. Para instalar dependências em outra máquina: `npm ci --ignore-scripts`. `.env` é opcional; consulte `.env.example`.

## Aparência e privacidade

Modo claro/escuro e oito cores são salvos no localStorage, na chave `horizonte.appearance.v1`. A chave interna anterior foi mantida para preservar as escolhas de aparência existentes após a mudança de nome. Apenas tema e cor são gravados. As preferências são compartilhadas entre quem usa esse navegador e essa origem; não há sincronização entre dispositivos. Se o navegador bloquear armazenamento, a aparência funciona durante a visita e um aviso explica que não foi salva. Valores inválidos são ignorados.

## Remoção de contas

As APIs de cadastro, login, logout, perfil, senha e preferências por conta foram retiradas e respondem 404, inclusive com cookies antigos. A aplicação não abre nem altera o SQLite anterior. `data/`, `src/db.js`, `src/password.js` e os relatórios de `security/` foram preservados como legado; não integram o fluxo atual. Os dados pessoais antigos continuam no disco: sua eventual exclusão deve ser decidida separadamente. Nenhum dado antigo foi migrado ao navegador.

O servidor mantém Helmet/CSP, arquivos públicos restritos a `frontend/`, erros genéricos e escuta em loopback. `GET /api/health` continua disponível. Não há API de escrita nem banco ativo.

## Escopo

OBMEP, OMU, OBI, OBA, OP, ONHB e OL continuam sem conteúdos. Os rótulos existentes foram preservados; preços, calendários e regras não foram verificados nesta alteração. O hub será criado em outra etapa; não há endereço fictício nem redirecionamento para um destino ainda inexistente.

## Verificação

Execute `npm run check` e `npm test`. Os testes usam servidor local temporário, sem abrir o banco real, e verificam acesso sem sessão, APIs antigas indisponíveis, CSP e bloqueio de arquivos privados. A análise de melhorias está em `docs/project-council.md`.

## Publicação futura

Esta alteração é local. Para publicação, validar HTTPS, domínio, hospedagem e experiência em celular. Caso o hub futuro tenha contas, seu encaminhamento não substitui autorização para recursos privados que venham a existir.

## Requisitos

O escopo atual, os critérios de aceitação, as melhorias propostas e as instruções para testar na escola estão em [docs/requisitos/README.md](docs/requisitos/README.md).
