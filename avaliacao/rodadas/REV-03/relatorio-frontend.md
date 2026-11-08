# Revisão inicial do frontend — REV-03 / r01

> Documento de acompanhamento contínuo por decisão da autora em 08/11/2026. A inspeção, a cobertura e as declarações de não execução abaixo descrevem a emissão inicial r01. As intervenções posteriores estão na seção “Acompanhamento das implementações e correções” ao final e no histórico de achados-frontend.json; elas não constituem novas revisões.

## Identificação, objetivo e versão

- Rodada: REV-03. Execução: r01. Data de identificação: 2026-11-07, conforme contexto America/Sao_Paulo.
- Responsável pela emissão: Codex, revisão por IA. Identificador exato do modelo não disponibilizado nesta execução.
- Objetivo: inspecionar a implementação existente de Setor → Escola → Turma, inventariar operações e registrar cobertura, problemas e lacunas antes de qualquer intervenção.
- Repositório: C:/Users/laumt/OneDrive/Documentos/TCC/case-eleva; remoto origin: https://github.com/LauVieira/case-eleva.git.
- Branch: main. Commit: a87aec2e79771b4c74c3e21ede75e4a2fef55c41 (layout: minor adjusts). A revisão inclui o estado local identificado abaixo; não se presumiu árvore limpa.
- A autora esclareceu durante o pedido que REV-03 deve ser usado também na pasta e no campo rodada do JSON, substituindo as referências iniciais a REV-01 nesses dois lugares.
- Arquivo de achados: [achados-frontend.json](achados-frontend.json). Registro iniciado vazio nesta execução, sem importar achados anteriores.
- Produtos desta execução são novos; os nomes de relatório, JSON e patches não existiam antes da gravação.
- Escopo: operações da seção 2.1 do documento 01; R01–R13; CT01–CT05 na parte aplicável ao frontend; FE01–FE14; os 25 itens Axx do recorte e H01–H10. AR01 foi considerado apenas para delimitar sua aplicação ao backend.
- Método: inspeção dos arquivos reais, rastreamento de rotas, componentes, estados, chamadas HTTP e estilos. Não houve modificação da implementação, dependências ou configuração.
- Ambiente de inspeção: Windows, PowerShell, Node v24.16.0 e npm.cmd 11.13.0, consultados somente para identificação. Manifesto do projeto declara React ^17.0.1. Dependências locais consultadas: react-bootstrap 1.4.3, react-router-bootstrap 0.25.0 e @q42/floating-focus-a11y 1.3.3.
- Navegador, dados fictícios e banco de teste: não utilizados; nenhuma base foi preparada, nenhum servidor foi iniciado e nenhuma requisição à aplicação foi enviada.
- Contexto recebido: pedido desta conversa e os quatro instrumentos em avaliacao/. O backend foi acessado somente em leitura para contratos; o consolidado anterior fica reservado à última etapa, após a emissão dos documentos.

### Estado local e preservação da evidência

A inspeção de git status, git diff e git diff --cached identificou:

| Repositório | Estado anterior à revisão | Preservação |
|---|---|---|
| Frontend | package-lock.json modificado; 4.466 inserções e 2.539 exclusões. Nenhuma alteração staged. src/, HTML, estilos e configurações versionadas sem diferenças em relação ao commit. | [frontend-package-lock.patch](evidencias/frontend-package-lock.patch), diff completo do estado preexistente. |
| Frontend | avaliacao/01_Regras_e_Requisitos.md, 02_Review_Frontend.md, 04_Registro_e_Acompanhamento.md e 06_Modelo_Achados.json não rastreados. Nenhum outro arquivo não rastreado foi identificado inicialmente por git status --untracked-files=all. | Os arquivos fornecidos permanecem nos caminhos originais; identificação por SHA-256 abaixo. Não há novo código de aplicação a copiar. |
| Frontend | public/bundle.js e public/bundle.js.map preexistentes e ignorados pelo Git, assim como node_modules/. | Hashes abaixo; não recompilados nem alterados. A inspeção parcial do bundle não comprova equivalência integral com fontes ou dependências. |
| Backend | Branch feat/update-repository; commit a023d1eea2093d5511c22cfc444e11dfef704e4f; package-lock.json modificado e nenhuma outra diferença reportada pelo status. | [backend-package-lock.patch](evidencias/backend-package-lock.patch). As fontes referenciadas nos achados correspondem ao commit. |

O backend está em C:/Users/laumt/OneDrive/Documentos/TCC/case-eleva-api. Sua configuração persistente não foi alterada: as consultas Git usaram safe.directory somente no comando de leitura. O frontend original não é a mesma versão histórica do backend: o contrato consultado é o da branch/commit acima, após trabalhos anteriores nesse repositório.

| Arquivo ou evidência | SHA-256 do estado examinado |
|---|---|
| package-lock.json do frontend | CF4A9C58F4F1E8D60C6E197555E40E37F8BB36B99A1E66F0009DA2FFEF709B7F |
| package-lock.json do backend | 98ADB71340B3D7A2C584A7D5261C8D2C4DFFA3077D2632C4BBB02D2B62826376 |
| evidencias/frontend-package-lock.patch | 59C7FAC7F35FA07D4F274D578F069E7106A3C786609645AB74630DCE58913911 |
| evidencias/backend-package-lock.patch | A87D4C429406B89E38F1CADD2AA3562EE312914AD1F2F917724A549FBCC3D16E |
| public/bundle.js | 926488A20AD15B3229B9E03A83EB11E17BA40E5325257D0199E3D9490458598C |
| public/bundle.js.map | EB909F6BBBC69138C2BBA7F2248292CE33B999D96F6002C6B664414C2892F625 |
| node_modules/react-router-bootstrap/lib/LinkContainer.js | 3930EE9840FD935E6F9E605C3D11E307AFFF62202D2BE6656ECE0BA3139850FF |
| node_modules/react-bootstrap/esm/Card.js | C1C051BEF2620190C66C3060872D1D600E758D3E914A92C02C4C99CB81503593 |
| node_modules/react-bootstrap/esm/divWithClassName.js | FA614D80A87F50CCC4271F5A051A960FC1BB92A23D72513F40728EAC126C05F2 |
| node_modules/react-bootstrap/esm/ListGroup.js | 47AA53304FF144E05B6A84272B796590E7736569C3E16DB9DE27958230C30D31 |

### Instrumentos utilizados

Os documentos são locais e não rastreados no commit da aplicação. Os documentos Markdown identificam Laura Vieira e a data 05/11/2026; o modelo JSON usa versao_formato 1.0.

| Instrumento fornecido | SHA-256 |
|---|---|
| ../../01_Regras_e_Requisitos.md | 63498BFED055516D9213220D4BC9CBB9D6DCA89ACD224DACEDAF981150D9D66A |
| ../../02_Review_Frontend.md | 0D46A54401ABA6F57247C75D0F09D566866DCC4B99D79493A451CCF4E266E647 |
| ../../04_Registro_e_Acompanhamento.md | 029A6B378890A55BFA60BBD7AD0497D9459CCCD68DEC24DA91D61ADDEC710ABD |
| ../../06_Modelo_Achados.json | 920EA4ED8C2570578A2866787A57886DED12DAE45802E5BF16A00EF7DE5595F7 |

## Inventário do escopo

Situação de implementação descreve presença e alcance do código. “Implementado” não comprova funcionamento. O componente local SchoolCard de SectorPage e o componente compartilhado SchoolCard.js são distintos e foram ambos examinados.

| Funcionalidade ou componente | Arquivos ou rotas | Situação de implementação | Alcance da leitura |
|---|---|---|---|
| Entrada da aplicação e roteamento | src/index.js; src/App.js; /, /setor/:id, /escola/:id, /escola/:id/classes | Implementado | Inicialização, rotas exatas, destinos e consumidores. |
| Navegação compartilhada | src/components/Header.js; usado nas quatro consultas do domínio | Implementado | Imagem, ícone/texto, destinos, Navbar e estilo fixo. |
| Listagem de setores | src/pages/LandingPage.js; / | Implementado | GET, coleção, cartões, nomes/códigos, cor e ramificações de estado. |
| Consulta das escolas do setor | src/pages/SectorPage.js; /setor/:id | Implementado | GET por parâmetro, cartões e links das escolas. |
| Consulta de escola | src/pages/SchoolPage.js; src/components/SchoolCard.js; /escola/:id | Parcial | GET, repasse de dados e apresentação dos campos previstos. |
| Capacidade total da escola | src/components/SchoolCard.js | Não implementado | Ponto de apresentação e contrato de resposta inspecionados; REV-03-FE-A010. |
| Cadastro de escola | SectorPage; roteamento e todos os módulos de src/ | Não implementado | Inventário das rotas, controles e envios; REV-03-FE-A002. |
| Edição de escola / mudança de setor | SchoolCard.js; roteamento e todos os módulos de src/ | Não implementado | REV-03-FE-A003. |
| Exclusão de escola | SchoolCard.js; roteamento e todos os módulos de src/ | Não implementado | REV-03-FE-A004. |
| Listagem de turmas por escola | src/pages/ClassesPage.js; /escola/:id/classes | Implementado | GET, campos do cartão e destino declarado. |
| Filtros e situação na listagem de turmas | ClassesPage | Não implementado | REV-03-FE-A009; padrão do backend conferido somente no código. |
| Cadastro de turma | ClassesPage; roteamento e todos os módulos de src/ | Não implementado | REV-03-FE-A005. |
| Consulta de detalhes de turma | ClassCard em ClassesPage; roteamento | Não implementado | REV-03-FE-A006. |
| Edição e situação da turma | ClassesPage; roteamento e todos os módulos de src/ | Não implementado | REV-03-FE-A007. |
| Exclusão de turma | ClassesPage; roteamento e todos os módulos de src/ | Não implementado | REV-03-FE-A008. |
| Formulários administrativos e confirmações | src/ | Não implementado | Localização de campos, formulários, envios e diálogos; lacunas vinculadas às operações acima. |
| Login e formulário de autenticação | /login; src/pages/SignIn.js; src/components/LoginForm.js | Parcial, fora do escopo funcional | Arquivos lidos para distinguir formulário existente de formulários administrativos; autenticação não avaliada. |
| Documento HTML, CSS e foco compartilhado | public/index.html; public/styles/styles.css e reset.css; src/index.js | Implementado | Idioma, viewport, título, reset, tipografia e integração com FloatingFocus. |
| Servidor estático e empacotamento | server.js; webpack.config.js; package.json; .eslintrc.js; .gitignore | Implementado | Leitura das configurações e scripts; sem execução, instalação ou auditoria de vulnerabilidades. |
| Organização da aplicação | src/pages, src/components, src/contexts/.keep e src/hooks/.keep | Implementado | Responsabilidades, consumidores, repetição pertinente e pontos de integração HTTP. |
| Bundle e mapa locais ignorados | public/bundle.js e public/bundle.js.map | Não determinado integralmente | Bundle parcialmente lido nos módulos da aplicação; mapa identificado por hash, conteúdo não examinado. Sem verificação de build/reprodutibilidade. |
| Testes do frontend | package.json; arquivos próprios de src/, public/ e raiz inventariados | Não implementado no material localizado | Não foram localizados casos de teste próprios; script test é marcador. Testes de dependências não foram tratados como testes da aplicação. |

Não foram encontrados componentes de tabelas, áudio/vídeo, mapa, menus flutuantes/submenus ou operações de manutenção de setores implementadas no percurso. Os arquivos raster do cabeçalho e brasão foram identificados por suas referências; o conteúdo visual das imagens não foi examinado. Não se inferiu ausência de imagens com texto.

### Contratos consultados no backend

O código do backend estava disponível para inspeção. A disponibilidade do serviço HTTP e do banco em execução não foi aferida.

| Contrato | Fontes do backend efetivamente lidas | Alcance |
|---|---|---|
| Prefixos e listagem de setores/escolas | src/app.js; routers/sectorsRouter.js; controllers/SectorController.js; services/SectorService.js; repositories/SectorRepository.js e SchoolRepository.js | Caminhos GET, resposta de coleção e consulta por setor. |
| Detalhe da escola e capacidade | routers/schoolsRouter.js; controllers/SchoolController.js; services/SchoolService.js; repositories/SchoolRepository.js e ClassRepository.js | Campo totalCapacity, soma das current e tratamento estático de soma vazia. |
| Listagem de turmas e filtro | controllers/SchoolController.js; services/SchoolService.js; repositories/ClassRepository.js | Query status, padrão current e all sem restrição por situação. |
| Operações administrativas previstas | routers/schoolsRouter.js e classesRouter.js; controllers/SchoolController.js e ClassController.js; services/SchoolService.js e ClassService.js | Endpoints POST/PATCH/DELETE e detalhe de turma presentes no código consultado; nenhum exercitado. |
| Nomes e opções de turma | utils/normaliseName.js; constants/classOptions.js; chamadas dos services acima | Normalização e constantes de opções, sem conferência de persistência. |
| Respostas de erro | middlewares/errorHandler.js | Formato message e mapeamento HTTP estático. |

Foram lidos integralmente esses arquivos curtos e os services/repositories mencionados. Isso não constitui revisão completa do backend. Schemas de entrada, models, migrations, seeds, testes e estado real do banco não foram inspecionados nesta execução. Por isso CT01–CT05, R03, R07, R08 e R12 não têm comprovação de integridade/persistência; bloqueios, unicidade, datas e validação de requisições diretas continuam pendentes de verificação pertinente.

## Cobertura da inspeção

“Examinado sem achados” se refere exclusivamente ao aspecto e ao método descritos. Não equivale a aprovação, funcionamento comprovado ou conformidade de acessibilidade. “Parcialmente examinado” indica limite de método/ocorrência; os métodos pendentes permanecem explicitados.

### Roteiro FE01–FE14

| Item | Requisito e aspecto | Local examinado | Método e evidência da inspeção | Estado de cobertura | IDs ou pendência |
|---|---|---|---|---|---|
| FE01 | Rotas de consulta, destinos válidos entre setor e escola | App:14–18; LandingPage:48–59; SectorPage:64–79; SchoolCard:17,46 | IC: correspondência entre padrões de rota e interpolação de IDs após resposta válida. | Examinado sem achados nesse aspecto | Navegação real e abertura direta pendentes. |
| FE01 | Ações anunciadas, alcance por entidade e retorno/contexto | App; LandingPage; SectorPage; ClassesPage; Header; SchoolCard | IC: rastreamento de todos os destinos e da presença de operações. | Examinado com achados | REV-03-FE-A001, REV-03-FE-A002, REV-03-FE-A003, REV-03-FE-A004, REV-03-FE-A005, REV-03-FE-A006, REV-03-FE-A007, REV-03-FE-A008, REV-03-FE-A013. |
| FE02 | Estrutura, idioma, imagens e documento | Quatro páginas do domínio; Header; public/index.html; dependências de Card/ListGroup | IC: tags declaradas, padrões das dependências e atributos. | Parcialmente examinado | REV-03-FE-A016, REV-03-FE-A017, REV-03-FE-A018, REV-03-FE-A019; DOM e NVDA pendentes. |
| FE03 | Elementos de ação/navegação, nomes e estados | Header; SchoolCard; SectorItem; SchoolItem; ClassItem; LinkContainer instalado | IC: composição dos controles e implementação que clona filhos. | Parcialmente examinado | REV-03-FE-A011, REV-03-FE-A015; HTML efetivo, teclado e NVDA pendentes. |
| FE04 | Infraestrutura de foco e acesso ao conteúdo | src/index.js:7–10; styles.css:7–14; Header; páginas | IC: inicialização de FloatingFocus, estilos e estrutura das telas. Sem percurso de foco executado. | Parcialmente examinado | REV-03-FE-A015, REV-03-FE-A017; foco/teclado no navegador pendentes. |
| FE04 | Foco em confirmação e após salvar/excluir | Inventário completo de src/ | IC: presença dos fluxos e seus consumidores. | Examinado com achados — operações não implementadas | REV-03-FE-A002, REV-03-FE-A003, REV-03-FE-A004, REV-03-FE-A005, REV-03-FE-A007, REV-03-FE-A008; verificar quando existirem. |
| FE05 | Contratos dos formulários de escola e turma | App; páginas; componentes; LoginForm apenas para inventário | IC: localização de formulários administrativos, campos e manipuladores. | Examinado com achados — não implementados | REV-03-FE-A002, REV-03-FE-A003, REV-03-FE-A005, REV-03-FE-A007; não se atribuíram falhas de rótulo a campos ausentes. |
| FE06 | Apresentação, serialização, vínculos e datas | SchoolCard; SectorPage; ClassesPage; contratos backend indicados | IC: uso dos campos retornados e localização dos envios. | Parcialmente examinado | REV-03-FE-A003, REV-03-FE-A005, REV-03-FE-A006, REV-03-FE-A007, REV-03-FE-A010, REV-03-FE-A014; payload/persistência pendentes. |
| FE07 | Validação, mensagens por campo e preservação | Conjunto de src/ e rotas | IC: inventário dos formulários/envios necessários. | Examinado com achados — não implementado | REV-03-FE-A002, REV-03-FE-A003, REV-03-FE-A005, REV-03-FE-A007; reenvio/erros reais pendentes de implementação. |
| FE08 | Excluir, confirmar, cancelar e orientar bloqueio | SchoolCard; ClassesPage; rotas | IC: inventário dos comandos e caminhos de mutação. | Examinado com achados — não implementado | REV-03-FE-A004, REV-03-FE-A008; confirmação e cancelamento não foram observados. |
| FE09 | Filtros, situação e capacidade | ClassesPage; SchoolCard; SchoolService e ClassRepository do backend | IC: parâmetros da consulta, campos utilizados e contrato estático. | Examinado com achados | REV-03-FE-A009, REV-03-FE-A010; alternância de filtros e total em execução pendentes. |
| FE10 | Carregamento, vazio, erro, sucesso e recuperação | Quatro páginas; SchoolCard; handlers de consulta | IC: estados iniciais, then/catch, renderização condicional e mecanismos de mensagem. | Examinado com achados | REV-03-FE-A012, REV-03-FE-A020; comportamento real e anúncios pendentes. |
| FE11 | Reorganização, texto, orientação e cores | Estilos compartilhados e styled-components das páginas/cards/Header; algoritmo colorContrast | IC: larguras, alturas, grade, cabeçalho fixo, viewport e cores declaradas. Nenhuma medição de resultado renderizado. | Parcialmente examinado | 320 px CSS, texto 200%, orientação, cor efetiva, contraste de texto/controle/foco pendentes; sem achado específico por mera cor/largura declarada. |
| FE12 | Termos, instruções e informações do recorte | Textos de todos os componentes do domínio | IC: confronto dos textos com R13/CT04 e tarefas Hxx. | Examinado com achados | REV-03-FE-A001, REV-03-FE-A011, REV-03-FE-A013. Compreensão com usuários pendente. |
| FE13 | Responsabilidades, repetição e dependências | Todos os módulos de src/; package.json; webpack.config.js; server.js; .eslintrc.js | IC: relações entre páginas/componentes e chamadas à API. | Examinado com achados | REV-03-FE-A021. Não se impôs AR01 ao frontend nem migração de stack. |
| FE14 | Testes próprios disponíveis | Inventário dos arquivos próprios e scripts package.json:6–11 | IC: localização de casos, configuração e comandos; nenhum caso próprio localizado para ler asserções/dados. | Examinado sem achados adicionais | Não há evidência de cobertura automatizada ou de execução. Script eslint inclui --fix e não foi acionado. |

### Regras e contratos

| Item | Aspecto e local | Estado de cobertura da inspeção | IDs ou limite |
|---|---|---|---|
| R01 | Setores; LandingPage e SectorPage | Examinado com achados | REV-03-FE-A001. |
| R02 | Edição da escola e setor; SchoolCard/App/src | Examinado com achados — não implementado | REV-03-FE-A003; persistência não verificada. |
| R03 | Cadastro/edição de turma e escola imutável; ClassesPage/App/src | Parcialmente examinado | REV-03-FE-A005, REV-03-FE-A007; contratos diretos da API/banco não verificados. |
| R04 | Situação editável, apresentação e inicialização | Examinado com achados — implementação parcial do percurso | REV-03-FE-A005, REV-03-FE-A007, REV-03-FE-A009. |
| R05 | Padrão e seleção de filtros; ClassesPage e contrato estático | Examinado com achados | REV-03-FE-A009. Padrão current encontrado no backend, sem execução. |
| R06 | Total de capacidade; SchoolCard e contrato estático | Examinado com achados | REV-03-FE-A010; soma e independência do filtro não executadas. |
| R07 | Exclusão de escola e turmas vinculadas | Parcialmente examinado | REV-03-FE-A004; UI não implementada. Leitura contextual de bloqueio no service não comprova proteção no banco. |
| R08 | Integridade em API e restrições do banco | Não examinado no alcance completo | Responsabilidade do backend/banco; models, migrations e restrições efetivas fora da inspeção desta execução. |
| R09 | Orientação após bloqueio | Examinado com achados — fluxo não implementado | REV-03-FE-A004; mensagem de conflito lida no backend, sem observar resposta. |
| R10 | Validação, preservação e confirmação | Examinado com achados — operações não implementadas | REV-03-FE-A002, REV-03-FE-A003, REV-03-FE-A004, REV-03-FE-A005, REV-03-FE-A007, REV-03-FE-A008. |
| R11 | Exclusão de turma | Examinado com achados — não implementado | REV-03-FE-A008; nenhuma dependência de matrícula foi presumida. |
| R12 | Datas e atualização | Parcialmente examinado | REV-03-FE-A006, REV-03-FE-A007; preservação/atualização de datas no banco não examinadas. |
| R13 | Elementos e rótulos removidos do escopo | Examinado com achados | REV-03-FE-A011. |
| CT01 | Campos, tipos e opcionais de escola/turma | Parcialmente examinado | Inventário/consulta lidos; formulários ausentes: REV-03-FE-A002, REV-03-FE-A003, REV-03-FE-A005, REV-03-FE-A007. Escola imutável, datas e zero aguardam verificação própria. |
| CT02 | Normalização, unicidade e apresentação | Parcialmente examinado | REV-03-FE-A014; envio não implementado nas operações acima. Unicidade/persistência não testadas. |
| CT03 | Telefone canônico ou null | Examinado com achados — formulário/envio não implementado | REV-03-FE-A002, REV-03-FE-A003. Não se exigiu máscara visual opcional como condição de conformidade. |
| CT04 | Segmento, grupo/ano, turno e situação | Parcialmente examinado | REV-03-FE-A005, REV-03-FE-A007, REV-03-FE-A009, REV-03-FE-A011; menus dependentes não implementados. |
| CT05 | Seeds e persistência | Não examinado | Sem seeds próprias no frontend; seeds/backend/banco fora da inspeção. Não se concluiu adequação de dados reais ou fictícios. |
| AR01 | Arquitetura alvo controller → service → repository → banco | Não aplicável à arquitetura do frontend, por definição da seção 5 do documento 01 | Não usado para transformar divergência estrutural em defeito funcional. |

### Recorte operacional de acessibilidade

Não há aprovação global de qualquer item Axx nesta inspeção. Achados de implementação podem existir sem concluir toda a verificação operacional. A inexistência de formulário/diálogo é registrada como lacuna da operação; não reprova automaticamente os critérios de um controle que ainda não existe.

| Item | Local e aspecto efetivamente inspecionado | Estado de cobertura | IDs ou verificação necessária |
|---|---|---|---|
| A01 | Header, ClassItem, src/index.js e CSS de foco; rastreamento estático | Parcialmente examinado | REV-03-FE-A015; teclado, sequência, visibilidade, cabeçalho fixo e foco após navegação pendentes. Confirmações dependem de implementação. |
| A05 | Header:14–17 e usos de ícones; referências das imagens | Parcialmente examinado | Alt da imagem existe no código; visual informativo/decorativo e nomes/leitura dos ícones não verificados. NVDA ao final. |
| A07 | Quatro páginas; Card.Title e dependência instalada | Examinado com achados no código | REV-03-FE-A016; DOM e navegação por títulos com NVDA pendentes. |
| A08 | Header e containers das quatro páginas; index.html | Examinado com achados no código | REV-03-FE-A017; regiões efetivas e leitura com NVDA pendentes. |
| A09 | Coleções e padrões ListGroup/CardDeck/Row/Col | Examinado com achados no código | REV-03-FE-A018; DOM e leitura dos conjuntos com NVDA pendentes. |
| A11 | Destinos declarados e composição de links | Parcialmente examinado | REV-03-FE-A015; percurso, nome contextual e operação em navegador/NVDA pendentes. Lacunas de destinos em FE01. |
| A12 | Estrutura compartilhada e mecanismo de acesso direto | Examinado com achados no código | REV-03-FE-A017; ativação e posicionamento do foco por teclado pendentes. |
| A14 | Ocorrências de Header lidas apenas como apoio | Não examinado pelo método IN previsto | Comparar posição/comportamento efetivos da navegação no navegador. |
| A16 | Tipos/composição de ações presentes | Parcialmente examinado | REV-03-FE-A015; DOM/teclado/NVDA pendentes. Salvar, excluir e filtros aguardam implementação. |
| A17 | Textos declarados lidos como apoio | Não examinado pelo método IN previsto | Conferir interface após implementação; evidência de texto em REV-03-FE-A011, sem resultado IN. |
| A19 | Ausência de formulário administrativo constatada no inventário | Não examinado em interação | Preenchimento/foco e ausência de envio/navegação inesperada dependem de implementação e IN. |
| A22 | Localização de formulários administrativos | Parcialmente examinado | Não implementados. Rótulos, associação, obrigatoriedade, preenchimento e NVDA pendentes; sem falha autônoma atribuída a campos inexistentes. |
| A23 | Localização de formulários e seleções dependentes | Parcialmente examinado | Não implementados. Tipos, instruções e agrupamentos aguardam implementação/IN/NVDA. |
| A24 | Localização de envio/validação e recuperação | Parcialmente examinado | Operações ausentes em FE07; dados inválidos, indicação de campo/erro e correção não executados. |
| A25 | Inventário dos fluxos administrativos e exclusões | Parcialmente examinado | Operações ausentes em FE07/FE08. Não houve observação de revisão/validação/confirmar/cancelar. |
| A28 | Viewport, grade, larguras/alturas e estrutura lidos | Parcialmente examinado | 320 px CSS, orientação, organização e preservação de operações pendentes no navegador. |
| A29 | Situação/filtro inventariados; textos e estilos lidos como apoio | Não examinado pelo método IN previsto | Não inferir dependência de cor sem interface; filtros em REV-03-FE-A009 aguardam implementação. |
| A30 | Algoritmo de cor e cores declaradas lidos como apoio | Não examinado por IN + CC | Medir pares texto/fundo efetivos, tamanho/peso e estados; nenhum resultado de contraste emitido. |
| A31 | Estilos de foco/controles lidos como apoio | Não examinado por IN + CC | Medir partes essenciais e foco nas relações aplicáveis; nenhuma conclusão pelas cores do código. |
| A33 | Nenhuma ampliação executada | Não examinado | Ampliar texto a 200% e conferir funções/conteúdo; 80 caracteres fora do recorte. |
| A35 | index.html:3,7–8 e mecanismos por rota em src/ | Parcialmente examinado | Idioma principal pt-br presente; REV-03-FE-A019; título efetivo e leitura no navegador/NVDA pendentes. |
| A37 | index.html:7 e sequência declarada das páginas | Parcialmente examinado | Sem bloqueio explícito ao zoom encontrado na meta viewport. Ordem efetiva, zoom e leitura dependem de IN/LT. |
| A38 | Texto visível, alt e composição dos controles | Parcialmente examinado | REV-03-FE-A015; nome calculado no DOM e correspondência percebida com NVDA pendentes. |
| A39 | Caminhos assíncronos e markup das mensagens | Examinado com achados no código | REV-03-FE-A020; anúncio real pelo NVDA não observado, inclusive dos alerts nativos. |
| A40 | Uso e implementação local de LinkContainer | Parcialmente examinado | REV-03-FE-A015 é indício: HTML gerado/DOM não inspecionado; função/estado em navegador e NVDA pendentes. |

A10 é não aplicável às telas inventariadas porque não há tabelas no código da interface. A06 permanece fora do roteiro do mapa; conteúdo visual das imagens não foi examinado, portanto não se declarou o grupo inteiro não aplicável. A13, A18, A20, A32 e A34 ficam fora da rodada por delimitação do instrumento. A02, A03, A04, A15, A21, A26, A27, A36, A41 e A42 não recebem avaliação sistemática; não se presumiu aprovação ou ausência de todos os recursos abrangidos. A transição visual incorporada pela biblioteca FloatingFocus foi apenas identificada na leitura, sem avaliação de animação, fora do recorte. Áudio/vídeo, autenticação, AAA e eMAG não foram avaliados. Cancelar confirmação de exclusão é tratado em A25, sem incluir A20.

### Usabilidade por tarefas

| Referência | Aspecto e fontes examinadas | Cobertura | IDs ou limite |
|---|---|---|---|
| H01 | Estados das consultas e apresentação; quatro páginas/cards | Examinado com achados | REV-03-FE-A009, REV-03-FE-A010, REV-03-FE-A012. |
| H02 | Termos, nomes e contexto do domínio | Examinado com achados | REV-03-FE-A011, REV-03-FE-A013, REV-03-FE-A014. |
| H03 | Retorno e presença de fluxos de cancelamento | Parcialmente examinado | REV-03-FE-A004, REV-03-FE-A008, REV-03-FE-A013; cancelamento não executado. |
| H04 | Nomenclatura e representação de situações | Examinado com achados | REV-03-FE-A009, REV-03-FE-A011, REV-03-FE-A014. |
| H05 | Inventário de validação/confirmar/excluir | Parcialmente examinado | Operações administrativas ausentes em FE05–FE08; não se avaliou eficácia de proteção inexistente. |
| H06 | Contexto, retorno e identificação das consultas | Examinado com achados | REV-03-FE-A006, REV-03-FE-A013, REV-03-FE-A019. |
| H07 | Filtros e percurso de listagem | Examinado com achados | REV-03-FE-A009; eficiência com usuários pendente. Não se exigiu busca ou atalhos. |
| H08 | Ações e informações exibidas versus escopo | Examinado com achados | REV-03-FE-A001, REV-03-FE-A011. |
| H09 | Caminhos de erro de consulta e presença de tratamento das operações | Parcialmente examinado | REV-03-FE-A004, REV-03-FE-A012; erro real/reenvio não executados. |
| H10 | Presença de formulários/instruções administrativas | Parcialmente examinado | Formulários não implementados em FE05; suficiência/compreensão da ajuda local depende de implementação e usuários. |

## Testes e verificações executados

**Não foram executados testes.** Também não foram executados build, lint, autofix, instalação/atualização de pacotes, scripts da aplicação, requisições à API, migrations, seeds ou alterações de dados.

A leitura de package.json constatou que test contém apenas o marcador “Error: no test specified” seguido de saída 1; o comando não foi executado. Nenhuma suíte própria de frontend foi localizada nos arquivos da aplicação inventariados. Testes incluídos em node_modules não representam testes do projeto e não foram usados como comprovação.

As operações efetivamente realizadas foram leituras de arquivos, buscas estáticas, identificação de ambiente, consultas Git, cálculo de hashes, exportação de diffs preexistentes e geração/conferência dos registros de avaliação. A conferência estrutural dos documentos não é teste do frontend.

| Caso ou método | Ambiente / dados / comando | Esperado | Observado | Resultado |
|---|---|---|---|---|
| Testes automatizados do frontend | Nenhum comando de teste executado; nenhuma base preparada | Conforme contratos dos requisitos aplicáveis | Não observado | Não executado |
| Percurso no navegador e teclado | Nenhum navegador ou percurso usado | Navegação, foco, retorno e recuperação conforme roteiro | Não observado | Não executado |
| Contraste de texto/controle/foco | Nenhuma cor efetiva renderizada medida | Limites e exceções de A30/A31 | Não observado | Não executado |
| Texto 200%, 320 px CSS e orientação | Nenhuma viewport renderizada/ampliação usada | Preservação de conteúdo e operação no recorte | Não observado | Não executado |
| Leitura NVDA | Nenhum leitor de tela utilizado | Conforme Axx aplicáveis | Não observado | Não executado — etapa final |
| Sessões com usuários | Nenhuma sessão realizada | Compreensão e execução das tarefas | Não observado | Não executado — etapa final |
| CRUD, filtros e integridade com API/banco | Nenhuma requisição ou mutação realizada | R01–R13 e CT01–CT05 aplicáveis | Não observado | Não executado |

## Verificações pendentes e limitações

| Verificação | Motivo | Método necessário | Momento previsto | IDs relacionados |
|---|---|---|---|---|
| Operações ainda ausentes | Inspeção encontrou lacunas; não há percurso completo para observar | Implementação separada, seguida de inspeção e verificação no navegador/API isolada | Rodada posterior à implementação | REV-03-FE-A002, REV-03-FE-A003, REV-03-FE-A004, REV-03-FE-A005, REV-03-FE-A006, REV-03-FE-A007, REV-03-FE-A008, REV-03-FE-A009, REV-03-FE-A010 |
| Rotas, retornos, abertura direta, nomes e contexto | Código examinado sem navegação real | Navegador e teclado | Próxima verificação de interface | REV-03-FE-A001, REV-03-FE-A006, REV-03-FE-A013, REV-03-FE-A014, REV-03-FE-A019 |
| Estados das consultas, lista vazia, erros e nova tentativa | Sem requisição executada | Navegador/API com dados fictícios, sem atrasar artificialmente a rede | Próxima verificação de interface | REV-03-FE-A012, REV-03-FE-A020 |
| Semântica/ativação dos filhos de LinkContainer | Apenas composição e dependência local lidas; HTML não renderizado | Inspeção do DOM, Tab/Shift+Tab e ativação por teclado | Próxima verificação de interface; NVDA na etapa final | REV-03-FE-A015 |
| Foco perceptível, sequência, retorno e cabeçalho fixo | FloatingFocus e CSS não comprovam foco efetivo | Navegador/teclado nos estados presentes e futuros | Próxima verificação de interface | REV-03-FE-A015, REV-03-FE-A017; confirmações ligadas às lacunas |
| Reorganização, orientação e ampliação | Aparência não demonstrada pela leitura de estilos | 320 px CSS, texto a 200% e orientações pertinentes no navegador | Próxima verificação de interface | Nenhum achado específico; FE11/A28/A33/A37 |
| Contraste e dependência apenas de cor | Sem pares efetivos, tamanhos e estados renderizados | Navegador e cálculo de contraste conforme A29–A31, incluindo foco | Próxima verificação de interface | Nenhum achado específico; sem resultado CC |
| Títulos, regiões, listas, imagens e nomes de controles | Inspeção de código não comprova experiência assistiva | DOM como preparação; NVDA na etapa final | Etapa final para LT | REV-03-FE-A015, REV-03-FE-A016, REV-03-FE-A017, REV-03-FE-A018, REV-03-FE-A019 |
| Anúncios de mensagens e resultado | Nenhum anúncio observado | NVDA, com carregamento quando aparecer normalmente | Etapa final | REV-03-FE-A020 |
| Compreensão dos textos e tarefas | Sem participação humana na execução | Sessões com usuários, segundo o recorte da pesquisa | Etapa final | REV-03-FE-A011, REV-03-FE-A013 e tarefas implementadas |
| Payloads, tipos, opcionais, normalização, telefone e combinações | Formulários ausentes; schemas de backend não inspecionados | Inspeção da implementação futura e verificações de integração | Rodada posterior à implementação | REV-03-FE-A002, REV-03-FE-A003, REV-03-FE-A005, REV-03-FE-A007 |
| Unicidade, vínculos, exclusão bloqueada, capacidade e datas persistidas | Não houve acesso HTTP/banco; models/migrations/seeds fora desta inspeção | Verificações pertinentes em ambiente isolado, identificando ambas as versões | Rodada de integração; antes da avaliação final | REV-03-FE-A004, REV-03-FE-A006, REV-03-FE-A007, REV-03-FE-A008, REV-03-FE-A009, REV-03-FE-A010 |
| Origem da API após eventual reorganização | Somente leitura de configuração e consumidores | Conferir as quatro consultas no ambiente escolhido | Rodada posterior à intervenção | REV-03-FE-A021 |
| Correspondência entre fontes, dependências e bundle | Artefatos ignorados preexistentes e lock modificado; sem build | Conferência de build em etapa autorizada, preservando esta versão | Rodada posterior, se necessária à execução | Nenhum achado específico; versão renderizada deve ser identificada |

Esta execução não permite declarar conformidade integral com ABNT NBR 17225:2025, WCAG ou com o recorte operacional inteiro. Não foi calculado percentual de acessibilidade ou nota geral de usabilidade. Não há evidência de observação humana, testes passados/falhos ou comportamento em execução.

## Registro emitido e acompanhamento

Foram emitidos 21 apontamentos: 10 do tipo defeito, 9 lacunas de implementação, 1 indício e 1 melhoria estrutural. A classificação de evidência no código é distinta da confirmação humana: todos têm confirmacao_autora pendente e situacao aguardando_confirmacao, sem correção, reavaliação, duplicado_de ou histórico preenchidos.

Na última etapa, somente após gerar os dois documentos e conferir sua estrutura, foi consultado C:/Users/laumt/OneDrive/Documentos/TCC/case-eleva-api/avaliacao/achados.json: 13 registros, SHA-256 ECD29FA28AC29008E97A829532B90A16169702BC7730151E740528E95BCAE550. Foram acrescentadas observações de relação no campo evidencia de 11 achados frontend, mantendo exatamente os campos do modelo. As relações remetem a 8 IDs anteriores; não foi demonstrada identidade de problema que justificasse duplicidade. Os estados resolvido_no_recorte desses IDs são os informados no consolidado consultado, sem reavaliação nesta execução. Nenhum achado anterior foi importado, nenhum ID ou estado de acompanhamento foi alterado e o consolidado backend permaneceu intacto. As descrições e relações individuais ficam exclusivamente no JSON.

### Fechamento pela autora

Não realizado nesta execução. Nenhum ID foi confirmado, rejeitado ou reavaliado pela autora; não houve intervenção ou decisão de fechamento. Todos os IDs REV-03-FE-A001 a REV-03-FE-A021 aguardam conferência humana. As verificações pendentes têm destino descrito acima; as correções serão tratadas em etapa separada.

## Acompanhamento das implementações e correções

Atualizado em 08/11/2026 por Codex, a pedido da autora. Esta seção acompanha as intervenções após a inspeção inicial, sem reescrever sua cobertura ou atribuir suas limitações à versão atual. A autora determinou que implementações e correções sejam registradas no histórico do mesmo JSON, com atualização deste relatório, sem gerar um novo relatório/JSON por correção.

O registro ativo do frontend é [achados-frontend.json](achados-frontend.json). A raiz REV-03/r01 identifica a emissão inicial; cada intervenção conserva data, versão, evidências e resultado em correcao, reavaliacao e historico. Os campos da primeira identificação foram preservados. O arquivo reúne 22 IDs: os 21 da inspeção inicial e A022, apontado posteriormente pela autora.

### Organização dos registros

- A001 e A022 já possuíam acompanhamento neste arquivo e foram preservados.
- A002, A003, A004 e A012 receberam os históricos completos que estavam no consolidado do backend, incluindo vínculos de commits posteriores aos arquivos rXX.
- O registro do backend em case-eleva-api/avaliacao/achados.json mantém seus 13 achados de backend; os quatro registros de frontend transferidos passam a ser mantidos exclusivamente no arquivo principal acima. As referências cruzadas entre IDs permanecem válidas.
- Os JSONs r02–r06 e relatorio-frontend-r06.md ficam preservados como registros históricos das intervenções e verificações anteriores. Seus identificadores são usados apenas para localizar os produtos já existentes; não são arquivos ativos de acompanhamento.
- As evidências existentes permanecem nos caminhos referenciados. A mesma evidência de A004 foi relacionada ao aspecto de carregamento do detalhe em A012, com indicação dos três casos pertinentes.
- O estado anterior desta organização, incluindo o relatório, o JSON principal, o instrumento 04 e o consolidado do backend, está preservado em [evidencias/organizacao-acompanhamento-2026-11-08/](evidencias/organizacao-acompanhamento-2026-11-08/), com manifesto de hashes.

### Situação do acompanhamento

| ID | Versão da intervenção | Verificação registrada e evidência | Situação mantida |
|---|---|---|---|
| REV-03-FE-A001 | 7d2cd568bcdcdc757f07af4d7efb2ce8e97d3436 | Inspeção e evidências referenciadas no JSON; confirmação da autora já registrada | resolvido_no_recorte |
| REV-03-FE-A002 | 2aeca1b0a36095c608bc982a90c1386aa9c0f9bc | Inspeção, compilação e verificações anteriores com respostas de escrita simuladas; evidências A002-r03 | aguardando_reavaliacao |
| REV-03-FE-A003 | 44e57e7b3bf58796ab9b76ed664002754d14a489 | Evidências A003-r05: 13 casos de navegador com API simulada e 14 conferências pontuais dos utilitários; patch/fontes conferidos contra o commit nesta atualização | aguardando_reavaliacao |
| REV-03-FE-A004 | 14177b25954507fc0d2d3c5658c4169a6651a070 | Evidências A004-r06: compilação e 15 casos de navegador com API simulada, sete DELETEs interceptados e nenhuma exclusão real | aguardando_reavaliacao |
| REV-03-FE-A012 | Escolas: 8de40dbf66d501dc1739124de9b53a75b9640ed2; turmas: 2aeca1b0a36095c608bc982a90c1386aa9c0f9bc; detalhe: 14177b25954507fc0d2d3c5658c4169a6651a070 | Evidências A012-r02/r04 e três casos já executados em A004-r06 para o detalhe, compartilhados no JSON | persistente |
| REV-03-FE-A022 | e60fa6502bf43f37603b2f887c7ec7643f477026 | Inspeção e evidência fornecida pela autora, conforme acompanhamento já registrado no JSON | resolvido_no_recorte |

Os demais 16 IDs conservam os estados e registros anteriores. As descrições individuais dos achados e das intervenções ficam no JSON. A confirmação de A003 e A004 permanece pendente; a organização documental e a manifestação de satisfação não foram convertidas em aprovação humana das verificações.

Em 08/11/2026, por solicitação da autora, o commit 14177b25954507fc0d2d3c5658c4169a6651a070 foi associado a A004 e ao complemento de A012. O patch dos três arquivos alterados e a nova SchoolDeleteModal.js correspondem integralmente às evidências já verificadas. Essa associação documental não representa nova execução de testes ou validação de persistência. Preservação e conferência em [evidencias/vinculacao-commit-14177b2/](evidencias/vinculacao-commit-14177b2/).

### Verificações e pendências atuais

Nesta atualização documental não foram executados testes, build, lint, navegador ou mutações de dados. Foram conferidos o contrato do JSON, a preservação dos registros/históricos, as referências documentais e a correspondência do commit de edição com as evidências já verificadas. A compilação e as interações citadas na tabela ocorreram nas intervenções anteriores, com os métodos e limites descritos nos respectivos registros.

Continuam pendentes a integração/persistência reais do cadastro, edição e exclusão em banco isolado e as verificações de integridade pertinentes. Os pontos adiados do cadastro permanecem registrados em A002. A012 conserva suas ocorrências em LandingPage e nos erros/recuperação das listagens. O percurso completo de desbloqueio de exclusão depende também de A008/A009. Contraste medido, ampliação de texto, percurso completo de teclado, NVDA e sessões com usuários permanecem pendentes conforme o recorte aplicável.

Não foi realizada nova revisão nem encerramento global. As próximas intervenções atualizarão este relatório e os campos de acompanhamento do JSON principal, preservando a identificação original e as evidências antes/depois.
