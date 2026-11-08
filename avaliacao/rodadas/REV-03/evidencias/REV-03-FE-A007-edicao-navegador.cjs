const fs = require('fs');
const path = require('path');

async function verify () {
  const [port, output] = process.argv.slice(2);
  if (!port || !output || fs.existsSync(output)) throw new Error('Informe porta e resultado novo.');
  const live = await (await fetch('http://localhost:3000/classes/8')).json();
  const shownName = String(live.name).toLocaleUpperCase('pt-BR');
  const createdLabel = new Date(live.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const updatedLabel = new Date('2026-11-08T16:40:00.000Z').toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
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
  const fulfill = (requestId, status, data) => send('Fetch.fulfillRequest', {
    requestId,
    responseCode: status,
    responseHeaders: [
      { name: 'Content-Type', value: 'application/json; charset=utf-8' },
      { name: 'Access-Control-Allow-Origin', value: 'http://127.0.0.1:9000' },
    ],
    body: Buffer.from(JSON.stringify(data)).toString('base64'),
  });

  async function paused ({ requestId, request }) {
    const url = new URL(request.url);
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return send('Fetch.continueRequest', { requestId });
    }
    if (request.method !== 'PATCH' || url.pathname !== '/classes/8') {
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error(`Escrita inesperada bloqueada: ${request.method} ${request.url}`);
    }
    const data = JSON.parse(request.postData || '{}');
    if (Object.prototype.hasOwnProperty.call(data, 'schoolId') || Object.prototype.hasOwnProperty.call(data, 'createdAt') || Object.prototype.hasOwnProperty.call(data, 'updatedAt')) {
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error(`Campo nao editavel no PATCH: ${JSON.stringify(data)}`);
    }
    writes.push({ path: url.pathname, payload: data, scenario: mode });
    if (mode === 'conflict') {
      return fulfill(requestId, 409, { message: 'Já existe uma turma ativa com este nome nesta escola. Informe outro nome.' });
    }
    if (mode === 'serverError') return fulfill(requestId, 500, { message: 'Falha simulada.' });
    if (mode === 'missing') return fulfill(requestId, 404, { message: 'Turma não encontrada' });
    if (mode === 'slow') await new Promise((resolve) => setTimeout(resolve, 800));
    return fulfill(requestId, 200, {
      ...live,
      ...data,
      createdAt: live.createdAt,
      updatedAt: '2026-11-08T16:40:00.000Z',
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
  async function fill (selector, value) {
    await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); element.focus(); element.select(); })()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
    if (value) await send('Input.insertText', { text: value });
  }
  async function choose (selector, value) {
    await evaluate(`(() => { const field = document.querySelector(${JSON.stringify(selector)}); field.value = ${JSON.stringify(value)}; field.dispatchEvent(new Event('change', { bubbles: true })); return field.value; })()`);
  }
  async function openEdit (nextMode = 'ok') {
    mode = nextMode;
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/turma/8/editar' });
    await waitFor(`document.querySelector('#class-name') && document.querySelector('#class-name').value === ${JSON.stringify(shownName)} && document.querySelector('#class-status').value === ${JSON.stringify(live.status)}`);
  }
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const pass = (caso, detail = {}) => results.push({ caso, resultado: 'passou_com_patch_simulado', ...detail });

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

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/turma/8' });
    await waitFor("document.querySelector('a[href=\"/turma/8/editar\"]')");
    await click('a[href="/turma/8/editar"]');
    await waitFor(`document.querySelector('#class-name').value === ${JSON.stringify(shownName)}`);
    const fields = await evaluate(`(() => ({
      nomes: Array.from(document.querySelectorAll('form [name]')).map((field) => field.name),
      status: document.querySelector('#class-status').value,
      ocupacao: document.querySelector('#class-occupancy').value,
      escola: document.body.textContent.includes('não pode ser alterada'),
      escolaCampo: document.querySelector('[name="schoolId"]') !== null,
    }))()`);
    assert(JSON.stringify(fields.nomes) === JSON.stringify(['name', 'segment', 'grade', 'shift', 'status', 'maxOccupancy']), 'Campos editaveis divergentes.');
    assert(fields.status === live.status && fields.ocupacao === String(live.maxOccupancy), 'Preenchimento divergente.');
    assert(fields.escola && !fields.escolaCampo, 'Escola editavel ou ausente.');
    assert(writes.length === 0, 'Abrir a edicao enviou PATCH.');
    pass('acesso_pelo_detalhe_escola_informativa', { campos: fields.nomes });

    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('Nenhuma alteração para salvar.')");
    assert(writes.length === 0, 'PATCH sem alteracao.');
    await click('form button[type="button"]');
    await waitFor("location.pathname === '/turma/8' && document.querySelector('a[href=\"/turma/8/editar\"]')");
    assert(writes.length === 0, 'Cancelar provocou PATCH.');
    pass('sem_alteracao_e_cancelamento_sem_mutacao');

    await openEdit();
    await fill('#class-occupancy', String(live.maxOccupancy + 1));
    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('Turma atualizada com sucesso.')");
    assert(JSON.stringify(writes.at(-1).payload) === JSON.stringify({ maxOccupancy: live.maxOccupancy + 1 }), 'PATCH nao foi parcial.');
    pass('edicao_parcial_de_capacidade', { payload: writes.at(-1).payload });

    await openEdit('conflict');
    await fill('#class-name', '  OUTRA   TURMA  ');
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('#class-name-error')?.textContent.includes('Já existe')");
    assert(await evaluate("document.querySelector('#class-name').value === '  OUTRA   TURMA  '"), 'Nome perdido apos 409.');
    assert(JSON.stringify(writes.at(-1).payload) === JSON.stringify({ name: 'outra turma' }), 'Nome nao normalizado.');
    pass('conflito_409_preserva_nome', { payload: writes.at(-1).payload });

    await openEdit();
    await choose('#class-status', live.status === 'current' ? 'completed' : 'current');
    await click('form button[type="submit"]');
    await waitFor(`document.body.textContent.includes('Criada em ${createdLabel}') && document.body.textContent.includes('Atualizada em ${updatedLabel}')`);
    const statusPayload = writes.at(-1).payload;
    assert(Object.keys(statusPayload).join(',') === 'status', 'Situacao nao foi o unico campo.');
    assert(statusPayload.status === (live.status === 'current' ? 'completed' : 'current'), 'Situacao enviada divergente.');
    pass('situacao_editavel_e_datas_da_resposta', { payload: statusPayload, criada: createdLabel, atualizada: updatedLabel });

    await openEdit();
    const beforeInvalid = writes.length;
    await choose('#class-segment', 'Educação Infantil — Creche');
    await waitFor("document.querySelector('#class-grade').value === ''");
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('#class-grade-error')");
    assert(writes.length === beforeInvalid, 'Combinacao invalida chegou ao PATCH.');
    pass('segmento_limpa_grupo_incompativel_sem_envio');

    await openEdit('serverError');
    await choose('#class-shift', live.shift === 'Matutino' ? 'Vespertino' : 'Matutino');
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('[role=\"alert\"]').textContent.includes('Não foi possível confirmar')");
    assert(await evaluate(`document.querySelector('#class-shift').value === ${JSON.stringify(live.shift === 'Matutino' ? 'Vespertino' : 'Matutino')}`), 'Turno perdido apos falha.');
    mode = 'ok';
    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('Turma atualizada com sucesso.')");
    pass('falha_500_preserva_e_permite_reenvio');

    await openEdit();
    await fill('#class-occupancy', String(live.maxOccupancy + 2));
    mode = 'slow';
    const beforeDouble = writes.length;
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('form button[type=\"submit\"]').disabled");
    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('Turma atualizada com sucesso.')");
    assert(writes.length === beforeDouble + 1, 'Envio duplicado observado.');
    pass('envio_unico');

    await openEdit();
    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    const layout = await evaluate('({ largura: innerWidth, conteudo: document.documentElement.scrollWidth })');
    assert(layout.conteudo <= layout.largura + 1, 'Transbordamento a 320px.');
    pass('largura_320px', layout);

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/turma/abc/editar' });
    await waitFor("document.body.textContent.includes('Turma não encontrada.') && !document.querySelector('form')");
    pass('identificador_invalido');

    const record = {
      data: '2026-11-08',
      metodo: 'Chrome/CDP; GET real da turma 8; PATCH interceptado e simulado. Nenhuma gravacao real.',
      gravacoes_reais: false,
      turma_lida: { id: live.id, name: live.name, status: live.status, maxOccupancy: live.maxOccupancy, createdAt: live.createdAt },
      resultados: results,
      patches_simulados: writes,
      limites: 'Os PATCH nao chegaram ao banco. A igualdade de createdAt e a mudanca de updatedAt foram observadas na resposta simulada, nao numa edicao persistida. Sem teclado completo, contraste, texto 200% ou NVDA.',
      resultado: 'passou_nos_casos_verificados',
    };
    fs.writeFileSync(output, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({ casos: results.length, patches: writes.length, gravacoes_reais: false }));
  } catch (error) {
    let failPath = output.replace(/\.json$/, '-falha.json');
    if (fs.existsSync(failPath)) failPath = output.replace(/\.json$/, `-falha-${Date.now()}.json`);
    fs.writeFileSync(failPath, `${JSON.stringify({ erro: String(error.stack || error), resultados: results, patches: writes }, null, 2)}\n`, 'utf8');
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
