# Instrumento de revisão do frontend

Laura Vieira · Instrumento de trabalho do TCC · 05/11/2026

## 1. Condições de execução

Ler os documentos 01_Regras_e_Requisitos.md e 04_Registro_e_Acompanhamento.md. Identificar repositório, commit, alterações locais, ambiente e instrumentos usados. Examinar os arquivos reais, sem presumir comportamento não demonstrado. Usar null ou declarar a limitação quando uma informação não estiver disponível.

Na REV-01, inventariar as funcionalidades e examinar o escopo definido a partir do código disponível. Nas rodadas seguintes, revisar o conjunto de alterações e dependências pertinentes. Todas as rodadas usam os mesmos dois produtos: relatório em Markdown e achados em JSON separado. Na primeira rodada, iniciar o registro de achados vazio.

A revisão não altera código, dependências, configuração, migrations ou seeds e não executa autofix. É permitido escrever os arquivos de avaliação solicitados. Correções são realizadas em etapa separada, após preservar a revisão. Executar testes quando incluídos no pedido e em ambiente apropriado; operações que alterem dados exigem banco de teste isolado.

Para cada item, registrar alcance, arquivos/componentes examinados, método, evidência da inspeção e resultado de cobertura, inclusive sem achados. Informar o que ficou fora da rodada, parcialmente examinado ou pendente. Presença de código ou de teste não comprova execução nem conformidade.

Não ampliar funcionalidades nem acrescentar frameworks, Playwright ou axe-core. NVDA e usuários são procedimentos da avaliação final. Verificações dependentes desses métodos ficam explicitamente pendentes até essa etapa.

## 2. Pontos de revisão

Usar as verificações abaixo como roteiro. Elas não substituem o texto dos requisitos. Verificar também código compartilhado afetado, consumidores de componentes alterados e os contratos da API disponíveis.

| ID | Inspeção a realizar | Referências | Confirmação complementar |
|---|---|---|---|
| FE01 | Rotas, destinos de links, retorno, contexto da escola/turma; identificar ações prometidas e não implementadas | R01, R13; A11, A14; H02, H03, H06, H08 | Percurso no navegador e teclado |
| FE02 | HTML semântico, títulos, regiões, listas, idioma e título de página; textos alternativos | A05, A07, A08, A09, A35, A37 | DOM renderizado; leitura com NVDA ao final |
| FE03 | Elementos nativos para ações e navegação, nomes, estados, texto visível e nome acessível; HTML produzido por LinkContainer | A16, A17, A38, A40; H04 | DOM e acionamento por teclado; NVDA ao final |
| FE04 | Caminhos de foco, entrada/saída de confirmação, retorno após navegação e mecanismo de acesso ao conteúdo | A01, A12, A19; H03 | Foco efetivo e operação por teclado |
| FE05 | Campos obrigatórios/opcionais, rótulos associados, instruções, tipos, grupos e menus dependentes | CT01, CT04; A22, A23; H02, H06, H10 | Preenchimento, mudança de segmento; NVDA ao final |
| FE06 | Normalização/apresentação e serialização; telefone canônico ou null; capacidade zero; status inicial somente no frontend; escola imutável da turma | CT01–CT04; R02–R04, R12 | Payload e dados retornados; persistência |
| FE07 | Validação antes de salvar, erros por campo, duplicidade, preservação dos campos após falha; correção e reenvio | R10; A24, A25; H05, H09 | Erro real no navegador e recuperação |
| FE08 | Confirmação de exclusão com registro identificado, cancelamento sem mutação e orientação após bloqueio por turmas | R07–R11; A25; H03, H05, H09 | Cancelar, bloquear com ativas/encerradas e excluir sem vínculos |
| FE09 | Filtros Ativas/Todas/Encerradas, padrão inicial e estado selecionado; capacidade independente do filtro | R04–R06; A16, A29, A40; H01, H04, H07 | Alternar filtros e conferir total |
| FE10 | Estados distintos de carregamento textual, vazio, erro e sucesso; mecanismo de mensagens de estado e recuperação de falha da API | A39; H01, H09 | Observar execução; anúncio no NVDA ao final |
| FE11 | CSS e estrutura que possam impedir ampliação, reorganização, orientação e leitura; não depender apenas de cor | A28–A31, A33, A37 | Texto 200%, largura 320 px CSS e contraste medido |
| FE12 | Coerência dos textos, termos do domínio, ações equivalentes, instruções locais e ausência de informações removidas do escopo | R13; H01–H10 conforme aspecto | Inspeção da interface; compreensão com usuários ao final |
| FE13 | Distribuição de responsabilidades, duplicação relevante, dependências e separação de chamadas à API; indicar impacto concreto | AR01 quando pertinente; escopo | Regressões nos consumidores afetados |
| FE14 | Testes existentes: comportamento coberto, asserções, dados, erros e lacunas nas alterações | Requisitos afetados | Execução real com comando e saída; não inferir cobertura por quantidade |

## 3. Limites da interpretação

Uma associação label/controle no código pode sustentar uma conclusão sobre implementação; não comprova a experiência com leitor de tela. Um mecanismo de mensagem de estado pode estar presente e não produzir o anúncio esperado. Contraste, dimensões renderizadas, sequência efetiva de foco e compreensão das mensagens precisam de métodos próprios.

Se o backend não estiver disponível, informar quais contratos foram apenas assumidos e quais foram conferidos. Não atribuir ao frontend uma proteção de integridade que depende da API/banco. Caso um mesmo problema atravesse os dois repositórios, relacioná-lo ao mesmo identificador no registro JSON de achados.

## 4. Arquivos de saída

Produzir dois arquivos em avaliacao/rodadas/[REV-XX]:

1. relatorio-frontend.md: cabeçalho, objetivo, inventário, cobertura, testes executados e verificações pendentes, conforme o documento 04. A cobertura pode citar IDs de achados, sem reproduzir suas descrições.
2. achados-frontend.json: todos os apontamentos da revisão no contrato JSON do documento 04, com campos nomeados e indentação de dois espaços. Não inserir achados em tabelas, listas narrativas ou blocos JSON dentro do relatório Markdown.

Para novos achados, usar [REV-XX]-FE-A001, A002 etc. O ID permanece estável nas reavaliações. Consultar avaliacao/achados.json nas rodadas em que ele já contiver registros, reutilizando IDs pertinentes. Se não houver achados, entregar o arquivo com achados: [] e o relatório com cobertura e limites. Não criar objeto fictício para representar ausência de problemas.

O JSON produzido pelo revisor registra classificação e evidência, mas deixa confirmacao_autora como pendente e situacao como aguardando_confirmacao. Somente registrar uma confirmação humana quando ela efetivamente ocorrer. Guardar sugestões rejeitadas e motivos no acompanhamento JSON; não excluí-las para melhorar o resultado aparente.

Reavaliações são arquivos novos, com sufixo -r02, -r03 etc., referenciando a nova versão de código. Não sobrescrever os produtos de uma execução já encerrada. O acompanhamento consolidado fica em avaliacao/achados.json, no mesmo contrato, conforme o documento 04.

## 5. Pedido reutilizável

> Revise o frontend na rodada [REV-XX], execução [r01], versão [commit e alterações locais]. Leia os documentos 01, 02 e 04. O objetivo é [objetivo] e o alcance é [funcionalidades/componentes/requisitos]. Faça o inventário do escopo e registre o que foi efetivamente examinado. Não altere código. [Indicar testes incluídos e ambiente isolado, ou apenas inspeção.] Produza relatorio-frontend.md com cabeçalho, inventário, cobertura, testes e pendências, e achados-frontend.json separado com todos os apontamentos no contrato do documento 04. Não inclua descrições de achados no Markdown. Para a REV-01, comece com registro vazio; nas seguintes, consulte avaliacao/achados.json para reutilizar IDs. Não invente resultados de execução nem confirmação humana. Salve em [pasta da rodada].
