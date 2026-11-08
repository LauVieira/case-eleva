const fs = require('fs');
const path = require('path');

async function verify() {
  const port = process.argv[2];
  const outputPath = process.argv[3];
  if (!port || !outputPath || fs.existsSync(outputPath)) {
    throw new Error('Informe porta e arquivo de resultado novo.');
  }

  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find((item) => item.type === 'page');
  if (!target) throw new Error('Pagina do navegador nao localizada.');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let nextId = 0;
  let interceptionError = null;
  const pending = new Map();
  const posts = [];
  const events = new Map();
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Tempo esgotado: ${method}`));
    }, 12000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(request.timer);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
    } else if (events.has(message.method)) {
      events.get(message.method)(message.params).catch((error) => {
        interceptionError = error;
      });
    }
  });

  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }

  async function waitFor(expression) {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      if (interceptionError) throw interceptionError;
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Estado nao observado: ${expression}`);
  }

  async function click(selector) {
    const point = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) throw new Error('Elemento ausente');
      element.scrollIntoView({ block: 'center' });
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  }

  async function fill(selector, text) {
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
    await send('Input.insertText', { text });
  }

  events.set('Fetch.requestPaused', async ({ requestId, request }) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      await send('Fetch.continueRequest', { requestId });
      return;
    }
    if (request.method !== 'POST' || request.url !== 'http://localhost:3000/schools') {
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error('Requisicao de escrita inesperada bloqueada.');
    }
    const payload = JSON.parse(request.postData);
    posts.push(payload);
    await send('Fetch.fulfillRequest', {
      requestId,
      responseCode: 201,
      responseHeaders: [
        { name: 'Content-Type', value: 'application/json; charset=utf-8' },
        { name: 'Access-Control-Allow-Origin', value: 'http://127.0.0.1:9000' },
      ],
      body: Buffer.from(JSON.stringify({ id: 990001, ...payload })).toString('base64'),
    });
  });

  const record = {
    data: '2026-11-08',
    metodo: 'Chrome sem interface, CDP nativo, clique e preenchimento; POST interceptado e respondido com 201 simulado antes de chegar a API.',
    gravacoes_reais: false,
    resultados: [],
    limitacoes: 'Nao comprova persistencia, unicidade, erros da API, teclado completo, leitor de tela ou contraste. Nenhum print foi gerado.',
  };

  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/setor/10' });
    await waitFor("document.querySelector('a[href=\"/setor/10/escolas/nova\"]') !== null");
    await click('a[href="/setor/10/escolas/nova"]');
    await waitFor("document.querySelector('#school-name') && document.querySelector('#school-sector').value === '10'");

    const fields = await evaluate(`Array.from(document.querySelectorAll('form [name]')).map((field) => ({
      name: field.name,
      id: field.id,
      label: document.querySelector('label[for="' + field.id + '"]')?.textContent,
      tipo: field.tagName === 'SELECT' ? 'select' : field.type,
    }))`);
    if (fields.length !== 5 || fields.some((field) => !field.label)) throw new Error('Campos ou rotulos incorretos.');
    record.resultados.push({ caso: 'navegacao_e_formulario', resultado: 'passou', campos: fields, setor_inicial: 10, titulo: await evaluate('document.title') });
    fs.writeFileSync(path.join(path.dirname(outputPath), 'REV-03-FE-A002-r03-formulario.html'), await evaluate('document.documentElement.outerHTML'), 'utf8');

    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    const layout = await evaluate('({ largura: innerWidth, conteudo: document.documentElement.scrollWidth })');
    if (layout.conteudo > layout.largura) throw new Error('Transbordamento horizontal a 320px.');
    record.resultados.push({ caso: 'largura_320px', resultado: 'passou', ...layout });
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    await fill('#school-name', '  ESCOLA   ÁRVORE DE TESTE  ');
    await fill('#school-address', '  Rua Fictícia, 100  ');
    await click('button[type="submit"]');
    await waitFor("document.body.textContent.includes('Escola cadastrada com sucesso.') && !document.querySelector('form')");
    const firstExpected = { sectorId: 10, name: 'escola árvore de teste', address: 'Rua Fictícia, 100', headteacher: null, phone: null };
    if (JSON.stringify(posts[0]) !== JSON.stringify(firstExpected)) throw new Error('Payload minimo divergente.');
    record.resultados.push({ caso: 'envio_com_opcionais_vazios', resultado: 'passou_com_resposta_simulada', payload: posts[0], titulo: await evaluate('document.title'), foco: await evaluate('document.activeElement.tagName') });

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/setor/10/escolas/nova' });
    await waitFor("document.querySelector('#school-name') && document.querySelector('#school-sector').value === '10'");
    await evaluate("(() => { const select = document.querySelector('#school-sector'); select.value = '2'; select.dispatchEvent(new Event('change', { bubbles: true })); })()");
    await fill('#school-name', 'ESCOLA CELULAR');
    await fill('#school-address', 'Avenida Fictícia, 200');
    await fill('#school-headteacher', '  Ana Luísa  ');
    await fill('#school-phone', '(55) 99876-5432');
    await click('button[type="submit"]');
    await waitFor("document.body.textContent.includes('Escola cadastrada com sucesso.') && !document.querySelector('form')");
    const secondExpected = { sectorId: 2, name: 'escola celular', address: 'Avenida Fictícia, 200', headteacher: 'Ana Luísa', phone: '+5555998765432' };
    if (JSON.stringify(posts[1]) !== JSON.stringify(secondExpected)) throw new Error('Payload com opcionais divergente.');
    if (!await evaluate("document.querySelector('a[href=\"/setor/2\"]') !== null")) throw new Error('Retorno ao setor selecionado ausente.');
    record.resultados.push({ caso: 'envio_com_opcionais_e_outro_setor', resultado: 'passou_com_resposta_simulada', payload: posts[1] });

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/setor/999999/escolas/nova' });
    await waitFor("document.body.textContent.includes('Setor não encontrado.') && !document.querySelector('form')");
    record.resultados.push({ caso: 'setor_inexistente_no_contexto', resultado: 'passou' });
    record.total_posts_interceptados = posts.length;
    record.resultado = 'passou_nos_casos_verificados';
    fs.writeFileSync(outputPath, JSON.stringify(record, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify({ resultado: record.resultado, casos: record.resultados.length, posts_simulados: posts.length, gravacoes_reais: false }));
  } finally {
    for (const request of pending.values()) clearTimeout(request.timer);
    ws.close();
  }
}

verify().catch((error) => {
  console.error(error.stack);
  process.exitCode = 1;
});
