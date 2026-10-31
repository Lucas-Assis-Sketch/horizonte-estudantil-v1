# Security Review: horizonte-v1

## Scope

Revisão da fonte versionada da versão 1.0, commit 2605507a9f41e096d37a459f889637127b052c7e.

- Scan mode: repository
- Target kind: git_revision
- Target ID: target_sha256_c74dfbf1890b5d641f24ea3fae8ee3ee89248c727a8c0b4e29a65651b7c62a32
- Revision: 2605507a9f41e096d37a459f889637127b052c7e
- Inventory strategy: repository
- Included paths: .
- Excluded paths: none
- Artifacts reviewed: artifacts/active-results.json, artifacts/active-probes.mjs
- Scan context: Modelo gerado por revisão de arquitetura independente; auditoria independente, investigação focada e validação pelo pai. Testes ativos solicitados pelo usuário; nenhuma correção aplicada.

Limitations and exclusions:
- Sem exposição pública, testes com dados reais, engenharia social ou terceiros.
- Sem pentest de infraestrutura, busca de CVEs ou benchmark de exaustão.
- Controle de acesso ao filesystem, backup, retenção e recuperação de e-mail dependem de implantação futura.
- Excluded node_modules/\*\*: Implementação de dependências de terceiros fora da revisão; lockfile inspecionado offline.
- Excluded .git/\*\*: Somente fonte atual, sem histórico.
- Excluded data/\*\*: Dados privados reais não lidos nem atacados; provas em memória com dados sintéticos.

### Scan Summary

| Field | Value |
| --- | --- |
| Scan outcome | completed |
| Reportable findings | 2 |
| Severity mix | medium: 1, low: 1 |
| Confidence mix | high: 2 |
| Coverage | complete |
| Validation mode | static review and authorized loopback HTTP probes |

Canonical artifacts: `scan-manifest.json`, `findings.json`, and `coverage.json`. This report is a deterministic projection of those files.

## Threat Model

Horizonte 1.0: contas locais de estudantes, home, sete olimpíadas vazias e preferências. start/dev executam src/server.js (package.json:4). Express/API e frontend mesma origem (src/app.js:41-85). Listener sempre HTTP em 127.0.0.1:4173 por padrão; produção exige proxy HTTPS externo, não fornecido (src/server.js:7; src/config.js:3-12). Modelo gerado com revisão independente de arquitetura.

### Assets

- E-mail normalizado, turma autodeclarada, preferências e password_hash em SQLite (src/db.js:10-14). DB_PATH é resolvido contra cwd: padrão \<repo\>/data/horizonte-v1.db quando iniciado da raiz; WAL, permissões/criptografia/backup externos (src/config.js:12; src/db.js:7-19).
- Senhas: scrypt-v1, salt aleatório 16 bytes, chave 64 bytes, N=32768 r=8 p=1; comparação timingSafeEqual; nunca retornadas em publicAccount (src/password.js:4-14; src/app.js:15).
- Tokens aleatórios 32 bytes, SHA-256 no banco; CSRF separado, em banco e JSON autenticado; validade absoluta de uma hora; segredo do cookie no navegador (src/db.js:5-6,27-30; src/app.js:35-38,59-65).
- Integridade da interface e dos arquivos frontend; raiz estática module-relative separada de src e data (src/app.js:85). Não há notas, pagamentos, inscrições ou dados institucionais nesta versão (README.md:25).

### Trust Boundaries

- Cliente -\> API: JSON 8kb, quotas 150/min e 15 autenticações/15min por IP, Origin exato para escritas; timeouts 15s/10s (src/app.js:23-34; src/server.js:8). Origin não autentica clientes não navegador.
- Cadastro/login -\> autoridade da conta: schemas estritos, scrypt, sessão; e-mail/turma são entradas autodeclaradas sem atestado (src/app.js:9-13,42-57).
- Cookie -\> conta: hash de token não expirado; alterações autenticadas também exigem CSRF; account_id exclusivamente da sessão (src/app.js:59-80).
- Troca de senha exige senha atual, derivação assíncrona, atualização condicional hash antigo e revogação em transação; logout remove sessão atual (src/app.js:66,71-81).
- JSON -\> DOM: escapeHTML em e-mail/turma; mensagens textContent; temas/cores enums; CSP self e no-store (frontend/app.js:6-17,24-28; src/app.js:21-22,67-69).
- Servidor -\> SQLite: statements parametrizados, foreign keys, WAL; host filesystem trusted, sem ACL/cifra/backup implementados (src/db.js:7-19).
- Proxy externo -\> loopback: TRUST_PROXY falso ou loopback, configurável apenas nesse valor; HTTPS APP_ORIGIN obrigatório em produção; Secure/__Host cookies em produção, HttpOnly/SameSite=Strict em todos modos; proxy deve sobrescrever X-Forwarded-For (.env.example:5-6; src/config.js:9-12; src/app.js:18-21).

### Attacker Capabilities

- Cliente com acesso ao listener pode cadastrar contas sintéticas, escolher e-mail/turma/senha, enviar headers/cookies e concorrer requisições. Não se presume exposição remota nem acesso ao sistema operacional (src/server.js:7; src/app.js:42-58).
- Conta comum pode ler próprios metadados, alterar preferências, sair, trocar senha com senha atual. Sem listar contas, atribuir papéis, upload, envio de e-mails ou pagamento (src/app.js:59-85).
- Site hostil não recebe autoridade same-origin/cookies/CSRF; controles Origin, JSON, SameSite e CSRF são independentes (src/app.js:18-19,29-34,59-64).
- Atacante com senha antiga comprometida pode tentar sobrepor login e troca de senha; não se presume conhecimento da nova senha ou controle de configuração.

### Security Objectives

- Não persistir nem retornar senhas em texto puro (src/password.js:4-14; src/app.js:15).
- Isolar leituras/escritas por sessão não expirada e evitar seletores de outras contas (src/app.js:59-80).
- Após troca de senha, senha anterior não deve criar sessão sobrevivente; logout revoga sessão atual (src/app.js:66,71-81).
- Proteger mudanças contra CSRF, renderização contra injeção e arquivos contra escape da raiz estática; manter limites (src/app.js:21-34,59-69,85; frontend/app.js:6).
- Turma/e-mail autodeclarados não são prova de identidade nem autorização escolar (README.md:25,50).
- Conforme pedido, após iniciar análise de segurança não modificar implementação; testes ativos somente loopback e dados sintéticos.

### Assumptions

- Entrega local, sem proxy público estabelecido. Exposição pública/TLS dependem do operador (README.md:50; src/server.js:7).
- Revisão independente mapeou recursos; pai verificou consumidores src/config.js,server.js,db.js,app.js. Não há modelo fornecido, knowledge base ou SECURITY.md aplicável encontrado.
- .env privado, dados reais, dependências instaladas e infraestrutura não auditados. Metadados/lockfile inspecionados offline; nenhuma consulta de CVEs foi feita.
- README data/horizonte-v1.db corresponde ao startup normal na raiz; DB_PATH/cwd podem escolher outro local (README.md:14; src/config.js:12).
- Desenvolvimento usa cookie não Secure em HTTP loopback; produção exige HTTPS origem e prefixo __Host/Secure, mas não provê servidor TLS (src/app.js:18-21).
- Testes diretos app(...,{limits:false}) não alteram defaults de produção; testes ativos de quota usam limits padrão (test/app.test.js:10-12; src/server.js:7).

## Findings

| Finding | Severity | Confidence | Detailed write-up |
| --- | --- | --- | --- |
| [Login com senha antiga pode sobreviver à troca de senha](#finding-1) | medium | high | inline below |
| [Cadastro permite descobrir se um e-mail já possui conta](#finding-2) | low | high | inline below |

### Confidence Scale

| Label | Meaning |
| --- | --- |
| high | Direct evidence supports the finding with no material unresolved blocker. |
| medium | Evidence supports a plausible issue, but material runtime or reachability proof remains. |
| low | Evidence is incomplete and the item is retained only for explicit follow-up. |

<a id="finding-1"></a>

### [1] Login com senha antiga pode sobreviver à troca de senha

| Field | Value |
| --- | --- |
| Severity | medium |
| Confidence | high |
| Confidence rationale | Revisão independente e pai confirmaram fluxo; três tentativas locais (80/100/120ms) produziram login 200 e /api/me 200 após troca 200. |
| Category | Authentication race / stale credential acceptance |
| CWE | CWE-367 |
| Affected lines | src/app.js:54-57, src/app.js:78-80 |

#### Summary

Quando um login com senha antiga está em andamento durante a troca de senha, a verificação pode terminar após a revogação e criar uma sessão válida. Reprodução HTTP local confirmou sessão aceita por /api/me após a troca.

#### Root Cause

O await de scrypt separa a leitura do estado de credenciais da inserção da sessão. A troca concorrente altera esse estado e revoga sessões, mas o login não revalida o hash capturado antes de emitir autoridade.

**Login mantém hash anterior ao await** — `src/app.js:54-57`

O atacante fornece senha antiga. A conta e o hash são capturados antes da derivação assíncrona; ao retomar, issue cria sessão sem verificar se o hash ainda é atual.

```javascript
const input = credentials.parse(req.body), a = db.prepare('SELECT * FROM accounts WHERE email=?').get(input.email);
    const valid = await verifyPassword(input.password, a?.password_hash || await dummy);
    if (!a || !valid) fail(401,'E-mail ou senha incorretos.');
    const s = issue(req,res,a.id); res.json({user:publicAccount(a),csrfToken:s.csrf});
```

**Troca revoga apenas sessões já inseridas** — `src/app.js:78-80`

A troca atualiza hash e elimina sessões existentes; o login pendente pode inserir outra sessão depois dessa transação.

```javascript
const result = db.prepare('UPDATE accounts SET password_hash=? WHERE id=? AND password_hash=?').run(encoded,a.id,a.password_hash);
      if (!result.changes) fail(409,'A senha foi alterada em outra sessão. Entre novamente.');
      db.prepare('DELETE FROM sessions WHERE account_id=?').run(a.id); res.clearCookie(cookieName,cookieOptions);
```

#### Validation

Nos atrasos de 80/100/120ms, a troca concluiu antes do login com a senha antiga; o cookie retornado depois continuou aceito por /api/me. Nos casos fora da janela, a sessão foi revogada ou o login negado.

Validation method: Revisão estática independente e reprodução HTTP loopback com contas sintéticas/SQLite em memória.

**Login mantém hash anterior ao await** — `src/app.js:54-57`

O atacante fornece senha antiga. A conta e o hash são capturados antes da derivação assíncrona; ao retomar, issue cria sessão sem verificar se o hash ainda é atual.

```javascript
const input = credentials.parse(req.body), a = db.prepare('SELECT * FROM accounts WHERE email=?').get(input.email);
    const valid = await verifyPassword(input.password, a?.password_hash || await dummy);
    if (!a || !valid) fail(401,'E-mail ou senha incorretos.');
    const s = issue(req,res,a.id); res.json({user:publicAccount(a),csrfToken:s.csrf});
```

**Troca revoga apenas sessões já inseridas** — `src/app.js:78-80`

A troca atualiza hash e elimina sessões existentes; o login pendente pode inserir outra sessão depois dessa transação.

```javascript
const result = db.prepare('UPDATE accounts SET password_hash=? WHERE id=? AND password_hash=?').run(encoded,a.id,a.password_hash);
      if (!result.changes) fail(409,'A senha foi alterada em outra sessão. Entre novamente.');
      db.prepare('DELETE FROM sessions WHERE account_id=?').run(a.id); res.clearCookie(cookieName,cookieOptions);
```

Limitations:
- Nenhuma exposição pública ou dados reais testados.
- Provas de corrida usam app com quotas desabilitadas no construtor de teste; cada sequência isolada cabe na quota normal.

#### Dataflow

senha antiga -\> hash capturado -\> await scrypt -\> troca muda hash e apaga sessões -\> issue insere sessão nova -\> /api/me aceita

#### Reachability

POST /api/auth/login é público para clientes com acesso ao listener local. Exige senha antiga, headers válidos e sincronização; proxy público é condicional, não observado.

#### Severity

**Medium** — Requer conhecimento prévio da senha antiga e concorrência com a troca. A sessão conserva leitura de e-mail/turma e escrita de preferências por até uma hora; não concede alteração da nova senha. Exposição atual somente loopback e quotas reduzem alcance.

Aumenta com exposição pública e acesso a dados escolares; diminui se emissão de sessão e versão de credencial forem verificadas atomicamente.

#### Remediation

Após verificar a senha, revalidar o hash atual e inserir a sessão na mesma transação, sem await intermediário. Não foi aplicada correção.

Tests:
- Sobrepor login com senha antiga e troca; nenhum cookie emitido com credenciais anteriores pode autenticar após a troca.

Preventive controls:
- Associar sessões a uma versão de credencial invalidada em cada troca.

<a id="finding-2"></a>

### [2] Cadastro permite descobrir se um e-mail já possui conta

| Field | Value |
| --- | --- |
| Severity | low |
| Confidence | high |
| Confidence rationale | Fonte direta e teste HTTP confirmaram 409 para endereço existente e 201 para endereço sintético novo. |
| Category | Account membership enumeration |
| CWE | CWE-204 |
| Affected lines | src/app.js:45, src/app.js:50 |

#### Summary

Uma tentativa de cadastro com endereço existente retorna 409; um endereço novo retorna 201. Um cliente local distingue a presença de um e-mail no banco, mesmo com mensagem de erro genérica.

#### Root Cause

O endpoint público revela o resultado da consulta de unicidade por status e corpo da resposta. Origin/JSON não impedem um cliente HTTP direto de enviar os cabeçalhos exigidos.

**Estado da conta determina resposta observável** — `src/app.js:45`

O e-mail candidato fornecido pelo atacante é consultado no banco e a existência determina 409, distinguível do cadastro bem-sucedido.

```javascript
if (db.prepare('SELECT id FROM accounts WHERE email=?').get(input.email)) fail(409,'Não foi possível criar a conta com esses dados. Tente entrar ou use outro e-mail.');
```

**Novo endereço recebe resposta diferente** — `src/app.js:50`

Endereços novos produzem 201 e sessão, oferecendo um oráculo de existência apesar do texto genérico no erro.

```javascript
res.status(201).json({user:publicAccount(db.prepare('SELECT * FROM accounts WHERE id=?').get(id)),csrfToken:s.csrf});
```

#### Validation

Cadastro do endereço sintético inicial retornou 201; repetição retornou 409; outro endereço novo retornou 201. Não foram sondados endereços reais.

Validation method: Revisão estática e teste HTTP em loopback.

**Estado da conta determina resposta observável** — `src/app.js:45`

O e-mail candidato fornecido pelo atacante é consultado no banco e a existência determina 409, distinguível do cadastro bem-sucedido.

```javascript
if (db.prepare('SELECT id FROM accounts WHERE email=?').get(input.email)) fail(409,'Não foi possível criar a conta com esses dados. Tente entrar ou use outro e-mail.');
```

**Novo endereço recebe resposta diferente** — `src/app.js:50`

Endereços novos produzem 201 e sessão, oferecendo um oráculo de existência apesar do texto genérico no erro.

```javascript
res.status(201).json({user:publicAccount(db.prepare('SELECT * FROM accounts WHERE id=?').get(id)),csrfToken:s.csrf});
```

#### Dataflow

e-mail candidato -\> normalização -\> SELECT accounts -\> existência -\> 409 ou criação 201

#### Reachability

POST /api/auth/register não exige sessão. Atacante precisa alcançar loopback e respeitar quota; exposição remota não foi demonstrada.

#### Severity

**Low** — Expõe somente participação de um endereço candidato, exige alcance ao serviço local, é limitado a 15 tentativas/15min e cria contas para endereços novos. Não revela senha, turma ou preferências de terceiros.

O risco aumenta com exposição pública e público de estudantes; pode ser reduzido com respostas uniformes e confirmação de posse de e-mail.

#### Remediation

Se a presença da conta precisar ser privada, usar resposta de cadastro uniforme com confirmação de posse por e-mail. Não foi aplicada correção.

Tests:
- Comparar respostas observáveis para endereços existentes e novos sem expor existência.

Preventive controls:
- Definir política de privacidade da existência da conta e fluxo de confirmação de e-mail.

## Reviewed Surfaces

| Surface | Risk Area | Outcome | Notes |
| --- | --- | --- | --- |
| Login concorrente à rotação de senha | Autenticação e revogação | Reported | src/app.js:54-57,78-80; sessão sobreviveu em três atrasos testados. Evidence: artifacts/active-results.json |
| Privacidade da existência de conta | Privacidade | Reported | src/app.js:45,50; 409 vs 201 reproduzidos. Sem emails reais. Evidence: artifacts/active-results.json |
| Isolamento de conta, origem e CSRF | Autorização | No issue found | src/app.js:29-34,59-80. Conta derivada da sessão e schemas strict; origem hostil e CSRF ausente 403; seletor de outra conta 400; preferências alheias intactas. Evidence: artifacts/active-results.json |
| Injeção e isolamento de arquivos estáticos | XSS, SQL e leitura de arquivos | No issue found | frontend/app.js:6,24-28 escapa dados; mensagens textContent; SQL parametrizado src/app.js; static somente frontend src/app.js:85. Probes src/.env/db/traversal 404; SQL inválido 400. Payload HTML armazenado não é evidência de XSS: sink escapa. Nenhuma execução XSS browser demonstrada. Evidence: artifacts/active-results.json |
| Derivação de senha e ciclo de sessão sequencial | Criptografia e segredos | No issue found | src/password.js completo; src/db.js completo; scrypt salt aleatório, timingSafeEqual, hash de token, uma hora. Tests funcionais sequenciais 9/9; revisão de todos arquivos de configuração/documentação/testes não encontrou segredos reais. |
| Limites e configuração de implantação | Disponibilidade e configuração | No issue found | src/config.js/server.js completos; src/app.js:23-28 quotas habilitadas por default; 16ª tentativa 429. Loopback, HTTPS origem obrigatório em produção, trustProxy false/loopback. Sem benchmark de carga ou auditoria de proxy real. Evidence: artifacts/active-results.json |
| E-mail e turma autodeclarados | Identidade | Rejected | Cadastro sem verificação reproduzido; README.md declara contas próprias e turma autodeclarada sem autorização escolar. Não comprova takeover nem escalada; permanece limitação para publicação, não achado separado. |
| Revisão de toda fonte versionada e ausência de credenciais | Código/configuração e cadeia de execução | No issue found | Auditor independente leu integralmente 17 arquivos: .env.example,.gitignore,package.json,package-lock.json,README.md,frontend/{app.js,favicon.svg,index.html,palette.css,styles.css},scripts/check.js,src/{app.js,config.js,db.js,password.js,server.js},test/app.test.js. Pai confirmou consumidores e fronteiras. Não houve consulta de advisories; dependências de terceiros excluídas. |

## Open Questions And Follow Up

- Configuração real de proxy HTTPS, retenção, confirmação/recuperação de e-mail e restauração ainda não fornecidas.
