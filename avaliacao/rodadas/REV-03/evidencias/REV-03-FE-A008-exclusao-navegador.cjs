const fs = require('fs');
const path = require('path');

async function verify () {
  const [port, output] = process.argv.slice(2);
  if (!port || !output || fs.existsSync(output)) throw new Error('Informe porta e resultado novo.');
  const live = await (await fetch('http://localhost:3000/classes/8')).json();
  const shownName = String(live.name).toLocaleUpperCase('pt-BR');
  const listPath = `/escola/${live.schoolId}/classes`;
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
  let mode = 'ok';
  const pending = new Map();
  const writes = [];
  const reads = [];
  const results = [];

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
    if (request.method === 'GET' && url.origin === 'http://localhost:3000') reads.push(url.pathname);
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return send('Fetch.continueRequest', { requestId });
    if (request.method !== 'DELETE' || url.pathname !== '/classes/8') {
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error(`Escrita inesperada bloqueada: ${request.method} ${request.url}`);
    }
    writes.push({ path: url.pathname, scenario: mode });
    if (mode === 'missing') {
      return send('Fetch.fulfillRequest', {
        requestId, responseCode: 404,
        responseHeaders: [
          { name: 'Content-Type', value: 'application/json; charset=utf-8' },
          { name: 'Access-Control-Allow-Origin', value: 'http://127.0.0.1:9000' },
        ],
        body: Buffer.from(JSON.stringify({ message: 'Turma não encontrada' })).toString('base64'),
      });
    }
    if (mode === 'serverError') {
      return send('Fetch.fulfillRequest', {
        requestId, responseCode: 500,
        responseHeaders: [
          { name: 'Content-Type', value: 'application/json; charset=utf-8' },
          { name: 'Access-Control-Allow-Origin', value: 'http://127.0.0.1:9000' },
        ],
        body: Buffer.from(JSON.stringify({ message: 'Falha simulada.' })).toString('base64'),
      });
    }
    if (mode === 'networkError') return send('Fetch.failRequest', { requestId, errorReason: 'ConnectionFailed' });
    if (mode === 'slow') await new Promise((resolve) => setTimeout(resolve, 800));
    return send('Fetch.fulfillRequest', {
      requestId, responseCode: 204,
      responseHeaders: [{ name: 'Access-Control-Allow-Origin', value: 'http://127.0.0.1:9000' }],
      body: '',
    });
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
  async function openDetail (nextMode = 'ok') {
    mode = nextMode;
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/turma/8' });
    await waitFor("Array.from(document.querySelectorAll('button')).some((button) => button.textContent.includes('Excluir turma'))");
  }
  async function openDialog () {
    await click("button.btn-danger");
    await waitFor(`document.querySelector('#delete-class-title') && document.body.textContent.includes(${JSON.stringify(shownName)})`);
  }
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const pass = (caso, detail = {}) => results.push({ caso, resultado: 'passou_com_delete_simulado', ...detail });

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

    await openDetail();
    await openDialog();
    assert(writes.length === 0, 'Abrir a confirmacao enviou DELETE.');
    assert(await evaluate("document.activeElement.textContent.includes('Cancelar')"), 'Foco inicial nao foi Cancelar.');
    pass('confirmacao_identifica_a_turma_sem_envio', { nome: shownName });

    await click('.modal-footer button.btn-secondary');
    await waitFor("!document.querySelector('#delete-class-title')");
    assert(writes.length === 0, 'Cancelar enviou DELETE.');
    pass('cancelar_sem_mutacao');

    await openDialog();
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await waitFor("!document.querySelector('#delete-class-title')");
    assert(writes.length === 0, 'Escape enviou DELETE.');
    pass('escape_sem_mutacao');

    await openDialog();
    const beforeList = reads.filter((item) => item === `/schools/${live.schoolId}/classes`).length;
    await click('.modal-footer button.btn-danger');
    await waitFor(`location.pathname === ${JSON.stringify(listPath)} && document.body.textContent.includes('excluída com sucesso') && document.body.textContent.includes(${JSON.stringify(shownName)})`);
    assert(writes.length === 1 && writes[0].path === '/classes/8', 'DELETE simulado divergente.');
    await waitFor(`document.querySelectorAll('[href="/turma/8"]').length >= 0`);
    assert(reads.filter((item) => item === `/schools/${live.schoolId}/classes`).length > beforeList, 'A listagem nao foi consultada de novo.');
    pass('exclusao_simulada_retorna_a_listagem', { destino: listPath });

    await openDetail('serverError');
    await openDialog();
    await click('.modal-footer button.btn-danger');
    await waitFor("document.querySelector('[role=\"alert\"]').textContent.includes('Não foi possível excluir a turma') && location.pathname === '/turma/8'");
    mode = 'ok';
    await click('.modal-footer button.btn-danger');
    await waitFor(`location.pathname === ${JSON.stringify(listPath)} && document.body.textContent.includes('excluída com sucesso')`);
    pass('falha_500_permite_nova_tentativa');

    await openDetail('missing');
    await openDialog();
    await click('.modal-footer button.btn-danger');
    await waitFor("document.body.textContent.includes('Esta turma não foi encontrada')");
    assert(await evaluate("document.querySelector('.modal-footer button.btn-danger').disabled && location.pathname === '/turma/8'"), 'Confirmacao 404 continuou habilitada ou a tela saiu do detalhe.');
    pass('turma_ausente_404_sem_sucesso');

    await openDetail('networkError');
    await openDialog();
    await click('.modal-footer button.btn-danger');
    await waitFor("document.body.textContent.includes('Não foi possível confirmar a exclusão')");
    await click('.modal-footer button.btn-secondary');
    await waitFor("!document.querySelector('#delete-class-title')");
    pass('falha_de_rede_permite_cancelar');

    await openDetail();
    await openDialog();
    mode = 'slow';
    const beforeDouble = writes.length;
    await click('.modal-footer button.btn-danger');
    await waitFor("document.querySelector('.modal-footer button.btn-danger').disabled");
    await click('.modal-footer button.btn-danger');
    await waitFor(`location.pathname === ${JSON.stringify(listPath)}`);
    assert(writes.length === beforeDouble + 1, 'DELETE duplicado observado.');
    pass('envio_unico');

    await openDetail();
    await openDialog();
    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    const layout = await evaluate('({ largura: innerWidth, conteudo: document.querySelector(".modal-dialog").scrollWidth })');
    assert(layout.conteudo <= 320 + 1, 'Dialogo transbordou a 320px.');
    pass('dialogo_320px', layout);

    const record = {
      data: '2026-11-08',
      metodo: 'Chrome/CDP; GET real; DELETE interceptado e simulado. Nenhuma exclusao real.',
      gravacoes_reais: false,
      turma: { id: live.id, name: live.name, schoolId: live.schoolId },
      resultados: results,
      deletes_simulados: writes,
      limites: 'A listagem consultada depois do 204 simulado ainda pode mostrar a turma, porque ela nao foi apagada no banco. Sem teclado completo alem de Escape, contraste, texto 200% ou NVDA.',
      resultado: 'passou_nos_casos_verificados',
    };
    fs.writeFileSync(output, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({ casos: results.length, deletes: writes.length, gravacoes_reais: false }));
  } catch (error) {
    let failPath = output.replace(/\.json$/, '-falha.json');
    if (fs.existsSync(failPath)) failPath = output.replace(/\.json$/, `-falha-${Date.now()}.json`);
    fs.writeFileSync(failPath, `${JSON.stringify({ erro: String(error.stack || error), resultados: results, deletes: writes }, null, 2)}\n`, 'utf8');
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
