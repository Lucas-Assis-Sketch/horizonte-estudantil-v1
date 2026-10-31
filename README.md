# Horizonte — versão mínima 1.0

Aplicação local reconstruída: contas próprias com e-mail/senha e turma autodeclarada; home; sete módulos vazios de olimpíadas; configurações persistentes por conta.

## Executar

Requer Node.js 24.x e npm.

```powershell
npm ci --ignore-scripts
npm start
```

Abra http://127.0.0.1:4173. `npm run dev` inicia a mesma aplicação completa. Não há servidor de demonstração separado. `.env` é opcional em desenvolvimento; use `.env.example` como referência. O SQLite persistente é criado em `data/horizonte-v1.db`, separado do banco Microsoft antigo. O backend escuta somente no computador local.

## Escopo fechado

- Cadastro: e-mail pessoal, senha, confirmação e turma em campo de texto provisório. E-mails são normalizados para minúsculas; senha de 12 a 128 caracteres.
- Login e logout reais. Cadastro inicia uma sessão. A home é o destino após entrar.
- Olimpíadas: OBMEP, OMU (paga), OBI, OBA, OP, ONHB e OL (paga). Cada módulo possui apenas estado vazio. Os nomes abreviados OP e OL foram preservados sem presumir sua expansão.
- Modo claro/escuro e oito cores: terracota, azul, petróleo, floresta, lavanda, rosa, âmbar e ardósia. Preferências salvas no banco por conta, recuperadas no login. Tons moderados e contraste são decisões visuais, sem promessa clínica de foco ou conforto.
- Troca de senha pela API, com senha atual e confirmação. Revoga todas as sessões e exige novo login.
- Layout adaptável, rótulos, navegação por teclado, mensagens de estado e foco após navegação.

Não fazem parte desta versão: Entra/Microsoft, agenda escolar, notas, projetos, inscrições, pagamentos, notificações, painel administrativo, recuperação por e-mail ou comprovação institucional da turma. O selo “Paga” é apenas informação fornecida no escopo; não há cobrança.

## Segurança implementada na construção

Senhas derivadas com scrypt (N=32768, r=8, p=1), salt aleatório de 16 bytes, chave de 64 bytes; comparação em tempo constante. Não são armazenadas senhas em texto puro. Sessões aleatórias armazenadas por hash, expiração absoluta de uma hora, cookies HttpOnly/SameSite=Strict e Secure em produção. Escritas exigem origem exata; operações autenticadas também exigem CSRF. SQL parametrizado, validação estrita, corpo limitado, rate limit, Helmet/CSP e arquivos estáticos restritos a frontend/. Dados pessoais e tokens não vão ao localStorage. A UI escapa os dados renderizados.

## Verificações

```powershell
npm run check
npm test
```

Os testes criam apenas contas sintéticas, SQLite em memória ou banco temporário, servidores em loopback e nenhuma conexão Microsoft. A avaliação adversarial é separada em `security/`; suas constatações não são corrigidas automaticamente.

## API

`POST /api/auth/register`: `{email,password,confirmPassword,className}`. `POST /api/auth/login`: `{email,password}`. Ambos retornam `{user,csrfToken}` e cookie HttpOnly.

`GET /api/me`: conta atual e CSRF. `PATCH /api/account/preferences`: `{theme,accent}`. `POST /api/account/password`: `{currentPassword,newPassword,confirmPassword}`. `POST /api/auth/logout`: `{}`.

Escritas: `Origin` deve corresponder a `APP_ORIGIN`, corpo JSON, cookie da sessão e `X-CSRF-Token` nas rotas autenticadas. A conta é determinada exclusivamente pela sessão; não há API de leitura de outras contas.

## Antes de publicação

Esta entrega permanece local, sem publicação. Exige HTTPS, domínio/origem configurados, proxy confiável e quotas testadas, backup com restauração verificada, política institucional de privacidade/retenção, mecanismo de confirmação/recuperação de e-mail e avaliação dos achados de segurança. A turma autodeclarada não deve autorizar acesso a dados escolares reais. Não reutilize o banco antigo nem migre credenciais institucionais para esta versão.
