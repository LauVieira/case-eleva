const fs = require('fs');
const path = require('path');

async function verify() {
  const [port, output] = process.argv.slice(2);
  if (!port || !output || fs.existsSync(output)) throw new Error('Informe porta e resultado novo.');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  let fatal = null;
  let mode = 'ok';
  const pending = new Map();
  const writes = [];
  const results = [];
  const school = {
    id: 990002, sectorId: 10, name: 'escola exemplo', address: 'Rua Fictícia, 10',
    headteacher: 'Diretora Fictícia', phone: '+552223456789',
    createdAt: '2026-01-01T12:00:00.000Z', updatedAt: '2026-01-02T12:00:00.000Z', totalCapacity: 50,
  };
  const sectors = [{ id: 10, name: 'Setor de origem fictício' }, { id: 2, name: 'Setor de destino fictício' }];

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Tempo esgotado: ${method}`)); }, 12000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const fulfill = (requestId, status, data) => send('Fetch.fulfillRequest', {
    requestId, responseCode: status,
    responseHeaders: [
      { name: 'Content-Type', value: 'application/json; charset=utf-8' },
      { name: 'Access-Control-Allow-Origin', value: 'http://127.0.0.1:9000' },
    ],
    body: Buffer.from(JSON.stringify(data)).toString('base64'),
  });

  async function paused({ requestId, request }) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.origin === 'http://localhost:3000') {
      if (url.pathname === '/sectors') return fulfill(requestId, 200, sectors);
      if (url.pathname === '/schools/990002') {
        if (mode === 'loadError') return fulfill(requestId, 500, { message: 'Falha simulada.' });
        return fulfill(requestId, 200, mode === 'nulls' ? { ...school, headteacher: null, phone: null } : school);
      }
      return fulfill(requestId, 404, { message: 'Escola não encontrada.' });
    }
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return send('Fetch.continueRequest', { requestId });
    if (url.origin !== 'http://localhost:3000' || !['PATCH', 'POST'].includes(request.method)) {
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error('Escrita inesperada bloqueada.');
    }
    const data = JSON.parse(request.postData);
    if (Object.keys(data).some((key) => !['sectorId', 'name', 'address', 'headteacher', 'phone'].includes(key))) {
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error('Campo nao editavel no payload.');
    }
    writes.push({ method: request.method, path: url.pathname, payload: data, scenario: mode });
    if (request.method === 'POST' && url.pathname === '/schools') return fulfill(requestId, 201, { id: 990003, ...data });
    if (request.method !== 'PATCH' || url.pathname !== '/schools/990002') {
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error('Destino de escrita inesperado.');
    }
    if (mode === 'conflict') return fulfill(requestId, 409, { message: 'Já existe uma escola com este nome' });
    if (mode === 'serverError') return fulfill(requestId, 500, { message: 'Falha simulada.' });
    if (mode === 'sectorGone') return fulfill(requestId, 422, { message: 'sectorId: setor não encontrado. Informe um setor existente.' });
    if (mode === 'slow') await new Promise((resolve) => setTimeout(resolve, 350));
    return fulfill(requestId, 200, { ...school, ...data, updatedAt: '2026-11-08T12:00:00.000Z' });
  }

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(item.timer);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
    } else if (message.method === 'Fetch.requestPaused') paused(message.params).catch((error) => { fatal = error; });
  });

  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function waitFor(expression) {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      if (fatal) throw fatal;
      if (await evaluate(`Boolean(${expression})`)) return;
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    throw new Error(`Estado ausente: ${expression}`);
  }
  async function click(selector) {
    const point = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) throw new Error('Elemento ausente'); element.scrollIntoView({block:'center'}); const r = element.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  }
  async function fill(selector, value) {
    await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); element.focus(); element.select(); })()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
    if (value) await send('Input.insertText', { text: value });
  }
  async function selectSector(value) {
    await evaluate(`(() => { const field = document.querySelector('#school-sector'); field.value = ${JSON.stringify(value)}; field.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  }
  async function openEdit(nextMode = 'ok') {
    mode = nextMode;
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/escola/990002/editar' });
    await waitFor("document.querySelector('#school-name') && document.querySelector('#school-name').value === 'Escola Exemplo'");
  }
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const pass = (caseName, detail = {}) => results.push({ caso: caseName, resultado: 'passou_com_respostas_simuladas', ...detail });

  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/escola/990002' });
    await waitFor("document.querySelector('a[href=\"/escola/990002/editar\"]') !== null");
    await click('a[href="/escola/990002/editar"]');
    await waitFor("document.querySelector('#school-name') && document.querySelector('#school-sector').value === '10'");
    const loaded = await evaluate("Array.from(document.querySelectorAll('form [name]')).map(x=>({name:x.name,value:x.value,label:document.querySelector('label[for=\"'+x.id+'\"]')?.textContent}))");
    assert(loaded.length === 5 && loaded.every(x => x.label), 'Campos editaveis ou rotulos divergentes.');
    assert(await evaluate("document.querySelector('#school-headteacher').value === 'Diretora Fictícia' && document.querySelector('#school-phone').value === '+552223456789'"), 'Opcionais nao preenchidos.');
    pass('acesso_pelo_detalhe_e_campos_editaveis', { campos: loaded, titulo: await evaluate('document.title') });
    const formPath = path.join(path.dirname(output), 'REV-03-FE-A003-r05-formulario.html');
    if (!fs.existsSync(formPath)) fs.writeFileSync(formPath, await evaluate('document.documentElement.outerHTML'), 'utf8');
    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    const layout = await evaluate('({largura:innerWidth,conteudo:document.documentElement.scrollWidth})');
    assert(layout.conteudo <= layout.largura, 'Transbordamento a 320px.');
    pass('largura_320px', layout);
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('Nenhuma alteração para salvar.')");
    assert(writes.length === 0, 'Foi enviado PATCH sem alteracao.');
    await click('form button[type="button"]');
    await waitFor("location.pathname === '/escola/990002' && document.querySelector('a[href=\"/escola/990002/editar\"]')");
    assert(writes.length === 0, 'Cancelar provocou escrita.');
    pass('sem_alteracoes_e_cancelamento_sem_mutacao');

    await openEdit();
    await fill('#school-name', '   ');
    await fill('#school-address', '   ');
    await fill('#school-headteacher', 'A'.repeat(151));
    await fill('#school-phone', 'abc');
    await selectSector('');
    await click('form button[type="submit"]');
    await waitFor("document.querySelectorAll('form .is-invalid').length === 5");
    assert(writes.length === 0, 'Dados invalidos chegaram ao PATCH.');
    assert(await evaluate("document.activeElement.getAttribute('role') === 'alert'"), 'Foco nao chegou ao resumo.');
    pass('validacao_dos_cinco_campos_sem_envio', { foco: 'resumo_de_erros' });

    await openEdit();
    await fill('#school-name', '  NOVA   ESCOLA  ');
    mode = 'conflict';
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('#school-name-error')?.textContent.includes('Já existe')");
    assert(writes.length === 1 && JSON.stringify(writes[0].payload) === JSON.stringify({name:'nova escola'}), 'PATCH nao foi parcial.');
    assert(await evaluate("document.querySelector('#school-name').value === '  NOVA   ESCOLA  '"), 'Nome perdido apos 409.');
    mode = 'ok';
    await fill('#school-name', 'Outra escola');
    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('Escola atualizada com sucesso.')");
    pass('conflito_409_preserva_dados_e_permite_reenvio', { primeiro_payload: writes[0].payload, reenvio: writes[1].payload });

    await openEdit();
    await fill('#school-headteacher', '');
    await fill('#school-phone', '');
    await selectSector('2');
    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('Escola atualizada com sucesso.')");
    const clearing = writes.at(-1);
    assert(JSON.stringify(clearing.payload) === JSON.stringify({sectorId:2,headteacher:null,phone:null}), 'Opcionais/omissao divergentes.');
    assert(await evaluate("document.querySelector('a[href=\"/setor/2\"]') !== null"), 'Retorno nao acompanha setor.');
    pass('mudanca_de_setor_e_limpeza_de_opcionais', { payload: clearing.payload, caminho: clearing.path });

    await openEdit();
    await selectSector('2');
    mode = 'sectorGone';
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('#school-sector-error')?.textContent.includes('não está disponível')");
    assert(await evaluate("document.querySelector('#school-sector').value === '2'"), 'Setor perdido apos 422.');
    pass('setor_removido_apos_carregamento_422');

    await openEdit();
    await fill('#school-address', 'Rua Modificada, 20');
    mode = 'serverError';
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('[role=\"alert\"]')?.textContent.includes('Não foi possível confirmar')");
    assert(await evaluate("document.querySelector('#school-address').value === 'Rua Modificada, 20'"), 'Endereco perdido apos falha.');
    mode = 'ok';
    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('Escola atualizada com sucesso.')");
    pass('erro_500_preserva_dados_e_permite_reenvio');

    await openEdit();
    await fill('#school-address', 'Rua com envio único, 30');
    mode = 'slow';
    const beforeDoubleClick = writes.length;
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('form button[type=\"submit\"]').disabled");
    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('Escola atualizada com sucesso.')");
    assert(writes.length === beforeDoubleClick + 1, 'Envio duplicado observado.');
    pass('envio_unico_e_estado_salvando');

    await openEdit('nulls');
    assert(await evaluate("document.querySelector('#school-headteacher').value === '' && document.querySelector('#school-phone').value === ''"), 'Null nao convertido para campo vazio.');
    pass('opcionais_null_carregados_como_vazios');

    mode = 'loadError';
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/escola/990002/editar' });
    await waitFor("document.body.textContent.includes('Não foi possível carregar os dados') && !document.querySelector('form')");
    mode = 'ok';
    await click('main button');
    await waitFor("document.querySelector('#school-name') !== null");
    pass('falha_no_carregamento_e_nova_tentativa');

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/escola/990004/editar' });
    await waitFor("document.body.textContent.includes('Escola não encontrada.') && !document.querySelector('form')");
    pass('escola_inexistente_404');

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/setor/10/escolas/nova' });
    await waitFor("document.querySelector('#school-name') && document.querySelector('#school-sector').value === '10'");
    assert(await evaluate("!document.querySelector('form button[type=\"button\"]') && document.querySelector('form button[type=\"submit\"]').textContent.includes('Cadastrar escola')"), 'Comportamento de criacao alterado.');
    await fill('#school-name', 'Escola de criação');
    await fill('#school-address', 'Rua da Criação, 40');
    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('Escola cadastrada com sucesso.')");
    pass('regressao_do_cadastro_compartilhado');

    const record = {
      data: '2026-11-08', metodo: 'Chrome/CDP; GETs e escritas da API simulados e interceptados antes do envio.',
      gravacoes_reais: false, dados: 'Ficticios; escola 990002; setores 10 e 2.', resultados: results, requisicoes_de_escrita: writes,
      limites: 'Nao comprova persistencia, unicidade concorrente, preservacao real das turmas/datas, NVDA, contraste, texto 200% ou teclado completo. Sem prints.',
      resultado: 'passou_nos_casos_verificados',
    };
    fs.writeFileSync(output, JSON.stringify(record, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify({ casos: results.length, escritas_simuladas: writes.length, gravacoes_reais: false, resultado: record.resultado }));
  } finally {
    for (const item of pending.values()) clearTimeout(item.timer);
    ws.close();
  }
}

verify().catch((error) => { console.error(error.stack); process.exitCode = 1; });
