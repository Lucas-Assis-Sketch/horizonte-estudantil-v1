# Project Council — Auxiliar Estudantil / Horizonte

Revisão rápida (`review`, `quick`), 4 de novembro de 2026. Quatro perspectivas simuladas, conduzidas sequencialmente: engenharia, UX/acessibilidade, produto e revisor crítico. Não representam entrevistas nem pareceres de profissionais independentes.

## Resumo executivo

A remoção das contas simplifica o acesso e elimina a necessidade atual de coletar e-mail, senha e turma. A aparência pode continuar no navegador, com uma limitação explícita: não acompanha o estudante em outros dispositivos. A prioridade de produto é oferecer uma tarefa útil antes da chegada dos conteúdos de olimpíadas. Recomenda-se validar uma lista simples de tarefas antes de investir em calendário completo ou no hub.

## Contexto comum: fatos e hipóteses

Observado no código: `frontend/app.js` contém início, sete módulos vazios e configurações de aparência. A home destaca olimpíadas; não há tarefas, agenda ou material de estudo disponível. A versão anterior associava preferências à conta e coletava e-mail e turma. A alteração atual serve o site sem contas; `src/server.js` não importa o banco e `src/app.js` só mantém a API de saúde. O hub ainda não tem implementação ou endereço fornecido.

Restrições: conteúdos das olimpíadas estão fora das alternativas desta revisão; o hub será futuro. Nenhuma nova função proposta abaixo foi implementada automaticamente.

Hipóteses a validar: o público deseja organizar a própria rotina; pode usar celular e computador ou dispositivos compartilhados; um armazenamento local atende ao primeiro experimento. Não há evidência fornecida sobre quantidade de usuários, idade, rotina ou preferência por ferramentas.

## Pareceres por perspectiva

**Engenharia:** o servidor sem banco reduz dependências do fluxo principal. As oito cores e os dois temas podem ser mantidos sem serviço de contas. Recomenda salvar apenas preferências locais, tratar armazenamento bloqueado e não criar uma conta coletiva como substituto. Os módulos legados de banco/senha e dependências antigas permanecem para uma limpeza posterior; não são carregados pelo servidor atual.

**UX e acessibilidade:** manter a identidade visual e a navegação evita reaprendizado. Entretanto, a chamada principal “Explorar olimpíadas” conduz apenas a estados vazios. Recomenda uma apresentação curta do que já funciona e um caminho para uma futura tarefa útil, sem prometer conteúdos prontos. Validar em celular estreito, teclado, ampliação e temas antes de afirmar acessibilidade; o foco atual e os rótulos são sinais positivos, não comprovação completa.

**Produto:** adicionar uma função pequena, usável sem conteúdos externos, permite avaliar valor agora. Primeira candidata: lista de tarefas com título, prazo opcional e conclusão. Um planejador semanal pode vir depois, se estudantes demonstrarem necessidade. Evitar transformar a primeira entrega em calendário, notas, chat, IA, ranking e notificações ao mesmo tempo. O futuro hub deve encaminhar a um site que já tenha uma finalidade clara.

**Revisor crítico:** questiona três premissas: (1) retirar login melhora a entrada, mas não cria utilidade; (2) um link vindo do hub não restringe o acesso direto ao site; (3) tarefas locais não são automaticamente adequadas a quem alterna dispositivos ou compartilha computador. Recomenda explicar perda/compartilhamento de dados locais, testar o uso e reavaliar armazenamento antes de coletar informações pessoais.

## Debate e decisão

Engenharia favorece armazenamento local para manter a simplicidade; produto aponta que estudantes podem precisar continuar em outro dispositivo. Decisão: usar localStorage para aparência agora. Para tarefas, testar primeiro um protótipo pequeno e, se aprovado, considerar exportação/importação e aviso de armazenamento antes de uma solução de sincronização.

UX favorece destacar uma ação utilizável na home; produto considera manter olimpíadas como identidade do projeto. Resolução sugerida: preservar a seção de olimpíadas com estado “em preparação” e promover a função disponível quando ela existir. Não inventar uma ação principal sem destino útil.

Não há P0 demonstrado nesta revisão. A necessidade de autenticação deve ser revista se surgirem dados privados, ações administrativas ou sincronização individual; o encaminhamento pelo hub não atende sozinho a esses requisitos.

## Matriz priorizada

| ID | Prioridade | Evidência | Consequência / impacto | Proposta | Esforço |
| --- | --- | --- | --- | --- | --- |
| C01 | P1 | Home e módulos em `frontend/app.js` oferecem apenas navegação e estados vazios | Falta uma tarefa que o estudante possa concluir | Validar e depois implementar lista de tarefas: criar, concluir, editar e excluir, sem dados escolares sensíveis | Médio |
| C02 | P1 | Chamada principal da home leva a módulos em preparação | Expectativa de utilidade que ainda não pode ser atendida | Explicar o estágio na home e destacar a próxima função somente quando disponível | Baixo |
| C03 | P1 | Preferências passam de conta para localStorage | Escolhas são compartilhadas no navegador e não sincronizadas | Aviso nas configurações e tratamento de armazenamento indisponível; implementados nesta alteração | Baixo |
| C04 | P1, antes de publicar dados locais adicionais | Não há backup ou sincronização; tarefas ainda são proposta | Limpeza do navegador pode causar perda de futuros registros | Definir exportação/importação, opção de limpeza e confirmação antes de exclusão; avaliar necessidade com usuários | Médio |
| C05 | P2 | Não existe agenda no código inspecionado | Planejamento semanal permanece fora do produto | Prototipar visão semanal apenas se a lista de tarefas não atender à rotina | Médio |
| C06 | P2 | CSS possui regras responsivas; não houve estudo com usuários | Possíveis barreiras em celular, teclado ou ampliação | Validar navegação e configurações em tela estreita, teclado e zoom; corrigir falhas observadas | Baixo/médio |
| C07 | P2 | Hub sem endereço e sem contrato de acesso definidos | Integração pode exigir refazer navegação ou proteção de dados | Definir destino, retorno e responsabilidade pela autorização quando o hub for planejado | Baixo |
| C08 | P2 | `data/` e módulos antigos foram preservados | Dados antigos continuam no disco, embora sem API ativa | Decidir retenção/exclusão separadamente e limpar dependências legadas numa etapa específica | Baixo/médio |

## Plano e critérios de aceitação

1. **Acesso direto, alteração autorizada:** a home abre sem conta; não há formulários de login/cadastro/senha ou perfil; APIs antigas retornam 404 mesmo com cookie anterior; nenhum SQLite é aberto pelo servidor; tema e cor continuam utilizáveis. Verificar que arquivos privados não são servidos.
2. **Validar utilidade, proposta:** apresentar um protótipo de tarefas a estudantes reais e observar se conseguem registrar uma pendência e marcar sua conclusão sem orientação. Registrar dificuldades reais, sem tratar esta revisão como validação de demanda.
3. **Entregar somente a função escolhida:** aceitar criação, edição, conclusão e exclusão; recarregar sem perder registros quando armazenamento estiver permitido; explicar limitações; validar armazenamento bloqueado e recuperação por exportação/importação caso essa persistência seja adotada.
4. **Preparar navegação futura:** integrar o hub quando houver endereço e requisitos definidos. Abrir o site diretamente deve continuar possível no escopo atual; recursos privados futuros exigirão uma decisão própria de autorização.

## Limitações

Revisão do código local e do escopo informado, sem pesquisa de mercado, entrevistas, métricas de uso, auditoria de segurança completa ou verificação de regras/preços das olimpíadas. O relatório antigo em `security/` descreve outra versão e não comprova a segurança da versão atual. Testes automatizados cobrem o contrato HTTP; a validação visual e de interação deve ser registrada separadamente na entrega. Sem publicação ou alteração de permissões externas.
