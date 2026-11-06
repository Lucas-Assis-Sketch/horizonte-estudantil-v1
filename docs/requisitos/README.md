# Requisitos do IOS — Iniciação Olímpica Sesi

Documento de escopo da versão de testes local. Atualizado em 5 de novembro de 2026. “Implementado” descreve o comportamento presente no código; não equivale a validação completa de acessibilidade, segurança ou uso na escola.

## Requisitos funcionais

| ID | Requisito | Estado | Critério de aceitação |
| --- | --- | --- | --- |
| RF01 | Abrir o início diretamente, sem login ou cadastro | Implementado | Acessar a página sem sessão e sem informar dados pessoais |
| RF02 | Exibir a identidade IOS — Iniciação Olímpica Sesi | Implementado | Nome no menu, rodapé e títulos; lupa fornecida como símbolo no menu e no ícone da aba |
| RF03 | Navegar entre início, olimpíadas e configurações | Implementado | Abrir as três seções e voltar ao início |
| RF04 | Apresentar OBMEP, OMU, OBI, OBA, OP, ONHB e OL | Implementado | Sete cards na seção de olimpíadas, com módulos em preparação |
| RF05 | Identificar visualmente a matéria de cada olimpíada | Implementado | Cards com cores e ilustrações de matemática, informática, astronomia, português, história e literatura; mesmo componente no início e na listagem |
| RF06 | Permitir tema claro/escuro e oito cores | Implementado | Aplicar escolha sem recarregar; salvar tema e cor neste navegador quando o armazenamento estiver disponível |
| RF07 | Animar automaticamente o banner inicial em looping | Implementado | Iniciar estrela e órbitas ao abrir o início, sem botão de pausa; seguir a paleta escolhida, inclusive com preferência de movimento reduzido ativa, conforme decisão do projeto |
| RF08 | Adaptar a lupa à cor escolhida na interface | Implementado | Trocar a paleta e conferir a cor do símbolo no menu nos dois temas |
| RF09 | Informar indisponibilidade dos conteúdos | Implementado | Cada módulo informa que os conteúdos serão adicionados em outra etapa |

OP significa Olimpíada de Português e OL significa Olimpíada de Literatura, conforme definição do responsável pelo projeto. Os rótulos “Paga” de OMU e OL foram herdados do escopo anterior; regras e valores atuais não foram verificados.

## Requisitos técnicos e de qualidade

| ID | Requisito | Estado / verificação |
| --- | --- | --- |
| RT01 | Executar localmente com Node.js 24.x e npm | Implementado; dependências declaradas em `package.json` e fixadas no lockfile |
| RT02 | Servir em `http://127.0.0.1:4173` por padrão | Implementado; servidor limitado ao computador local |
| RT03 | Funcionar sem internet após instalar dependências | Recursos atuais locais, sem fontes, scripts ou imagens externos em execução |
| RT04 | Não abrir o banco de contas antigo | Servidor sem importação do banco; arquivos antigos preservados no disco |
| RT05 | Não expor contas, credenciais ou arquivos privados | APIs antigas retornam 404; estáticos restritos a `frontend/`; testes automatizados existentes |
| RT06 | Adaptar a interface a telas estreitas | CSS responsivo; conferência visual pontual realizada, sem validação abrangente em dispositivos reais |
| RT07 | Manter controles de navegação acessíveis | Rótulos, foco e acesso por teclado presentes; auditoria completa pendente. Animação contínua sem pausa é uma limitação de acessibilidade da decisão atual |
| RT08 | Tratar armazenamento indisponível | Aplicar aparência durante a visita e avisar se não for possível salvar |
| RT09 | Preservar preferências existentes após renomear o projeto | Manter a chave interna `horizonte.appearance.v1`; somente tema e cor |

## Fora do escopo atual

- Conteúdos das olimpíadas: ainda não fornecidos.
- Hub de encaminhamento: previsto para outra etapa, sem destino definido.
- Publicação, domínio e acesso pela rede escolar: a etapa atual é de visualização local.
- Contas, sincronização entre dispositivos, dados acadêmicos privados e banco ativo.

## Melhorias propostas, ainda não aprovadas para implementação

Lista de tarefas, planejamento semanal, metas, anotações, temporizador, resumo de progresso e exportação/importação de futuros registros locais. São alternativas para avaliação; não constituem compromisso de entrega.

A revisão anterior está em [project-council.md](../project-council.md). Ela registra a análise daquele momento; este documento reúne o escopo atual após as alterações visuais e de identidade.

## Visualizar na escola

Primeiro acesso, com Git e Node.js 24 instalados e acesso ao repositório:

```powershell
git clone https://github.com/Lucas-Assis-Sketch/horizonte-estudantil-v1.git
cd horizonte-estudantil-v1
npm ci --ignore-scripts
npm start
```

Abra `http://127.0.0.1:4173` no mesmo computador e mantenha o terminal aberto. Para encerrar, use Ctrl+C. Também é possível baixar e extrair o ZIP da branch main, abrir a pasta no terminal e executar os dois comandos npm.

Para atualizar uma cópia clonada, sem alterações locais pendentes, encerre o servidor e execute:

```powershell
git pull --ff-only origin main
npm ci --ignore-scripts
npm start
```

Clonagem, atualização e instalação de dependências exigem internet. A visualização atual funciona offline depois da instalação. Enviar o código ao GitHub não publica um site acessível por link.
