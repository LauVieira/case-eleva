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
  const pending = new Map();
  const writes = [];
  const results = [];
  const cors = [
    { name: 'Content-Type', value: 'application/json; charset=utf-8' },
    { name: 'Access-Control-Allow-Origin', value: 'http://127.0.0.1:9000' },
    { name: 'Access-Control-Allow-Headers', value: '*' },
    { name: 'Access-Control-Allow-Methods', value: 'GET,DELETE,OPTIONS' },
  ];

  const send = (method, params = {}, session = sessionId) => new Promise((resolve, reject) => {
    const id = sequence + 1;
    sequence = id;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Tempo esgotado: ${method}`));
    }, 15000);
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
    if (url.origin !== 'http://localhost:3000') return send('Fetch.continueRequest', { requestId });
    if (request.method === 'OPTIONS') return fulfill(requestId, 204, undefined);
    if (request.method === 'GET' || request.method === 'HEAD') return send('Fetch.continueRequest', { requestId });
    if (request.method === 'DELETE') {
      writes.push({ method: request.method, path: url.pathname, destino: 'interceptado_204' });
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
    const deadline = Date.now() + 15000;
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
  async function click (selector, text) {
    const point = await evaluate(`(() => {
      const nodes = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
      const element = ${text ? `nodes.find((node) => (node.innerText || '').includes(${JSON.stringify(text)}))` : 'nodes[0]'};
      if (!element) return null;
      element.scrollIntoView({ block: 'center' });
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    if (!point) throw new Error(`Elemento ausente: ${selector} ${text || ''}`);
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
      const h1 = document.querySelector('main h1');
      const cs = getComputedStyle(el);
      const nav = document.querySelector('nav');
      const h1Rect = h1 ? h1.getBoundingClientRect() : null;
      return {
        url: location.pathname,
        tag: el.tagName,
        id: el.id || '',
        role: el.getAttribute('role') || '',
        tabindex: el.getAttribute('tabindex'),
        texto: (el.innerText || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 140),
        eCorpo: el === document.body,
        eH1: el.tagName === 'H1',
        h1: h1 ? (h1.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 140) : '',
        outlineWidth: cs.outlineWidth,
        h1Top: h1Rect ? Math.round(h1Rect.top) : null,
        navBottom: nav ? Math.round(nav.getBoundingClientRect().bottom) : null,
      };
    })()`);
  }
  async function settled (expression) {
    await waitFor(expression);
    let previous = '';
    let matches = 0;
    let latest = null;
    const deadline = Date.now() + 2500;
    while (Date.now() < deadline && matches < 3) {
      latest = await focusSnapshot();
      const key = `${latest.tag}|${latest.id}|${latest.texto}`;
      matches = key === previous ? matches + 1 : 0;
      previous = key;
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    return latest;
  }

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
    await send('Fetch.enable', {
      patterns: [{ urlPattern: 'http://localhost:3000/*', requestStage: 'Request' }],
    });
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/' });
    await waitFor("Array.from(document.querySelectorAll('a')).some((link) => link.getAttribute('href') === '/setor/1')");

    await click('a[href="/setor/1"]');
    const setor = await settled("document.querySelector('main h1') && document.querySelector('main h1').innerText.includes('Setor Azul') && document.querySelector('a[href=\"/escola/6\"]')");
    results.push({ caso: 'link_interno_setor', foco: setor });

    await click('a[href="/escola/6"]');
    const escola = await settled("Array.from(document.querySelectorAll('main h1')).some((heading) => heading.innerText.toLowerCase().includes('demonstração') || heading.innerText.toLowerCase().includes('demonstracao'))");
    results.push({ caso: 'link_interno_escola', foco: escola });

    await click('a[href="/escola/6/classes"]');
    const turmas = await settled("document.querySelector('main h1') && document.querySelector('main h1').innerText.trim() === 'Turmas' && Array.from(document.querySelectorAll('a')).some((link) => link.getAttribute('href') === '/turma/8')");
    results.push({ caso: 'link_interno_turmas', foco: turmas });

    await click('input[value="completed"]');
    const filtro = await settled("document.querySelector('input[value=\"completed\"]').checked && !document.body.innerText.includes('Carregando')");
    results.push({ caso: 'filtro_encerradas_sem_nova_entrada', foco: filtro });

    await click('a[aria-label="Gestão Escolar — início"]');
    const setores = await settled("document.querySelector('main h1') && document.querySelector('main h1').innerText.trim() === 'Setores' && Array.from(document.querySelectorAll('a')).some((link) => link.getAttribute('href') === '/setor/1')");
    results.push({ caso: 'link_interno_setores', foco: setores });
    await tab();
    await new Promise((resolve) => setTimeout(resolve, 200));
    results.push({ caso: 'tab_seguinte_depois_de_setores', foco: await focusSnapshot() });

    await click('a[href="/setor/1"]');
    await waitFor("document.querySelector('a[href=\"/escola/6\"]')");
    await click('a[href="/escola/6"]');
    await waitFor("Array.from(document.querySelectorAll('button')).some((button) => button.innerText.includes('Excluir escola'))");
    await click('button', 'Excluir escola');
    await waitFor("document.querySelector('#delete-school-title')");
    await click('.modal-footer .btn-danger');
    const avisoEscola = await settled("document.body.innerText.includes('excluída com sucesso') && location.pathname === '/setor/1'");
    results.push({ caso: 'aviso_exclusao_escola', foco: avisoEscola, escritas: writes.length });

    await click('a[href="/escola/6"]');
    await waitFor("document.querySelector('a[href=\"/escola/6/classes\"]')");
    await click('a[href="/escola/6/classes"]');
    await waitFor("document.querySelector('a[href=\"/turma/8\"]')");
    await click('a[href="/turma/8"]');
    await waitFor("Array.from(document.querySelectorAll('button')).some((button) => button.innerText.includes('Excluir turma'))");
    await click('button', 'Excluir turma');
    await waitFor("document.querySelector('#delete-class-title')");
    await click('.modal-footer .btn-danger');
    const avisoTurma = await settled("document.body.innerText.includes('excluída com sucesso') && location.pathname === '/escola/6/classes'");
    results.push({ caso: 'aviso_exclusao_turma', foco: avisoTurma, escritas: writes.length });

    const entradas = results.filter((item) => item.caso.startsWith('link_interno_'));
    const semTitulo = entradas.filter((item) => !item.foco.eH1).map((item) => item.caso);
    if (semTitulo.length) throw new Error(`O titulo nao recebeu foco: ${semTitulo.join(', ')}`);
    const tabSeguinte = results.find((item) => item.caso === 'tab_seguinte_depois_de_setores');
    if (!tabSeguinte || tabSeguinte.foco.tag !== 'A' || tabSeguinte.foco.texto.includes('Ir para o conteúdo principal')) {
      throw new Error(`Tab seguinte inesperado: ${JSON.stringify(tabSeguinte && tabSeguinte.foco)}`);
    }
    const filtroEncerradas = results.find((item) => item.caso === 'filtro_encerradas_sem_nova_entrada');
    if (!filtroEncerradas || filtroEncerradas.foco.tag !== 'INPUT') throw new Error('O filtro moveu o foco para fora do radio.');
    for (const caso of ['aviso_exclusao_escola', 'aviso_exclusao_turma']) {
      const aviso = results.find((item) => item.caso === caso);
      if (!aviso || aviso.foco.role !== 'status' || !aviso.foco.texto.includes('excluída com sucesso')) {
        throw new Error(`Aviso sem foco: ${caso}`);
      }
    }
    if (writes.length !== 2) throw new Error(`Interceptacoes de exclusao: ${writes.length}`);

    fs.writeFileSync(output, JSON.stringify({
      navegador: version.Browser,
      gravacoesReais: 0,
      casos: results,
      escritas: writes,
    }, null, 2));
  } catch (error) {
    if (!fs.existsSync(output)) {
      fs.writeFileSync(output, JSON.stringify({
        navegador: version.Browser,
        erro: error.message,
        gravacoesReais: 0,
        casos: results,
        escritas: writes,
      }, null, 2));
    }
    throw error;
  } finally {
    ws.close();
  }
}

verify().catch((error) => {
  console.error(error);
  process.exit(1);
});
