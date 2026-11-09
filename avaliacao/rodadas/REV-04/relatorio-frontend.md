# Revisão do frontend — REV-04

## Cabeçalho da rodada

- Rodada: REV-04
- Execução: r01
- Data e responsável: 2026-11-08, revisão de código por Grok 4.7 no Cursor
- Objetivo e tipo de atividade: inspeção independente do frontend, para verificar negócio, usabilidade e acessibilidade do recorte e registrar o que não atende
- Repositório e branch: case-eleva, branch main
- Commit e alterações locais: 77f2e8a9041db90c8cb9f13232ec04e97f847811, mensagem chore: improve class accessibility, 2026-11-08 22:26:45 -0300. Nenhuma alteração local em src, public, server.js ou webpack.config.js. package-lock.json está modificado (4466 inserções e 2539 remoções no diff) e não foi tratado como comportamento da interface. HANDOVER.md está sem acompanhamento e não foi lido.
- Versão do outro repositório quando necessária: não envolvido. O backend não está neste repositório.
- Instrumentos utilizados: 01_Regras_e_Requisitos.md, 02_Review_Frontend.md, 04_Registro_e_Acompanhamento.md e 06_Modelo_Achados.json, datados de 05/11/2026 no texto; a organização de 08/11/2026 no documento 04 foi lida como regra de produtos da rodada. O confronto com a REV-03 ocorreu depois da inspeção do código e dos instrumentos da raiz.
- Ferramenta e modelo identificável: Grok 4.7, Cursor
- Ambiente e base fictícia: Windows 10.0.26200, Node v24.16.0 usado para validar o JSON, calcular contraste declarado e ler os identificadores da REV-03. Navegador não aberto. API não consultada. Nenhuma base de dados foi alterada.
- Escopo e requisitos selecionados: código de src, public, server.js, webpack e package.json. R01–R13 no que o frontend realiza, CT01–CT04, A01, A05, A07, A08, A09, A11, A12, A14, A16, A17, A19, A22, A23, A24, A25, A28, A29, A30, A31, A33, A35, A37, A38, A39 e A40, H01–H10, FE01–FE14 e AR01 só como limite de arquitetura do backend.
- Exclusões desta rodada: pasta avaliacao como produto; autenticação, alunos, matrículas, mapa, tabelas, atalhos próprios, arraste, animações e metas de cobertura. NVDA, sessões com usuários, largura de 320 px CSS, ampliação a 200% e percurso de teclado não foram executados. A06, A10, A13, A18, A20, A32 e A34 ficam fora do roteiro sistemático, com a ressalva de presença registrada abaixo quando o código foi visto.
- Arquivo de achados: avaliacao/rodadas/REV-04/achados-frontend.json
- Pedido e contexto fornecido: pedido desta conversa. Chats anteriores não foram consultados. A pasta avaliacao/rodadas foi aberta somente depois da leitura do código e dos quatro arquivos da raiz de avaliacao.

## Inventário do escopo

| Funcionalidade ou componente | Arquivos ou rotas | Situação de implementação | Observação de alcance |
|---|---|---|---|
| Listar setores | src/pages/LandingPage.js, rota / | implementado | Inspeção de código. Cores efetivas dos setores não medidas. |
| Escolas de um setor | src/pages/SectorPage.js, rota /setor/:id | implementado | Inspeção de código. |
| Cadastrar escola | src/pages/SchoolCreatePage.js, src/components/SchoolForm.js, rota /setor/:id/escolas/nova | parcial | Formulário e POST existem. REV-04-FE-A001. |
| Consultar escola | src/pages/SchoolPage.js, src/components/SchoolCard.js, rota /escola/:id | implementado | totalCapacity vem da resposta da escola; a soma não foi conferida na API. |
| Editar escola e mudar de setor | src/pages/SchoolEditPage.js, rota /escola/:id/editar | implementado | Validação, PATCH parcial e texto de vínculo das turmas inspecionados no código. |
| Excluir escola | src/components/SchoolDeleteModal.js | implementado | Confirmação, cancelamento e mensagem de bloqueio inspecionados no código. Foco do diálogo em REV-04-FE-A002. |
| Listar turmas e filtrar situação | src/pages/ClassesPage.js, rota /escola/:id/classes | implementado | Filtro padrão, três opções e estado do rádio inspecionados no código. |
| Cadastrar turma | src/pages/ClassCreatePage.js, src/components/ClassForm.js, rota /escola/:id/classes/nova | implementado | Escola não editável no payload. Ajuda de situação em REV-04-FE-A009. |
| Detalhe da turma | src/pages/ClassDetailPage.js, rota /turma/:id | implementado | Título em REV-04-FE-A004. |
| Editar turma e situação | src/pages/ClassEditPage.js, rota /turma/:id/editar | implementado | PATCH só dos campos alterados. Ajuda de situação em REV-04-FE-A009. |
| Excluir turma | src/components/ClassDeleteModal.js | implementado | Confirmação e cancelamento inspecionados no código. Foco em REV-04-FE-A002. |
| Cabeçalho compartilhado | src/components/Header.js | implementado | REV-04-FE-A005 e REV-04-FE-A006. |
| Tela de login | src/pages/SignIn.js, src/components/LoginForm.js, rota /login | parcial | Fora do escopo de autenticação. O controle existente está em REV-04-FE-A005. |
| Cliente HTTP | src/services/api.js e chamadas diretas nas listagens | parcial | REV-03-FE-A021. |
| Servidor estático | server.js, public/index.html, webpack.config.js | implementado | server.js só entrega o build e escuta process.env.PORT. Não é a API. |
| Testes automatizados | package.json, script test | não implementado | O script encerra com erro informando que não há teste. Não foi executado. |

## Relação com a REV-03

A inspeção do código foi concluída antes de abrir avaliacao/rodadas. A tabela só indica a relação do apontamento desta rodada com o ID anterior. A descrição fica no JSON.

| ID nesta rodada | Relação |
|---|---|
| REV-04-FE-A001 | novo |
| REV-04-FE-A002 | novo |
| REV-04-FE-A003 | novo |
| REV-04-FE-A004 | novo |
| REV-04-FE-A005 | novo |
| REV-04-FE-A006 | novo |
| REV-04-FE-A007 | novo |
| REV-04-FE-A008 | novo |
| REV-04-FE-A009 | novo |
| REV-04-FE-A010 | novo |
| REV-04-FE-A011 | novo |
| REV-03-FE-A021 | repetido; o mesmo ID foi reutilizado |

IDs da REV-03 com situacao resolvido_no_recorte e reavaliação resolveu_no_recorte foram retirados desta lista: REV-03-FE-A001, A005, A006, A007, A008, A009, A010, A011, A013, A014, A015, A016, A018, A019 e A022. O registro da REV-03 não foi alterado.

| ID da REV-03 | Leitura nesta rodada |
|---|---|
| REV-03-FE-A002 | a ausência do cadastro não foi observada; o aspecto de validação entrou como REV-04-FE-A001, novo |
| REV-03-FE-A003 | não observado no código atual |
| REV-03-FE-A004 | não observado no código atual |
| REV-03-FE-A012 | não observado no código atual |
| REV-03-FE-A017 | a ausência de main e de atalho não foi observada nas telas com cabeçalho |
| REV-03-FE-A020 | não observado no código atual |
| REV-03-FE-A021 | repetido, ainda não resolvido |

Não observado significa que a falha daquele ID não apareceu nesta leitura. Não é confirmação da autora nem fechamento do registro da REV-03.

## Cobertura das verificações

| Item | Requisito e aspecto | Local examinado | Método e evidência da inspeção | Estado de cobertura | IDs de achados ou pendência |
|---|---|---|---|---|---|
| FE01 | Rotas de setor, escola e turma, retorno e contexto | src/App.js e links das páginas de domínio | Leitura das rotas com exact e dos destinos de Link e de âncora | examinado sem apontamento | percurso no navegador pendente |
| FE01 | Ação prometida e não realizada | LoginForm e link Sair | Leitura do formulário sem envio e do link para /login | examinado com apontamento | REV-04-FE-A005 |
| FE02 | Cabeçalhos das telas de domínio | páginas em src/pages | Leitura de h1/h2 | examinado com apontamento | REV-04-FE-A007 |
| FE02 | Título do documento | efeitos de document.title | Leitura dos estados de sucesso, ausência e detalhe | examinado com apontamento | REV-04-FE-A004 |
| FE02 | Região principal e atalho | páginas com Header e SignIn | Leitura de main e do link para #conteudo-principal | examinado sem apontamento | telas com cabeçalho têm main e atalho; /login não tem navegação repetida |
| FE02 | Listas de setores, escolas e turmas | LandingPage, SectorPage, ClassesPage | Leitura de ul/li | examinado sem apontamento | árvore de acessibilidade e NVDA pendentes |
| FE02 | Idioma | public/index.html | lang pt-br | examinado sem apontamento | NVDA pendente |
| FE03 | LinkContainer nas turmas | ClassesPage e react-router-bootstrap 0.25.0 | Leitura de LinkContainer: o filho Card as a recebe href e className | examinado sem apontamento | DOM renderizado pendente |
| FE03 | Nome acessível da marca | Header | Leitura do aria-label e dos textos internos | examinado com apontamento | REV-04-FE-A006 |
| FE03 | Ícones com texto | SchoolCard, cartões de adicionar e Sair | Leitura de aria-hidden | examinado com apontamento | REV-04-FE-A011; NVDA pendente |
| FE04 | Foco dentro de #root e atalho para o conteúdo | styles.css, index.js e páginas com cabeçalho | Leitura da regra de outline e do alvo do atalho | parcialmente examinado | efeito visual do foco no navegador pendente |
| FE04 | Foco no diálogo de exclusão | modais, floating-focus 1.3.3 e react-overlays | Leitura do portal em document.body e do limite do indicador a #root | examinado com apontamento | REV-04-FE-A002 |
| FE04 | Foco após troca de tela | doze telas em src/pages | Leitura de quem chama focus no h1 | examinado com apontamento | REV-04-FE-A003 |
| FE04 | Foco e teclado não enviam o formulário | SchoolForm e ClassForm | Leitura de onSubmit apenas no envio do form | examinado sem apontamento | acionamento no navegador pendente |
| FE05 | Rótulos, obrigatoriedade e menus de turma | SchoolForm e ClassForm | Leitura de label, aria-required, ajuda e limpeza de grupo incompatível | examinado com apontamento | REV-04-FE-A009 no texto de situação da edição |
| FE06 | Normalização, telefone, capacidade e escola fixa da turma | schoolForm.js e classForm.js | Leitura de serialize, format e validate | examinado sem apontamento | payload real não capturado; cadastro de escola não usa a validação, REV-04-FE-A001 |
| FE07 | Validação antes de salvar e erro com dados preservados | edição de escola, cadastro e edição de turma | Leitura dos fluxos que chamam validate e dos catch | examinado sem apontamento | esses três fluxos; navegador pendente |
| FE07 | Validação do cadastro de escola | SchoolCreatePage | Leitura do POST sem validação e sem catch | examinado com apontamento | REV-04-FE-A001 |
| FE08 | Confirmação, cancelamento e bloqueio da exclusão | SchoolDeleteModal e ClassDeleteModal | Leitura do texto, do DELETE condicionado a 204 e do bloqueio 409 | examinado sem apontamento | cancelar, bloquear e excluir no navegador pendentes; foco em REV-04-FE-A002 |
| FE09 | Filtro Ativas, Todas e Encerradas e total da escola | ClassesPage e SchoolCard | Leitura do padrão current, do rádio e de totalCapacity vindo da escola, não da lista filtrada | examinado sem apontamento | alternância no navegador e valor da API pendentes |
| FE10 | Carregamento, vazio, erro e sucesso | listagens, detalhes, formulários e modais | Leitura de role status, role alert e botão Tentar novamente | examinado sem apontamento | anúncio com NVDA pendente |
| FE11 | Contraste de pares declarados | styles.css, textos de ajuda, erro e aviso | Cálculo WCAG em evidencias/contraste-cores-declaradas.txt | parcialmente examinado | pares fixos calculados não ficaram abaixo de 4,5:1; cor efetiva não medida |
| FE11 | Contraste do texto sobre a cor do setor | LandingPage, SectorCard | Leitura da regra maior que 7 contra preto | examinado com apontamento | REV-04-FE-A010 |
| FE11 | Ampliação, 320 px e zoom | index.html e estilos de largura | Leitura de viewport sem trava de zoom; sem execução | parcialmente examinado | A33 e A28 pendentes de navegador |
| FE12 | Termos removidos do escopo | src | Busca por Dados avançados, Vagas ocupadas, Alunos matriculados e Apagar informações | examinado sem apontamento | nenhuma ocorrência |
| FE12 | Termos de capacidade e limite | cartão, listagem, detalhe e formulário | Leitura dos rótulos | examinado com apontamento | REV-04-FE-A008 |
| FE13 | Cliente da API | api.js e páginas | Leitura das URLs | examinado com apontamento | REV-03-FE-A021 |
| FE14 | Testes do frontend | package.json | Leitura do script test | não implementado | suíte ausente; script não executado |
| R01 | Sem cadastro de setor na interface | src | Busca por Adicionar Setor | examinado sem apontamento | nenhuma ocorrência |
| R02 | Mudança de setor sem soltar as turmas | SchoolForm e SchoolEditPage | Leitura do select, da validação de setor e do texto de ajuda | examinado sem apontamento | API não exercitada |
| R03 | Escola da turma imutável na interface | ClassForm e serializeClassForm | Leitura da ausência de schoolId editável | examinado sem apontamento | rejeição direta na API não testada |
| R04–R05 | Ativa, Encerrada, padrão e filtro identificável | classForm.js e ClassesPage | Leitura dos rótulos, do valor current e do rádio marcado | examinado sem apontamento | estado programático no navegador pendente |
| R06 | Total da escola independente do filtro | SchoolPage e ClassesPage | Leitura: o total não é recalculado pela lista filtrada | examinado sem apontamento | a soma em si pertence à API, não conferida |
| R07–R09 e R11 | Bloqueio e exclusão de turma | modais | Leitura das mensagens e da ausência de cascata no frontend | examinado sem apontamento | integridade de banco não verificável neste repositório |
| R10 | Confirmação de exclusão | dois modais | Leitura do nome do registro e do cancelamento sem DELETE | examinado sem apontamento | navegador pendente |
| R12 | Datas de criação e atualização | formatClassDate em escola e turma | Leitura do formatador único e da ausência de campo editável de data | examinado sem apontamento | valores reais da API não vistos |
| R13 | Ações e dados fora do escopo removidos | src | Busca dos rótulos retirados | examinado sem apontamento | nenhuma ocorrência |
| A08 e A12 | Conteúdo principal e atalho | páginas com Header | Leitura de main, tabindex -1 e skip link | examinado sem apontamento | acionamento por teclado pendente |
| A09 | Lista semântica | três coleções | Leitura de ul e li | examinado sem apontamento | NVDA pendente |
| A11 e A14 | Destino e posição da navegação compartilhada | Header repetido nas telas de domínio | Leitura do mesmo componente e dos mesmos destinos | examinado sem apontamento | posição renderizada pendente |
| A16 e A17 | Nomes de ações equivalentes | botões e links de salvar, editar, excluir, cancelar e filtrar | Leitura dos rótulos Excluir escola e Excluir turma | examinado sem apontamento | NVDA pendente |
| A22 e A23 | Rótulos e tipos | dois formulários | Leitura de label associado, tipo tel e inputMode numeric | examinado sem apontamento | NVDA pendente |
| A24 e A25 | Erro de entrada e confirmação de exclusão | edição de escola, fluxos de turma e modais | Leitura do resumo com links para os campos e da confirmação | examinado sem apontamento | cadastro de escola em REV-04-FE-A001 |
| A28, A33 e A37 | Refluxo, ampliação e zoom | index.html | viewport sem maximum-scale e sem user-scalable=no | parcialmente examinado | execução pendente |
| A29 | Filtro e erro sem depender só de cor | ClassesPage e resumos de erro | Leitura de rádio, negrito e texto | examinado sem apontamento | navegador pendente |
| A30 e A31 | Contraste de texto e de foco | cores declaradas e outline | cálculo das cores fixas; indicador do diálogo não medido | parcialmente examinado | REV-04-FE-A010 e REV-04-FE-A002 |
| A35 | Idioma e título | index.html e document.title | Leitura | examinado com apontamento | REV-04-FE-A004 |
| A38 | Nome e texto visível da marca | Header | Leitura | examinado com apontamento | REV-04-FE-A006 |
| A39 | Mensagem de estado | páginas e modais | Leitura de role status e role alert | examinado sem apontamento | NVDA pendente; REV-03-FE-A020 não reencontrado nesta leitura |
| A40 | Controles nativos de filtro e LinkContainer | ClassesPage | Leitura de radio, select e âncora produzida por LinkContainer | examinado sem apontamento | DOM e teclado pendentes |
| A06 e A10 | Imagem com texto e tabela | src e public | Busca visual do código; o SVG é ilustração sem frase; não há table | não aplicável com justificativa | nenhuma ocorrência encontrada nesta versão |
| H01–H10 | Estados, domínio, retorno, consistência, prevenção, reconhecimento, percurso, minimalismo, recuperação e instrução local | telas do domínio | Inspeção de código, sem sessão com usuários | examinado com apontamento | REV-04-FE-A001, REV-04-FE-A004, REV-04-FE-A005, REV-04-FE-A008 e REV-04-FE-A009 |
| AR01 | Arquitetura alvo do backend | este repositório | Não há controller, service, repository nem model | não aplicável com justificativa | diferença de arquitetura do outro repositório não foi julgada daqui |

Examinado sem apontamento não declara atendimento do critério. Onde o método pede navegador, NVDA ou cor renderizada, a pendência correspondente permanece.

## Testes e verificações executados

| Caso | Versão e ambiente | Dados e comando ou passos | Esperado | Observado | Resultado | Evidência e IDs |
|---|---|---|---|---|---|---|
| Contraste de cores declaradas | 2026-11-08, Node v24.16.0, fórmula WCAG | Cálculo dos pares fixos e da faixa da regra do setor | Registrar razões e não tratar cor de código como cor efetiva | Pares fixos calculados em ou acima de 4,5:1 para texto e 3,24:1 para o azul do foco sobre branco; a regra do setor pode escolher branco abaixo de 4,5:1 | passou como cálculo; a medição na tela não foi feita | avaliacao/rodadas/REV-04/evidencias/contraste-cores-declaradas.txt, REV-04-FE-A010 |
| Suíte do package.json | não executado | script test | não executado | não executado | não executado | não há testes no repositório |
| Navegador, teclado, 320 px, texto a 200% e NVDA | não executado | não executado | não executado | não executado | não executado | pendências abaixo |

## Verificações pendentes e limitações

| Verificação | Motivo da pendência | Método necessário | Momento previsto | IDs relacionados |
|---|---|---|---|---|
| Foco visível nos diálogos de exclusão | A autora navegou pelo teclado em 2026-11-09 e confirmou | IN | concluído para o recorte confirmado | REV-04-FE-A002 |
| Foco após troca de tela | Percorrido em 2026-11-09 no Chrome, com GET real e DELETE interceptado | IN | concluído para o recorte verificado; confirmação da autora e NVDA pendentes | REV-04-FE-A003 |
| Cores efetivas dos setores | API não consultada e tela não medida | IN + CC | quando a API de setores estiver disponível | REV-04-FE-A010 |
| Cadastro de escola com dado inválido e nome repetido | Conferido pela autora na interface em 2026-11-09 | IN | concluído para o recorte confirmado | REV-04-FE-A001 |
| Entrar e Sair acionados | Antes: Sair abriu /login e Entrar permaneceu nessa rota. Depois: os dois controles saíram; Ver setores voltou a / | IN | concluído para o recorte verificado; o olhar da autora na tela corrigida segue pendente | REV-04-FE-A005 |
| Títulos renderizados nos estados de ausência | Conferidos na aba em 2026-11-09, com a turma 8 e o id 999999; a autora confirmou | IN | concluído para o recorte confirmado; NVDA pendente | REV-04-FE-A004 |
| Largura de 320 px CSS e texto a 200% | Sem viewport renderizado | IN | avaliação final ou rodada com navegador | nenhum |
| NVDA: títulos, listas, nomes, ícones e anúncio de estado | Procedimento reservado à etapa final | LT | avaliação final | REV-04-FE-A006, REV-04-FE-A007, REV-04-FE-A011 |
| Compreensão com usuários | Procedimento reservado à etapa final | sessões previstas no documento 01 | avaliação final | nenhum |
| Contratos de integridade, soma da capacidade e unicidade | Backend ausente neste repositório | API e banco de teste | revisão do backend, se houver | nenhum |
| Confirmação da autora | REV-04-FE-A001, REV-04-FE-A002, REV-04-FE-A003 e REV-04-FE-A004 confirmados em 2026-11-09 | conferência do JSON | os demais IDs seguem aguardando | demais IDs do JSON |

## Fechamento pela autora

- Data e versão após intervenções: 2026-11-09; REV-04-FE-A001 no commit b1f17f6487a3059f16a4eb24f6b42a388be4708e; REV-04-FE-A002 no commit be267b6714d8cf153dbfb00eacd3a34773da30a1; REV-04-FE-A003 no commit 724cf0f58ea27c4c8d2a39cbf247694d677baf41; REV-04-FE-A004 no commit 4f95cf924e7c5400fd33667139aa006e04816bb7
- IDs reavaliados: REV-04-FE-A001, confirmado na interface; REV-04-FE-A002 e REV-04-FE-A003, confirmados pela autora no teclado; REV-04-FE-A004, confirmado pela autora; REV-04-FE-A005, diagnóstico confirmado pela autora e correção verificada no navegador
- IDs que permanecem pendentes: REV-04-FE-A006, REV-04-FE-A007, REV-04-FE-A008, REV-04-FE-A009, REV-04-FE-A010, REV-04-FE-A011 e REV-03-FE-A021
- Arquivos de reavaliação: avaliacao/rodadas/REV-04/evidencias/REV-04-FE-A001-cadastro-nome-repetido.png, avaliacao/rodadas/REV-04/evidencias/REV-04-FE-A002-foco-verificacao.txt, avaliacao/rodadas/REV-04/evidencias/REV-04-FE-A003-foco-verificacao.txt, avaliacao/rodadas/REV-04/evidencias/REV-04-FE-A004-titulos-verificacao.txt e avaliacao/rodadas/REV-04/evidencias/REV-04-FE-A005-sessao-verificacao.txt
- Limites da cobertura e destino das verificações pendentes: NVDA segue pendente; o olhar da autora na tela já corrigida do A005 segue pendente; navegador, NVDA, usuários e API ficam para execução posterior nos IDs ainda pendentes; o registro da REV-03 não foi alterado
- Decisão de fechamento: REV-04-FE-A001, REV-04-FE-A002, REV-04-FE-A003 e REV-04-FE-A004 resolvidos no recorte e confirmados pela autora; REV-04-FE-A005 resolvido no recorte, com o diagnóstico confirmado e a tela corrigida ainda sem o olhar da autora; a rodada segue aberta para os demais IDs
