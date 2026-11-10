# Revisão do frontend — REV-05

## Cabeçalho da rodada

- Rodada: REV-05
- Execução: r01
- Data e responsável: 2026-11-09, revisão de código e navegador por Grok 4.7 no Cursor
- Objetivo e tipo de atividade: inspeção independente do frontend, para verificar negócio, usabilidade e acessibilidade do recorte e registrar o que não atende
- Repositório e branch: case-eleva, branch main
- Commit e alterações locais: 786011554113870b35a08c3d67d5030b016a5028, mensagem refact: reutiliza api no lugar do axios, 2026-11-09 20:55:01 -0300. Nenhuma alteração local em src, public, server.js ou webpack.config.js. package-lock.json está modificado. HANDOVER_front.md está sem acompanhamento. Nenhum dos dois foi tratado como comportamento da interface.
- Versão do outro repositório quando necessária: não identificada. A API em http://localhost:3000 respondeu a leituras; o commit do backend não foi conferido.
- Instrumentos utilizados: 01_Regras_e_Requisitos.md, 02_Review_Frontend.md, 04_Registro_e_Acompanhamento.md e 06_Modelo_Achados.json, datados de 05/11/2026 no texto; a organização de 08/11/2026 no documento 04 foi lida como regra de produtos da rodada. O confronto com REV-03 e REV-04 ocorreu depois da inspeção do código e dos instrumentos da raiz.
- Ferramenta e modelo identificável: Grok 4.7, Cursor
- Ambiente e base fictícia: Windows 10.0.26200. Frontend já em execução em http://localhost:9000 (webpack) e API já em execução em http://localhost:3000. Navegador do Cursor, com leituras de estilo computado. Viewports usadas: largura 1920, 1280x720 e 320x640. Consultas GET de setores, da escola 2 e das turmas das escolas 1, 2 e 3. Nenhuma gravação, exclusão ou alteração de dado foi feita.
- Escopo e requisitos selecionados: código de src, public, server.js, webpack e package.json. R01–R13 no que o frontend realiza, CT01–CT04, A01, A05, A07, A08, A09, A11, A12, A14, A16, A17, A19, A22, A23, A24, A25, A28, A29, A30, A31, A33, A35, A37, A38, A39 e A40, H01–H10 e FE01–FE14. AR01 só como limite: a arquitetura alvo é do backend.
- Exclusões desta rodada: pasta avaliacao como objeto da inspeção inicial; autenticação, alunos, matrículas, mapa, tabelas, atalhos próprios, arraste, animações e metas de cobertura. NVDA e sessões com usuários não foram executados. A06, A10, A13, A18, A20, A32 e A34 ficam fora do roteiro sistemático. Não há mapa nem tabela na interface examinada.
- Arquivo de achados: avaliacao/rodadas/REV-05/achados-frontend.json
- Pedido e contexto fornecido: pedido desta conversa. Chats anteriores não foram consultados. A pasta avaliacao/rodadas foi aberta somente depois da leitura do código, dos quatro arquivos da raiz de avaliacao e da conferência no navegador.

## Inventário do escopo

| Funcionalidade ou componente | Arquivos ou rotas | Situação de implementação | Observação de alcance |
|---|---|---|---|
| Listar setores | src/pages/LandingPage.js, rota / | implementado | Onze setores lidos da API. Lista exposta como listitem. Contraste do texto dos onze fundos calculado em ou acima de 4,5:1. |
| Escolas de um setor | src/pages/SectorPage.js, rota /setor/:id | implementado | /setor/2 exibiu quatro escolas, nome capitalizado, retorno e código. REV-05-FE-A001 foi rejeitado pela autora. |
| Cadastrar escola | src/pages/SchoolCreatePage.js, src/components/SchoolForm.js, rota /setor/:id/escolas/nova | implementado | Validação, preservação do preenchimento e tratamento de 409/422 lidos no código. Envio não executado. |
| Consultar escola | src/pages/SchoolPage.js, src/components/SchoolCard.js, rota /escola/:id | implementado | Escola 2 mostrou limite 0, datas em pt-BR e telefone canônico. Foco inicial estava no h1. |
| Editar escola e mudar de setor | src/pages/SchoolEditPage.js, rota /escola/:id/editar | implementado | Formulário de /escola/2/editar carregado com setor, nome, endereço, diretor e telefone. REV-05-FE-A002. Gravação não executada. |
| Excluir escola | src/components/SchoolDeleteModal.js | implementado | Confirmação, cancelamento e mensagem de bloqueio lidos no código. O diálogo não foi aberto. |
| Listar turmas e filtrar situação | src/pages/ClassesPage.js, rota /escola/:id/classes | implementado | Escolas 1, 2 e 3 sem turmas. Filtro Encerradas ficou marcado, em negrito, e trocou a mensagem de vazio sem levar o foco ao h1. |
| Cadastrar turma | src/pages/ClassCreatePage.js, src/components/ClassForm.js, rota /escola/:id/classes/nova | implementado | Contrato, escola fixa e validação lidos no código. Tela de cadastro não percorrida até o envio. |
| Detalhe da turma | src/pages/ClassDetailPage.js, rota /turma/:id | implementado | Lido no código. Nenhuma turma persistida foi aberta nas escolas consultadas. |
| Editar turma e situação | src/pages/ClassEditPage.js, rota /turma/:id/editar | implementado | PATCH parcial e aviso de nenhuma alteração lidos no código. Tela não aberta por falta de turma nas escolas consultadas. REV-05-FE-A002. |
| Excluir turma | src/components/ClassDeleteModal.js | implementado | Confirmação e cancelamento lidos no código. Diálogo não aberto. |
| Cabeçalho compartilhado | src/components/Header.js | implementado | Marca com texto visível, aviso de protótipo e retorno a /. Presente nas telas percorridas. |
| Tela sem conta | src/pages/SignIn.js, rota /login | implementado | A rota avisa que não há acesso por conta e oferece Ver setores. LoginForm.js não está no código atual. Fora do fluxo percorrido no navegador. |
| Cliente HTTP | src/services/api.js | implementado | As páginas usam o cliente único. A base continua http://localhost:3000. |
| Servidor estático | server.js, public/index.html, webpack.config.js | implementado | A execução usada foi o webpack na porta 9000, não server.js. |
| Testes automatizados | package.json, script test | não implementado | Não há suíte. O script não foi executado. |

## Relação com REV-03 e REV-04

A inspeção do código e a conferência no navegador foram concluídas antes de abrir avaliacao/rodadas. A tabela só indica a relação. A descrição fica no JSON.

| ID nesta rodada | Relação |
|---|---|
| REV-05-FE-A001 | rejeitado pela autora em 2026-11-09, após conferência visual; não entra nos resultados |
| REV-05-FE-A002 | novo |
| REV-05-FE-A003 | novo |

O texto de ajuda da situação da turma, que descreve início e cadastro também na edição, coincide com REV-04-FE-A009. Esse ID está rejeitado. Não entra nesta rodada.

Não foram reabertos os IDs já em resolvido_no_recorte com reavaliação resolveu_no_recorte. Na REV-04 são REV-04-FE-A001 a A008, A010, A011 e REV-03-FE-A021. Na REV-03 são REV-03-FE-A001, A005 a A011, A013 a A016, A018, A019 e A022. O contraste dos textos dos setores, REV-04-FE-A010, foi recalculado para as onze cores devolvidas pela API e ficou em ou acima de 4,5:1.

| ID anterior ainda não encerrado no JSON | Leitura nesta rodada |
|---|---|
| REV-03-FE-A002 | cadastro de escola presente; a validação acompanhada em REV-04-FE-A001 não foi reaberta |
| REV-03-FE-A003 | edição de escola e troca de setor presentes no formulário |
| REV-03-FE-A004 | exclusão com confirmação presente no código; diálogo não aberto |
| REV-03-FE-A012 | o recorte desta rodada foi REV-05-FE-A001, rejeitado pela autora após ver a página |
| REV-03-FE-A017 | main e o atalho Ir para o conteúdo principal presentes nas telas percorridas |
| REV-03-FE-A020 | carregamento, erro, vazio de turmas e sucesso usam role status ou role alert |
| REV-03-FE-A021 | cliente único em src/services/api.js; já resolvido na REV-04 |

Não observado como falha atual não altera a situação gravada na REV-03 ou na REV-04. Esses arquivos não foram editados.

## Cobertura das verificações

| Item | Requisito e aspecto | Local examinado | Método e evidência da inspeção | Estado de cobertura | IDs de achados ou pendência |
|---|---|---|---|---|---|
| FE01 | Rotas, retorno e contexto de setor, escola e turma | src/App.js, /, /setor/2, /escola/2, /escola/2/classes | Rotas exact lidas; retorno e nomes vistos no navegador | examinado sem apontamento | percurso de teclado completo pendente |
| FE01 | Ação prometida e não realizada | Header.js, SignIn.js, rótulos de excluir e editar | Leitura do cabeçalho e da rota /login; botões e links das telas abertas | examinado sem apontamento | diálogo de exclusão não aberto |
| FE02 | h1, título do documento, main e listas | páginas de domínio e árvore de acessibilidade de / e /setor/2 | Título e h1 conferidos; listitem exposto nos setores | examinado sem apontamento | NVDA na etapa final |
| FE03 | Controle nativo de exclusão e LinkContainer | SchoolCard.js, ClassesPage.js no navegador | Excluir escola é button; Adicionar Turma é a com href dentro de li | examinado sem apontamento | acionamento por teclado pendente |
| FE04 | Foco ao entrar e atalho para o conteúdo | LandingPage, SectorPage, SchoolPage, ClassesPage | H1 da escola 2 estava focado após a carga; filtro de turmas não moveu o foco; atalho é o primeiro link | parcialmente examinado | Tab do ambiente não deslocou o foco do DOM |
| FE05 | Rótulos, obrigatoriedade e menus de escola | /escola/2/editar | Rótulos com obrigatório ou opcional, aria-describedby e setor pré-selecionado | examinado sem apontamento | formulário de turma não aberto |
| FE06 | Nome, telefone, capacidade e situação | schoolForm.js, classForm.js, escola 2 | Nome capitalizado na tela; limite 0; telefone canônico no campo; situação inicial current no código | examinado sem apontamento | payload não capturado |
| FE07 | Validação antes de salvar e preservação | SchoolCreatePage, SchoolEditPage, ClassCreatePage, ClassEditPage | Leitura dos retornos de validação, 409, 422 e da manutenção do estado | parcialmente examinado | erro real não provocado |
| FE08 | Confirmação de exclusão | SchoolDeleteModal.js, ClassDeleteModal.js | Leitura da identificação do registro, cancelamento e mensagem de turmas | parcialmente examinado | cancelar e bloquear não executados |
| FE09 | Filtros Ativas, Todas e Encerradas | /escola/2/classes | Encerradas ficou checked, peso 700 e mensagem Nenhuma turma encerrada | examinado sem apontamento | total da escola não está nesta tela; na escola 2 o limite era 0 |
| FE10 | Carregamento, vazio, erro e sucesso | listagens e formulários | Carregando, erro com nova tentativa e vazio de turmas vistos; sucesso lido no código | examinado com apontamento | REV-05-FE-A002; REV-05-FE-A001 rejeitado |
| FE11 | Contraste de texto e foco; 320 px; texto ampliado | links medidos, onze cores de setor, edit, / e escola 2 a 320 px | Cor computada dos links e cálculo WCAG; largura 320 sem overflow nessas três telas; fonte raiz de 32 px na listagem de turmas a 1280 px | examinado com apontamento | REV-05-FE-A003; A31 e A33 parciais, sem perda observada no recorte medido |
| FE12 | Termos do domínio e ações equivalentes | rótulos de excluir, situação, limite e contexto | Excluir escola e Excluir turma no código; Ativa e Encerrada no filtro | examinado sem apontamento | REV-04-FE-A009 não reaberto |
| FE13 | Cliente único e repetição de chamadas | src/services/api.js e páginas | Chamadas passam pelo cliente compartilhado | examinado sem apontamento | nenhum |
| FE14 | Testes existentes | package.json | Script test não contém suíte e não foi executado | examinado sem apontamento | nenhum |
| R01 | Sem cadastro de setor | interface percorrida | Não há ação de adicionar setor | examinado sem apontamento | nenhum |
| R02–R04 | Setor da escola, escola fixa da turma e situação | formulários no código e edição de escola na tela | Setor editável com texto de vínculo; turma sem campo de escola; situação enviada pelo formulário | parcialmente examinado | gravação não executada |
| R05–R06 | Filtro padrão e capacidade | classes e escola 2 | Padrão Ativas visto; limite 0 com lista ativa vazia | examinado sem apontamento | soma não recalculada a partir de outra escola |
| R07–R12 | Bloqueio, confirmação, datas | modais no código; datas da escola 2 | Mensagem de bloqueio lida; datas 07/11/2026, 21:36 para o instante UTC da escola 2 | parcialmente examinado | exclusão não executada |
| R13 | Termos removidos | busca em src | Adicionar Setor, Dados avançados, Vagas ocupadas, Alunos matriculados e Apagar informações não aparecem | examinado sem apontamento | nenhum |
| CT01–CT04 | Campos, normalização, telefone e opções | schoolForm.js, classForm.js e valores de /escola/2/editar | Regras de tamanho, null, +55 e menus dependentes lidas; telefone da escola 2 permaneceu canônico no campo | parcialmente examinado | envio não capturado |

Examinado sem apontamento não significa aprovação do critério inteiro. Onde o método exigido não rodou, a pendência está na seção seguinte.

## Testes e verificações executados

| Caso | Versão e ambiente | Dados e comando ou passos | Esperado | Observado | Resultado | Evidência e IDs |
|---|---|---|---|---|---|---|
| Contraste dos links de contexto | 78601155, Chrome do Cursor, localhost:9000 | Estilo computado de Voltar aos setores em /setor/2 e dos links de contexto em /escola/2; cálculo com color-contrast | Texto de 16 px com pelo menos 4,5:1 sobre branco | rgb(0, 123, 255), 16 px, peso 400, razão 3,98:1 | falhou | REV-05-FE-A003 |
| Contraste do texto dos setores | mesmas versões; onze cores de GET /sectors | Regra de LandingPage.js aplicada a cada color | Pelo menos 4,5:1 | Todas as razões ficaram em ou acima de 4,5:1 | passou | não é achado; REV-04-FE-A010 não reaberto |
| Filtro de turmas encerradas | /escola/2/classes | Clique em Encerradas | Seleção identificável e mensagem do filtro, sem novo foco no h1 | Rádio checked, rótulo em peso 700, status Nenhuma turma encerrada, foco permaneceu no rádio | passou | nenhum |
| Consulta da escola 2 | /escola/2 | Abertura da rota | Nome, contexto, limite e datas compreensíveis | Nome capitalizado, limite 0, datas curtas em pt-BR, h1 focado | passou | nenhum |
| Largura de 320 px CSS | edit da escola 2, / e /escola/2, viewport 320x640 | Medição de scrollWidth e elementos além da largura | Sem perda por overflow horizontal | clientWidth 320 e scrollWidth 320, sem elementos fora da largura | passou no recorte medido | classes, cadastro e /login não medidos |
| Texto com raiz de 32 px | /escola/3/classes, viewport 1280x800 | font-size da raiz alterado só na página já aberta | Conteúdo e controles permanecem utilizáveis | Sem overflow horizontal; rádio e Adicionar Turma continuaram com caixa | passou nessa tela | não equivale ao zoom do navegador em todas as telas |
| Suíte automatizada | package.json | Não executada | — | Não há casos | não executado | FE14 |

## Verificações pendentes e limitações

| Verificação | Motivo da pendência | Método necessário | Momento previsto | IDs relacionados |
|---|---|---|---|---|
| Anúncio de estado, títulos e nome acessível | NVDA não entrou nesta rodada | LT | etapa final | REV-05-FE-A002 |
| Percurso completo por teclado e anel de foco | A tecla Tab deste ambiente não deslocou o foco do DOM; :focus não pôde ser medido com a janela sem foco | IN com janela focada | próxima conferência de interface | nenhum achado aberto |
| Link no alerta de exclusão bloqueada | O diálogo não foi aberto, para não excluir dado | IN + CC | quando houver escola com turma em base isolada | REV-05-FE-A003 |
| Salvar sem mudanças | O clique em Salvar não foi executado | IN | conferência da autora ou base isolada | REV-05-FE-A002 |
| Detalhe, edição e exclusão de turma | Escolas 1, 2 e 3 não tinham turmas | IN em base que já tenha turma | próxima conferência | REV-05-FE-A002 no código da edição |
| Validação com erro real, duplicidade e exclusão | Exigem gravação ou bloqueio real | IN em base isolada | quando a autora autorizar mutação | nenhum achado aberto |
| Zoom do navegador a 200% em todas as telas e largura de 320 px nas telas não medidas | O recorte medido foi parcial | IN | próxima conferência de interface | nenhum |
| Sessões com usuários | Fora desta execução | usuários | etapa final | nenhum |

## Fechamento pela autora

- Data e versão após intervenções: 2026-11-09, commit ec78f9594bc1a03b35e0e7723469e6832000511a, mensagem chore: reposition nothing to edit message, de Laura Vieira. Esse commit corrige o REV-05-FE-A002. O JSON gravado dentro dele ainda apontava a correção para d0665d4579f9c12f4c0583a351ccf70f05a36db3; a vinculação foi recolocada no registro.
- IDs reavaliados: REV-05-FE-A002, verificado no navegador antes do commit. A vinculação de ec78f95 confere as quatro fontes e não repete esse teste. A autora aprovou a tela corrigida.
- IDs que permanecem pendentes: REV-05-FE-A003 corrigido no recorte com ContextLink, ainda sem o olhar da autora e sem as listas carregadas, porque a API não respondeu. REV-05-FE-A001 foi rejeitado.
- Arquivos de reavaliação: avaliacao/rodadas/REV-05/evidencias/REV-05-FE-A002-aviso-antes.txt, REV-05-FE-A002-aviso-navegador-antes.json, REV-05-FE-A002-aviso-correcao.patch, REV-05-FE-A002-aviso-navegador-depois.json, REV-05-FE-A002-aviso-verificacao.txt e REV-05-FE-A002-aviso-vinculacao-ec78f95.txt
- Limites da cobertura e destino das verificações pendentes: NVDA e usuários continuam na etapa final; teclado, alerta de exclusão e turma persistida dependem de nova conferência de interface. A listagem de escolas foi conferida pela autora e o REV-05-FE-A001 não segue.
- Decisão de fechamento: pendente da autora

A autora aprovou a correção do REV-05-FE-A002. O commit que a contém é ec78f9594bc1a03b35e0e7723469e6832000511a. O REV-05-FE-A003 segue aberto.
