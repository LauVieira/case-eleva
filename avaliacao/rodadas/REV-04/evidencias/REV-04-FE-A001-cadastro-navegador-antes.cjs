const fs = require('fs');

async function verify () {
  const [port, output, htmlOutput] = process.argv.slice(2);
  if (!port || !output || !htmlOutput || fs.existsSync(output) || fs.existsSync(htmlOutput)) {
    throw new Error('Informe porta, JSON novo e HTML novo.');
  }
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
  let mode = 'invalid';
  const pending = new Map();
  const writes = [];
  const results = [];
  const sectors = [{ id: 10, name: 'Setor Azul', code: 'SA', color: '#25117d' }];
  const cors = [
    { name: 'Content-Type', value: 'application/json; charset=utf-8' },
    { name: 'Access-Control-Allow-Origin', value: 'http://127.0.0.1:9000' },
    { name: 'Access-Control-Allow-Headers', value: 'content-type,accept' },
    { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
  ];

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
    responseHeaders: cors,
    body: Buffer.from(data === undefined ? '' : JSON.stringify(data)).toString('base64'),
  });

  async function paused ({ requestId, request }) {
    const url = new URL(request.url);
    if (url.origin === 'http://localhost:3000' && request.method === 'OPTIONS') {
      return fulfill(requestId, 204, undefined);
    }
    if (request.method === 'GET' && url.origin === 'http://localhost:3000') {
      if (url.pathname === '/sectors') return fulfill(requestId, 200, sectors);
      return fulfill(requestId, 404, { message: 'Nao encontrado' });
    }
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return send('Fetch.continueRequest', { requestId });
    if (url.origin !== 'http://localhost:3000' || request.method !== 'POST' || url.pathname !== '/schools') {
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error(`Escrita inesperada bloqueada: ${request.method} ${request.url}`);
    }
    const data = JSON.parse(request.postData || '{}');
    writes.push({ method: request.method, path: url.pathname, payload: data, scenario: mode });
    if (mode === 'networkError') return send('Fetch.failRequest', { requestId, errorReason: 'ConnectionFailed' });
    return fulfill(requestId, 422, { message: 'Confira os dados informados.' });
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
  async function waitWrites (count) {
    const deadline = Date.now() + 5000;
    while (writes.length < count && Date.now() < deadline) {
      if (fatal) throw fatal;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
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
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const pass = (caso, detail = {}) => results.push({ caso, resultado: 'observado_antes_da_correcao', ...detail });
  async function snapshot () {
    return evaluate(`(() => ({
      titulo: document.title,
      alerta: document.querySelector('[role="alert"]') ? document.querySelector('[role="alert"]').textContent : '',
      invalidos: document.querySelectorAll('form .is-invalid').length,
      nome: document.querySelector('#school-name') ? document.querySelector('#school-name').value : null,
      endereco: document.querySelector('#school-address') ? document.querySelector('#school-address').value : null,
      telefone: document.querySelector('#school-phone') ? document.querySelector('#school-phone').value : null,
      sucesso: document.body.textContent.includes('Escola cadastrada com sucesso.')
    }))()`);
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
    await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/setor/10/escolas/nova' });
    await waitFor("document.querySelector('#school-name') && document.body.textContent.includes('Setor Azul')");
    assert(writes.length === 0, 'A abertura do formulario enviou cadastro.');
    await click('form button[type="submit"]');
    await waitWrites(1);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const emptyState = await snapshot();
    assert(writes.length === 1 && writes[0].payload.name === '' && writes[0].payload.address === '', 'O envio vazio nao gerou o POST esperado.');
    assert(!emptyState.alerta && emptyState.invalidos === 0 && !emptyState.sucesso, 'O envio vazio ja apresentava erro ou sucesso.');
    const html = await evaluate('document.documentElement.outerHTML');
    fs.writeFileSync(htmlOutput, html);
    pass('envio_vazio_dispara_post_sem_erro', { payload: writes[0].payload, tela: emptyState });

    mode = 'networkError';
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/setor/10/escolas/nova' });
    await waitFor("document.querySelector('#school-name')");
    await fill('#school-name', 'Escola Ficticia');
    await fill('#school-address', 'Rua Ficticia, 10');
    await fill('#school-phone', '123');
    const beforeWrites = writes.length;
    await click('form button[type="submit"]');
    await waitWrites(beforeWrites + 1);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const invalidState = await snapshot();
    const sent = writes.at(-1);
    assert(sent.scenario === 'networkError' && sent.payload.phone === '+55123', 'O telefone invalido nao chegou ao POST no formato canonico.');
    assert(invalidState.nome === 'Escola Ficticia' && invalidState.endereco === 'Rua Ficticia, 10' && invalidState.telefone === '123', 'O preenchimento nao permaneceu.');
    assert(!invalidState.alerta && invalidState.invalidos === 0, 'A falha de rede ja era explicada na tela.');
    pass('telefone_invalido_e_falha_de_rede_sem_explicacao', { payload: sent.payload, tela: invalidState });

    fs.writeFileSync(output, JSON.stringify({
      navegador: version.Browser,
      protocolo: version['Protocol-Version'],
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
