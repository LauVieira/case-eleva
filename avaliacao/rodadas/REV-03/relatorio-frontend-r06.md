# Reavaliação do frontend — REV-03 / r06

- Data: 08/11/2026; responsável: Codex, por solicitação da autora.
- Objetivo: implementar e verificar o recorte de REV-03-FE-A004, preservando o estado anterior.
- Frontend: case-eleva, branch main, commit base `44e57e7b3bf58796ab9b76ed664002754d14a489` mais alterações locais.
- Backend: case-eleva-api, `a023d1eea2093d5511c22cfc444e11dfef704e4f`, inspecionado sem alterações de código.
- Alterações e evidências: [patch](evidencias/REV-03-FE-A004-r06-correcao.patch) e [novo componente](evidencias/REV-03-FE-A004-r06-SchoolDeleteModal.js). Alteração preexistente do package-lock.json preservada.
- Instrumentos: 01_Regras_e_Requisitos.md, 02_Review_Frontend.md, 04_Registro_e_Acompanhamento.md e 06_Modelo_Achados.json disponíveis no repositório.
- Ambiente: Windows, Node 24.16.0, Webpack 5.22.0, Chrome 156.0.8078.49 sem interface; dados fictícios e API interceptada.
- Registro: [achados-frontend-r06.json](achados-frontend-r06.json); produtos r01–r05 preservados. Acompanhamento central em case-eleva-api/avaliacao/achados.json.

## Inventário e cobertura

| Item | Local | Método e alcance | Cobertura | Referência |
|---|---|---|---|---|
| Ação e confirmação de escola | SchoolCard, SchoolDeleteModal | Código, DOM, acionamento e teclado pontual; R10, R13, FE03/04/08 | Examinado no recorte | REV-03-FE-A004 |
| Cancelamento e requisição de exclusão | SchoolDeleteModal | Código e navegador com DELETE interceptado; zero envios ao cancelar; FE08 | Examinado no recorte | REV-03-FE-A004 |
| Bloqueio, falha e recuperação | SchoolDeleteModal | Respostas 409/404/500 e conexão simuladas; R07/R09, FE08/10 | Parcialmente examinado: comportamento real da API pendente | REV-03-FE-A004 |
| Carregamento do detalhe e retorno à listagem | SchoolPage, SectorPage | Código e navegador; foco no sucesso e nova consulta; FE01/10 | Examinado no recorte afetado | REV-03-FE-A004; não encerra A012 |
| API e integridade | Controller, service, repositories | Inspeção de fontes e contrato; R07/R08 | Parcialmente examinado: sem DELETE real ou banco isolado | REV-03-FE-A004; relação com REV-01-BE-A006 |
| Largura e acessibilidade | Diálogo e mensagens | 320px, sem transbordamento observado; foco e teclas dos passos registrados | Parcialmente examinado | Contraste, ampliação, teclado completo, NVDA/usuários pendentes |
| Localização e remoção de turmas | ClassesPage | Inspeção dos destinos; implementação fora desta intervenção | Fora da intervenção, com dependências pendentes | REV-03-FE-A008 e REV-03-FE-A009 |
| Demais páginas, cadastro e edição | Demais fontes | Sem alterações neste recorte | Fora da intervenção | Mantêm a cobertura anterior |

Examinado no recorte não significa conformidade integral. Esta intervenção não encerra outros achados.

## Verificações executadas

Compilação final passou com código de saída 0. Foram executados 15 casos por interação no Chrome com respostas fictícias da API; todos passaram na execução final. Sete DELETEs foram interceptados antes do servidor e nenhuma escola real foi excluída. Cancelamento e foco foram conferidos pelos passos de teclado e pelo DOM; as imagens não foram usadas como comprovação.

O [procedimento e log](evidencias/REV-03-FE-A004-r06-verificacao.txt) registram comandos, dados, esperado/observado, tentativas iniciais incompletas e ajustes. [Resultados do navegador](evidencias/REV-03-FE-A004-r06-navegador.json) e [compilação](evidencias/REV-03-FE-A004-r06-compilacao.txt). Não foi executada suíte automatizada do projeto, npm test ou lint. Não foram gerados prints.

## Limitações e pendências

São necessários banco isolado e integração real para conferir exclusão sem vínculos, bloqueios com turmas ativas e encerradas e persistência/integridade. Os filtros e a exclusão de turma continuam nas pendências A009/A008; isso limita completar o desbloqueio pela interface.

Contraste medido, ampliação de texto, percurso completo de teclado, NVDA e sessões com usuários permanecem pendentes. A confirmação e o fechamento pela autora também estão pendentes. A004 fica aguardando_reavaliacao, com resultado global inconclusivo apesar dos casos simulados aprovados.
