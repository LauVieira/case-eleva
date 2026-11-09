const fs = require('fs');

async function verify () {
  const [port, output] = process.argv.slice(2);
  if (!port || !output || fs.existsSync(output)) throw new Error('Informe porta e JSON novo.');
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
  let schoolDeleteMode = 'conflict';
  const pending = new Map();
  const writes = [];
  const results = [];
  const school = {
    id: 6, sectorId: 10, name: 'escola exemplo', address: 'Rua Fictícia, 10',
    headteacher: null, phone: null, totalCapacity: 0,
    createdAt: '2026-11-08T12:00:00.000Z', updatedAt: '2026-11-08T12:00:00.000Z',
  };
  const sectors = [{ id: 10, name: 'Setor Azul', code: 'SA', color: '#25117d' }];
  const classData = {
    id: 7, schoolId: 6, name: 'turma a', grade: '1º ano', segment: 'Ensino Fundamental',
    shift: 'Matutino', status: 'current', maxOccupancy: 20,
    createdAt: '2026-11-08T12:00:00.000Z', updatedAt: '2026-11-08T12:00:00.000Z',
    school: { id: 6, name: 'escola exemplo' },
  };
  const cors = [
    { name: 'Content-Type', value: 'application/json; charset=utf-8' },
    { name: 'Access-Control-Allow-Origin', value: 'http://127.0.0.1:9000' },
    { name: 'Access-Control-Allow-Headers', value: 'content-type,accept' },
    { name: 'Access-Control-Allow-Methods', value: 'GET,DELETE,OPTIONS' },
  ];

  const send = (method, params = {}, session = sessionId) => new Promise((resolve, reject) => {
    const id = sequence + 1;
    sequence = id;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Tempo esgotado: ${method}`));
    }, 12000);
    pending.set(id, { resolve, reject, timer, method });
    const payload = { id, method, params };
    if (session) payload.sessionId = session;
    ws.send(JSON.stringify(payload));
  });
  const fulfill = (requestId, status, data) => send('Fetch.fulfillRequest', {
    requestId,
    responseCode: status,
    responseHeaders: cors,
    body: Buffer.from(data === undefined ? '' : JSON.stringify(data)).toString('base64'),
  });

  async function paused ({ requestId, request }) {
    const url = new URL(request.url);
    if (url.origin === 'http://localhost:3000' && request.method === 'OPTIONS') {
      return fulfill(requestId, 204, undefined);
    }
    if (request.method === 'GET' && url.origin === 'http://localhost:3000') {
      if (url.pathname === `/schools/${school.id}`) return fulfill(requestId, 200, school);
      if (url.pathname === '/sectors') return fulfill(requestId, 200, sectors);
      if (url.pathname === `/classes/${classData.id}`) return fulfill(requestId, 200, classData);
      return fulfill(requestId, 404, { message: 'Nao encontrado' });
    }
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return send('Fetch.continueRequest', { requestId });
    if (request.method === 'DELETE' && url.origin === 'http://localhost:3000') {
      writes.push({ method: request.method, path: url.pathname, scenario: schoolDeleteMode });
      if (url.pathname === `/schools/${school.id}` && schoolDeleteMode === 'conflict') {
        return fulfill(requestId, 409, { message: 'turmas vinculadas' });
      }
      return fulfill(requestId, 204, undefined);
    }
    await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    throw new Error(`Escrita inesperada bloqueada: ${request.method} ${request.url}`);
  }

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(item.timer);
      if (message.error) item.reject(new Error(`${item.method}: ${JSON.stringify(message.error)}`));
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
    const point = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return null; element.scrollIntoView({block:'center'}); const r = element.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
    if (!point) throw new Error(`Elemento ausente: ${selector}`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, x: point.x, y: point.y });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, x: point.x, y: point.y });
  }
  async function tab () {
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9,
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9,
    });
  }
  async function focusSnapshot () {
    return evaluate(`(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const floater = document.querySelector('.floating-focus');
      const fr = floater ? floater.getBoundingClientRect() : null;
      const overlap = !!(fr && fr.width > 0 && fr.height > 0 && !(fr.right < rect.left || fr.left > rect.right || fr.bottom < rect.top || fr.top > rect.bottom));
      return {
        tag: el.tagName,
        texto: (el.innerText || el.textContent || '').trim().slice(0, 80),
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
        boxShadow: cs.boxShadow === 'none' ? 'none' : 'presente',
        rootEnabled: document.querySelector('#root').classList.contains('floating-focus-enabled'),
        bodyEnabled: document.body.classList.contains('floating-focus-enabled'),
        floaterClass: floater ? String(floater.className) : '',
        floaterOverlap: overlap,
      };
    })()`);
  }
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const pass = (caso, detail = {}) => results.push({ caso, resultado: 'observado_antes_da_correcao', ...detail });
  const semContorno = (foco) => foco.outlineStyle === 'none' || foco.outlineWidth === '0px';

  try {
    const discovered = await send('Target.getTargets', {}, null);
    const page = discovered.targetInfos.find((target) => target.type === 'page');
    if (!page) throw new Error('Pagina do Chrome nao encontrada.');
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

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/escola/6' });
    await waitFor("Array.from(document.querySelectorAll('button')).some((button) => button.textContent.includes('Excluir escola'))");
    await click('button.list-group-item');
    await waitFor("document.querySelector('#delete-school-title')");
    await tab();
    const escolaBotao = await focusSnapshot();
    assert(escolaBotao.texto.includes('Excluir escola') && semContorno(escolaBotao) && !escolaBotao.floaterOverlap, 'O botao de excluir escola ja tinha o indicador do projeto.');
    pass('escola_botao_excluir_sem_contorno_do_projeto', { foco: escolaBotao });

    await click('button.btn-danger');
    await waitFor("document.querySelector('#delete-school-description') && document.body.textContent.includes('Ver turmas da escola')");
    await tab();
    const escolaLink = await focusSnapshot();
    assert(escolaLink.tag === 'A' && escolaLink.texto.includes('Ver turmas') && semContorno(escolaLink) && !escolaLink.floaterOverlap, 'O link de recuperacao ja tinha o indicador do projeto.');
    pass('escola_link_409_sem_contorno_do_projeto', { foco: escolaLink, escritas: writes.length });

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/turma/7' });
    await waitFor("Array.from(document.querySelectorAll('button')).some((button) => button.textContent.includes('Excluir turma'))");
    await click('button.btn-danger');
    await waitFor("document.querySelector('#delete-class-title')");
    await tab();
    const turmaBotao = await focusSnapshot();
    assert(turmaBotao.texto.includes('Excluir turma') && semContorno(turmaBotao) && !turmaBotao.floaterOverlap, 'O botao de excluir turma ja tinha o indicador do projeto.');
    pass('turma_botao_excluir_sem_contorno_do_projeto', { foco: turmaBotao });

    fs.writeFileSync(output, JSON.stringify({
      navegador: version.Browser,
      gravacoesReais: 0,
      casos: results,
      escritas: writes,
    }, null, 2));
  } finally {
    ws.close();
  }
}

verify().catch((error) => {
  console.error(error);
  process.exit(1);
});
