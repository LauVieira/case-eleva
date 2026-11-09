const fs = require('fs');

async function verify () {
  const [port, output, errorHtml, successHtml] = process.argv.slice(2);
  if (!port || !output || !errorHtml || !successHtml) throw new Error('Informe porta, JSON, HTML de erro e HTML de sucesso.');
  if ([output, errorHtml, successHtml].some((file) => fs.existsSync(file))) throw new Error('O destino da evidencia ja existe.');
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
    if (mode === 'conflict') return fulfill(requestId, 409, { message: 'nome duplicado' });
    if (mode === 'invalidSector') return fulfill(requestId, 422, { message: 'sectorId: inexistente' });
    if (mode === 'invalid') return fulfill(requestId, 422, { message: 'Confira os dados informados.' });
    if (mode === 'missing') return fulfill(requestId, 404, { message: 'Nao encontrado' });
    if (mode === 'slow') await new Promise((resolve) => setTimeout(resolve, 700));
    return fulfill(requestId, 201, {
      id: 990010,
      sectorId: data.sectorId,
      name: data.name,
      address: data.address,
      headteacher: data.headteacher,
      phone: data.phone,
    });
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
    const point = await evaluate(`(() => { try { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return { erro: 'ausente' }; element.scrollIntoView({block:'center'}); const r = element.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2, desabilitado: !!element.disabled}; } catch (error) { return { erro: String(error) }; } })()`);
    if (!point || point.erro) throw new Error(`Clique em ${selector}: ${point && point.erro}`);
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed', button: 'left', clickCount: 1, x: point.x, y: point.y,
    });
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', button: 'left', clickCount: 1, x: point.x, y: point.y,
    });
  }
  async function fill (selector, value) {
    const ready = await evaluate(`(() => { try { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return 'ausente'; element.focus(); if (typeof element.select === 'function') element.select(); return 'ok'; } catch (error) { return String(error); } })()`);
    if (ready !== 'ok') throw new Error(`Campo ${selector}: ${ready}`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
    if (value) await send('Input.insertText', { text: value });
  }
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const pass = (caso, detail = {}) => {
    results.push({ caso, resultado: 'passou_com_respostas_simuladas', ...detail });
  };
  async function openForm (nextMode = 'ok') {
    mode = nextMode;
    await evaluate('document.documentElement.setAttribute("data-rev", "old")');
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/setor/10/escolas/nova' });
    await waitFor('document.documentElement.getAttribute("data-rev") !== "old" && document.querySelector("#school-name") && document.body.textContent.includes("Setor Azul")');
  }
  async function fillValid () {
    await fill('#school-name', '  Escola   Fictícia  ');
    await fill('#school-address', 'Rua Fictícia, 10');
    await fill('#school-phone', '(22) 2345-6789');
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

    const beforeEmpty = writes.length;
    await openForm();
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('#school-name-error') && document.querySelector('#school-address-error') && document.activeElement && document.activeElement.getAttribute('role') === 'alert'");
    assert(writes.length === beforeEmpty, 'Formulario vazio chegou ao POST.');
    assert(await evaluate("document.querySelector('#school-name').value === '' && document.querySelector('#school-address').value === ''"), 'Campos vazios foram alterados.');
    fs.writeFileSync(errorHtml, await evaluate('document.documentElement.outerHTML'));
    pass('envio_vazio_sem_post_com_resumo');

    await openForm();
    await fill('#school-name', 'Escola Ficticia');
    await fill('#school-address', 'Rua Ficticia, 10');
    await fill('#school-phone', '123');
    const beforePhone = writes.length;
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('#school-phone-error')");
    assert(writes.length === beforePhone, 'Telefone invalido chegou ao POST.');
    assert(await evaluate("document.querySelector('#school-name').value === 'Escola Ficticia' && document.querySelector('#school-address').value === 'Rua Ficticia, 10' && document.querySelector('#school-phone').value === '123'"), 'Preenchimento perdido na validacao do telefone.');
    pass('telefone_invalido_sem_post_preserva_campos');

    await openForm();
    await fillValid();
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('a[href=\"/escola/990010\"]') !== null");
    const created = writes.at(-1);
    assert(created.payload.name === 'escola fictícia' && created.payload.phone === '+552223456789' && created.payload.address === 'Rua Fictícia, 10' && created.payload.headteacher === null && created.payload.sectorId === 10, 'Payload valido divergente.');
    assert(await evaluate("document.querySelector('a[href=\"/escola/990010\"]') !== null && document.querySelector('a[href=\"/setor/10\"]') !== null"), 'Links de sucesso ausentes.');
    fs.writeFileSync(successHtml, await evaluate('document.documentElement.outerHTML'));
    pass('cadastro_valido_normaliza_e_confirma', { payload: created.payload });

    await openForm('conflict');
    await fillValid();
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('#school-name-error')?.textContent.includes('Já existe uma escola com este nome')");
    assert(await evaluate("document.querySelector('form') && document.querySelector('#school-name').value === '  Escola   Fictícia  '"), 'Dados perdidos apos 409.');
    pass('conflito_409_preserva_formulario');

    await openForm('invalidSector');
    await fillValid();
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('#school-sector-error')?.textContent.includes('não está disponível')");
    assert(await evaluate("document.querySelector('#school-address').value === 'Rua Fictícia, 10'"), 'Endereco perdido apos 422 de setor.');
    pass('setor_422_preserva_formulario');

    await openForm('invalid');
    await fillValid();
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('[role=\"alert\"]').textContent.includes('Confira os dados informados.')");
    assert(await evaluate("document.querySelector('#school-phone').value === '(22) 2345-6789'"), 'Telefone perdido apos 422.');
    pass('resposta_422_preserva_preenchimento');

    await openForm('missing');
    await fillValid();
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('[role=\"alert\"]').textContent.includes('Os dados preenchidos foram mantidos.')");
    assert(await evaluate("document.querySelector('form') !== null"), 'Formulario removido apos 404.');
    pass('resposta_404_preserva_formulario');

    await openForm('networkError');
    await fillValid();
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('[role=\"alert\"]').textContent.includes('Não foi possível confirmar o cadastro.')");
    assert(await evaluate("document.querySelector('#school-name').value === '  Escola   Fictícia  '"), 'Nome perdido apos falha de rede.');
    pass('falha_de_rede_preserva_preenchimento');

    await openForm('slow');
    await fillValid();
    const beforeDouble = writes.length;
    const point = await evaluate("(() => { const element = document.querySelector('form button[type=\"submit\"]'); const r = element.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()");
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
    await waitFor("document.body.textContent.includes('Escola cadastrada com sucesso.')");
    assert(writes.length === beforeDouble + 1, 'Dois cliques geraram mais de um POST.');
    pass('dois_cliques_geram_um_post', { escritas: writes.length - beforeDouble });

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
