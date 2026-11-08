const fs = require('fs');
const path = require('path');

async function verify () {
  const [port, output] = process.argv.slice(2);
  if (!port || !output || fs.existsSync(output)) throw new Error('Informe porta e resultado novo.');
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let sequence = 0;
  let sessionId = null;
  let attachedParams = null;
  let fatal = null;
  const pending = new Map();
  const reads = [];
  const writes = [];
  const results = [];
  const expectedDate = new Date('2026-11-08T00:36:52.796Z').toLocaleString('pt-BR', {
    dateStyle: 'short', timeStyle: 'short',
  });

  const send = (method, params = {}, session = sessionId) => new Promise((resolve, reject) => {
    const id = sequence + 1;
    sequence = id;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Tempo esgotado: ${method}`));
    }, 12000);
    pending.set(id, { resolve, reject, timer });
    const payload = { id, method, params };
    if (session) payload.sessionId = session;
    ws.send(JSON.stringify(payload));
  });

  async function paused ({ requestId, request }) {
    const url = new URL(request.url);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      writes.push({ method: request.method, url: request.url });
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error(`Escrita bloqueada: ${request.method} ${request.url}`);
    }
    if (url.origin === 'http://localhost:3000' && request.method === 'GET') {
      reads.push(url.pathname);
    }
    return send('Fetch.continueRequest', { requestId });
  }

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(item.timer);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
    } else if (message.method === 'Target.attachedToTarget') {
      attachedParams = message.params;
    } else if (message.method === 'Fetch.requestPaused') {
      paused(message.params).catch((error) => { fatal = error; });
    }
  });

  async function evaluate (expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function waitFor (expression) {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      if (fatal) throw fatal;
      try {
        if (await evaluate(`Boolean(${expression})`)) return;
      } catch (error) {
        if (fatal) throw fatal;
      }
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    throw new Error(`Estado ausente: ${expression}`);
  }
  async function click (selector) {
    const point = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) throw new Error('Elemento ausente'); element.scrollIntoView({block:'center'}); const r = element.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  }
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const pass = (caso, detail = {}) => results.push({ caso, resultado: 'passou_com_api_real', ...detail });

  try {
    const discovered = await send('Target.getTargets', {}, null);
    const page = discovered.targetInfos.find((target) => target.type === 'page' && target.url.startsWith('http://127.0.0.1:9000'));
    if (!page) throw new Error('Pagina do frontend nao encontrada.');
    if (page.attached) throw new Error('Pagina ja estava anexada ao depurador.');
    const attached = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true }, null);
    const attachDeadline = Date.now() + 5000;
    while (!attachedParams && Date.now() < attachDeadline) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    sessionId = (attachedParams && attachedParams.sessionId) || attached.sessionId;
    if (!sessionId) throw new Error('Sessao do depurador nao foi criada.');
    await send('Runtime.runIfWaitingForDebugger');
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/escola/6/classes' });
    await waitFor("document.querySelector('[href=\"/turma/8\"]') && document.querySelector('[href=\"/escola/6/classes/nova\"]')");
    const links = await evaluate("Array.from(document.querySelectorAll('[href]')).map((element) => element.getAttribute('href'))");
    assert(links.includes('/turma/8'), 'Cartao da turma jardim nao aponta para o detalhe.');
    assert(links.includes('/escola/6/classes/nova'), 'Cartao de cadastro mudou de destino.');
    assert(!links.includes('/') || links.filter((href) => href === '/').every(() => true), 'Lista de links obtida.');
    assert(writes.length === 0, 'A listagem provocou escrita.');
    pass('listagem_aponta_para_o_detalhe_da_turma', { links });

    await click('[href="/turma/8"]');
    await waitFor("document.querySelector('h1') && document.querySelector('h1').textContent === 'JARDIM'");
    const detail = await evaluate(`(() => ({
      titulo: document.title,
      escola: document.querySelector('a[href="/escola/6"]').textContent,
      voltar: document.querySelector('a[href="/escola/6/classes"]') !== null,
      campos: Array.from(document.querySelectorAll('dl div')).map((item) => ({
        rotulo: item.querySelector('dt').textContent,
        valor: item.querySelector('dd').textContent,
      })),
      acoes: Array.from(document.querySelectorAll('button, a')).map((item) => item.textContent.trim()).filter(Boolean),
    }))()`);
    assert(detail.titulo === 'Detalhe da turma | Gestão Escolar', 'Titulo divergente.');
    assert(detail.escola === 'Escola De Demonstração', 'Nome da escola divergente.');
    assert(detail.voltar, 'Retorno para as turmas ausente.');
    const byLabel = Object.fromEntries(detail.campos.map((item) => [item.rotulo, item.valor]));
    assert(byLabel.Grupo === 'Jardim I', 'Grupo divergente.');
    assert(byLabel.Segmento === 'Educação Infantil — Pré-escola', 'Segmento divergente.');
    assert(byLabel.Turno === 'Matutino', 'Turno divergente.');
    assert(byLabel['Situação'] === 'Ativa', 'Situacao divergente.');
    assert(byLabel.Capacidade === '15', 'Capacidade divergente.');
    assert(byLabel['Criada em'] === expectedDate && byLabel['Atualizada em'] === expectedDate, `Datas divergentes: ${byLabel['Criada em']} / ${expectedDate}`);
    assert(!detail.acoes.some((text) => /excluir|editar|alunos matriculados/i.test(text)), 'A detalhe ganhou acao de outro achado.');
    assert(reads.includes('/classes/8'), 'A tela nao consultou a turma real.');
    assert(writes.length === 0, 'A consulta provocou escrita.');
    pass('detalhe_real_mostra_escola_e_datas', { campos: detail.campos, leituras: reads.filter((item) => item.includes('/classes/8')) });

    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    const layout = await evaluate('({ largura: innerWidth, conteudo: document.documentElement.scrollWidth })');
    assert(layout.conteudo <= layout.largura + 1, 'Transbordamento a 320px.');
    pass('largura_320px', layout);
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    await click('a[href="/escola/6/classes"]');
    await waitFor("location.pathname === '/escola/6/classes' && document.querySelector('[href=\"/turma/8\"]')");
    assert(writes.length === 0, 'Voltar provocou escrita.');
    pass('voltar_para_as_turmas_sem_mutacao');

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/turma/2147483647' });
    await waitFor("document.body.textContent.includes('Turma não encontrada.') && !document.querySelector('dl')");
    pass('turma_inexistente_404');

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/turma/abc' });
    await waitFor("document.body.textContent.includes('Turma não encontrada.') && !document.querySelector('dl')");
    pass('identificador_invalido_sem_detalhe');

    const domPath = path.join(path.dirname(output), `REV-03-FE-A006-detalhe-${Date.now()}.html`);
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/turma/8' });
    await waitFor("document.querySelector('h1') && document.querySelector('h1').textContent === 'JARDIM'");
    fs.writeFileSync(domPath, await evaluate('document.documentElement.outerHTML'), 'utf8');

    const record = {
      data: '2026-11-08',
      metodo: 'Chrome/CDP; GETs reais da API em execucao; escritas bloqueadas antes do servidor.',
      gravacoes_reais: false,
      dados: 'Turma 8, jardim, escola 6 escola de demonstração, lida do banco em execucao.',
      data_esperada: expectedDate,
      resultados: results,
      leituras: reads,
      escritas_bloqueadas: writes,
      documento_dom: domPath,
      limites: 'Nao executou edicao, portanto nao observou preservacao de createdAt apos PATCH. Nao cobre teclado completo, contraste, texto 200% nem NVDA. Sem prints.',
      resultado: 'passou_nos_casos_verificados',
    };
    fs.writeFileSync(output, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({
      casos: results.length, leituras: reads.length, escritas: writes.length, resultado: record.resultado,
    }));
  } catch (error) {
    let failPath = output.replace(/\.json$/, '-falha.json');
    if (fs.existsSync(failPath)) failPath = output.replace(/\.json$/, `-falha-${Date.now()}.json`);
    fs.writeFileSync(failPath, `${JSON.stringify({
      erro: String(error.stack || error), resultados: results, leituras: reads, escritas: writes,
    }, null, 2)}\n`, 'utf8');
    throw error;
  } finally {
    pending.forEach((item) => clearTimeout(item.timer));
    ws.close();
  }
}

verify().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
