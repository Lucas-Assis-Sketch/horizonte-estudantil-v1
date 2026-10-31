# Threat Model

Horizonte 1.0: contas locais de estudantes, home, sete olimpíadas vazias e preferências. start/dev executam src/server.js (package.json:4). Express/API e frontend mesma origem (src/app.js:41-85). Listener sempre HTTP em 127.0.0.1:4173 por padrão; produção exige proxy HTTPS externo, não fornecido (src/server.js:7; src/config.js:3-12). Modelo gerado com revisão independente de arquitetura.

## Assets

- E-mail normalizado, turma autodeclarada, preferências e password_hash em SQLite (src/db.js:10-14). DB_PATH é resolvido contra cwd: padrão <repo>/data/horizonte-v1.db quando iniciado da raiz; WAL, permissões/criptografia/backup externos (src/config.js:12; src/db.js:7-19).
- Senhas: scrypt-v1, salt aleatório 16 bytes, chave 64 bytes, N=32768 r=8 p=1; comparação timingSafeEqual; nunca retornadas em publicAccount (src/password.js:4-14; src/app.js:15).
- Tokens aleatórios 32 bytes, SHA-256 no banco; CSRF separado, em banco e JSON autenticado; validade absoluta de uma hora; segredo do cookie no navegador (src/db.js:5-6,27-30; src/app.js:35-38,59-65).
- Integridade da interface e dos arquivos frontend; raiz estática module-relative separada de src e data (src/app.js:85). Não há notas, pagamentos, inscrições ou dados institucionais nesta versão (README.md:25).

## Trust Boundaries

- Cliente -> API: JSON 8kb, quotas 150/min e 15 autenticações/15min por IP, Origin exato para escritas; timeouts 15s/10s (src/app.js:23-34; src/server.js:8). Origin não autentica clientes não navegador.
- Cadastro/login -> autoridade da conta: schemas estritos, scrypt, sessão; e-mail/turma são entradas autodeclaradas sem atestado (src/app.js:9-13,42-57).
- Cookie -> conta: hash de token não expirado; alterações autenticadas também exigem CSRF; account_id exclusivamente da sessão (src/app.js:59-80).
- Troca de senha exige senha atual, derivação assíncrona, atualização condicional hash antigo e revogação em transação; logout remove sessão atual (src/app.js:66,71-81).
- JSON -> DOM: escapeHTML em e-mail/turma; mensagens textContent; temas/cores enums; CSP self e no-store (frontend/app.js:6-17,24-28; src/app.js:21-22,67-69).
- Servidor -> SQLite: statements parametrizados, foreign keys, WAL; host filesystem trusted, sem ACL/cifra/backup implementados (src/db.js:7-19).
- Proxy externo -> loopback: TRUST_PROXY falso ou loopback, configurável apenas nesse valor; HTTPS APP_ORIGIN obrigatório em produção; Secure/__Host cookies em produção, HttpOnly/SameSite=Strict em todos modos; proxy deve sobrescrever X-Forwarded-For (.env.example:5-6; src/config.js:9-12; src/app.js:18-21).

## Attacker Capabilities

- Cliente com acesso ao listener pode cadastrar contas sintéticas, escolher e-mail/turma/senha, enviar headers/cookies e concorrer requisições. Não se presume exposição remota nem acesso ao sistema operacional (src/server.js:7; src/app.js:42-58).
- Conta comum pode ler próprios metadados, alterar preferências, sair, trocar senha com senha atual. Sem listar contas, atribuir papéis, upload, envio de e-mails ou pagamento (src/app.js:59-85).
- Site hostil não recebe autoridade same-origin/cookies/CSRF; controles Origin, JSON, SameSite e CSRF são independentes (src/app.js:18-19,29-34,59-64).
- Atacante com senha antiga comprometida pode tentar sobrepor login e troca de senha; não se presume conhecimento da nova senha ou controle de configuração.

## Security Objectives

- Não persistir nem retornar senhas em texto puro (src/password.js:4-14; src/app.js:15).
- Isolar leituras/escritas por sessão não expirada e evitar seletores de outras contas (src/app.js:59-80).
- Após troca de senha, senha anterior não deve criar sessão sobrevivente; logout revoga sessão atual (src/app.js:66,71-81).
- Proteger mudanças contra CSRF, renderização contra injeção e arquivos contra escape da raiz estática; manter limites (src/app.js:21-34,59-69,85; frontend/app.js:6).
- Turma/e-mail autodeclarados não são prova de identidade nem autorização escolar (README.md:25,50).
- Conforme pedido, após iniciar análise de segurança não modificar implementação; testes ativos somente loopback e dados sintéticos.

## Assumptions

- Entrega local, sem proxy público estabelecido. Exposição pública/TLS dependem do operador (README.md:50; src/server.js:7).
- Revisão independente mapeou recursos; pai verificou consumidores src/config.js,server.js,db.js,app.js. Não há modelo fornecido, knowledge base ou SECURITY.md aplicável encontrado.
- .env privado, dados reais, dependências instaladas e infraestrutura não auditados. Metadados/lockfile inspecionados offline; nenhuma consulta de CVEs foi feita.
- README data/horizonte-v1.db corresponde ao startup normal na raiz; DB_PATH/cwd podem escolher outro local (README.md:14; src/config.js:12).
- Desenvolvimento usa cookie não Secure em HTTP loopback; produção exige HTTPS origem e prefixo __Host/Secure, mas não provê servidor TLS (src/app.js:18-21).
- Testes diretos app(...,{limits:false}) não alteram defaults de produção; testes ativos de quota usam limits padrão (test/app.test.js:10-12; src/server.js:7).

---

## Saved Model Context

- Source: scan
- Scan: 04f06568-a61d-4f33-85aa-19e9167ac82c
- Target: horizonte-v1
- Revision: 2605507a9f41e096d37a459f889637127b052c7e
- Result status: completed
- Model origin: not recorded
- Model scope: not recorded
- Scan scope: .
- Scan scope description: Revisão da fonte versionada da versão 1.0, commit 2605507a9f41e096d37a459f889637127b052c7e.
