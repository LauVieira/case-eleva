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
  let mode = 'ok';
  const pending = new Map();
  const writes = [];
  const results = [];
  const school = {
    id: 990002,
    sectorId: 10,
    name: 'escola exemplo',
    address: 'Rua Fictícia, 10',
    headteacher: null,
    phone: null,
  };
  const listedClass = {
    id: 880000,
    schoolId: 990002,
    name: 'turma existente',
    grade: '1º ano',
    segment: 'Ensino Fundamental',
    shift: 'Matutino',
    status: 'current',
    maxOccupancy: 20,
  };
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
      if (url.pathname === `/schools/${school.id}/classes`) return fulfill(requestId, 200, [listedClass]);
      if (url.pathname === `/schools/${school.id}`) {
        if (mode === 'loadError') return fulfill(requestId, 500, { message: 'Falha simulada.' });
        return fulfill(requestId, 200, school);
      }
      return fulfill(requestId, 404, { message: 'Escola não encontrada' });
    }
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return send('Fetch.continueRequest', { requestId });
    if (url.origin !== 'http://localhost:3000' || request.method !== 'POST') {
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error(`Escrita inesperada bloqueada: ${request.method} ${request.url}`);
    }
    const data = JSON.parse(request.postData || '{}');
    const allowed = ['name', 'grade', 'segment', 'shift', 'status', 'maxOccupancy'];
    if (Object.keys(data).some((key) => !allowed.includes(key)) || allowed.some((key) => !(key in data))) {
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error(`Payload divergente: ${JSON.stringify(data)}`);
    }
    writes.push({ method: request.method, path: url.pathname, payload: data, scenario: mode });
    if (url.pathname !== `/schools/${school.id}/classes`) {
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error(`Destino de escrita inesperado: ${url.pathname}`);
    }
    if (mode === 'networkError') return send('Fetch.failRequest', { requestId, errorReason: 'ConnectionFailed' });
    if (mode === 'conflict') {
      return fulfill(requestId, 409, { message: 'Já existe uma turma ativa com este nome nesta escola. Informe outro nome.' });
    }
    if (mode === 'serverError') return fulfill(requestId, 500, { message: 'Falha simulada.' });
    if (mode === 'invalid') return fulfill(requestId, 422, { message: 'Confira os dados da turma.' });
    if (mode === 'missingSchool') return fulfill(requestId, 404, { message: 'Escola não encontrada' });
    if (mode === 'slow') await new Promise((resolve) => setTimeout(resolve, 800));
    return fulfill(requestId, 201, {
      id: 880001, schoolId: school.id, ...data, createdAt: '2026-11-08T12:00:00.000Z', updatedAt: '2026-11-08T12:00:00.000Z',
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
  async function openForm (nextMode = 'ok') {
    mode = nextMode;
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/escola/990002/classes/nova' });
    await waitFor("document.querySelector('#class-name') && document.querySelector('#class-status').value === 'current'");
  }
  async function fillValid (name = '  TURMA   A  ', occupancy = '0') {
    await fill('#class-name', name);
    await choose('#class-segment', 'Ensino Fundamental');
    await waitFor("Array.from(document.querySelectorAll('#class-grade option')).some((option) => option.value === '1º ano')");
    await choose('#class-grade', '1º ano');
    await choose('#class-shift', 'Matutino');
    await fill('#class-occupancy', occupancy);
  }
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const pass = (caso, detail = {}) => results.push({ caso, resultado: 'passou_com_respostas_simuladas', ...detail });

  try {
    const discovered = await send('Target.getTargets', {}, null);
    const page = discovered.targetInfos.find((target) => target.type === 'page' && target.url.startsWith('http://127.0.0.1:9000'));
    if (!page) throw new Error('Pagina do frontend nao encontrada.');
    if (page.attached) throw new Error('Pagina ja estava anexada ao depurador. Reinicie o Chrome antes de repetir.');
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

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/escola/990002/classes' });
    await waitFor("document.body.textContent.includes('Adicionar Classe')");
    const links = await evaluate("Array.from(document.querySelectorAll('[href]')).map((element) => element.getAttribute('href'))");
    assert(links.includes('/escola/990002/classes/nova'), 'Cartao de cadastro nao aponta para a nova rota.');
    assert(links.filter((href) => href === '/').length >= 2, 'Cartao de turma existente deixou de apontar para o inicio.');
    assert(writes.length === 0, 'A listagem enviou escrita.');
    await click('[href="/escola/990002/classes/nova"]');
    await waitFor("document.querySelector('#class-name') && document.body.textContent.includes('Escola Exemplo')");
    const fields = await evaluate("Array.from(document.querySelectorAll('form [name]')).map((field) => field.name)");
    assert(JSON.stringify(fields) === JSON.stringify(['name', 'segment', 'grade', 'shift', 'status', 'maxOccupancy']), 'Campos do formulario divergentes.');
    assert(await evaluate("document.querySelector('#class-status').value === 'current' && document.querySelector('#class-grade').disabled"), 'Situacao inicial ou grupo dependente divergentes.');
    assert(await evaluate("document.title === 'Cadastrar turma | Gestão Escolar'"), 'Titulo da tela divergente.');
    pass('cartao_abre_cadastro_da_escola_sem_escrita', { campos: fields, links });

    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    const layout = await evaluate('({ largura: innerWidth, conteudo: document.documentElement.scrollWidth })');
    assert(layout.conteudo <= layout.largura + 1, 'Transbordamento a 320px.');
    pass('largura_320px', layout);
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    await click('form button[type="submit"]');
    await waitFor("document.querySelectorAll('form .is-invalid').length === 5");
    assert(writes.length === 0, 'Formulario invalido chegou ao POST.');
    assert(await evaluate("document.activeElement.getAttribute('role') === 'alert'"), 'Foco nao chegou ao resumo.');
    pass('validacao_inicial_sem_envio');

    await openForm();
    await choose('#class-segment', 'Ensino Fundamental');
    await waitFor("Array.from(document.querySelectorAll('#class-grade option')).some((option) => option.value === '1º ano')");
    await choose('#class-grade', '1º ano');
    await choose('#class-segment', 'Ensino Médio');
    assert(await evaluate("document.querySelector('#class-grade').value === '1º ano'"), 'Ano compativel foi limpo.');
    await choose('#class-segment', 'Educação Infantil — Creche');
    await waitFor("document.querySelector('#class-grade').value === '' && document.querySelector('label[for=\"class-grade\"]').textContent.includes('Grupo')");
    const crecheOptions = await evaluate("Array.from(document.querySelectorAll('#class-grade option')).map((option) => option.value).filter(Boolean)");
    assert(JSON.stringify(crecheOptions) === JSON.stringify(['Berçário', 'Maternal I', 'Maternal II']), 'Opcoes de creche divergentes.');
    assert(writes.length === 0, 'Troca de segmento enviou cadastro.');
    pass('grupo_depende_do_segmento_e_limpa_incompativel', { opcoes: crecheOptions });

    await openForm();
    await fillValid();
    await fill('#class-occupancy', '-1');
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('#class-occupancy-error')");
    await fill('#class-occupancy', '1.5');
    await click('form button[type="submit"]');
    await fill('#class-occupancy', '2147483648');
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('#class-occupancy-error').textContent.includes('2147483647')");
    assert(writes.length === 0, 'Capacidade invalida chegou ao POST.');
    assert(await evaluate("document.querySelector('#class-name').value === '  TURMA   A  '"), 'Nome perdido na validacao.');
    pass('capacidade_invalida_bloqueada_sem_envio');

    await openForm();
    await fillValid('  TURMA   A  ', '0');
    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('Turma cadastrada com sucesso.') && document.body.textContent.includes('TURMA A')");
    const created = writes.at(-1);
    assert(created.path === '/schools/990002/classes' && created.payload.maxOccupancy === 0 && created.payload.status === 'current' && created.payload.name === 'turma a', 'Payload de cadastro divergente.');
    assert(!Object.prototype.hasOwnProperty.call(created.payload, 'schoolId'), 'schoolId enviado no corpo.');
    assert(await evaluate("document.querySelector('a[href=\"/escola/990002/classes\"]') !== null"), 'Retorno para as turmas ausente.');
    pass('cadastro_normaliza_nome_envia_zero_e_situacao_inicial', { payload: created.payload });

    await openForm('conflict');
    await fillValid('  TURMA   A  ', '0');
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('#class-name-error')?.textContent.includes('Já existe')");
    assert(await evaluate("document.querySelector('#class-name').value === '  TURMA   A  ' && document.querySelector('#class-occupancy').value === '0'"), 'Dados perdidos apos 409.');
    mode = 'ok';
    await fill('#class-name', 'Outra turma');
    await choose('#class-status', 'completed');
    await fill('#class-occupancy', '10');
    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('OUTRA TURMA')");
    const retried = writes.at(-1);
    assert(retried.payload.status === 'completed' && retried.payload.name === 'outra turma' && retried.payload.maxOccupancy === 10, 'Reenvio apos conflito divergente.');
    pass('conflito_409_preserva_dados_e_permite_reenvio', { reenvio: retried.payload });

    await openForm('invalid');
    await fillValid('Turma com erro', '3');
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('[role=\"alert\"]').textContent.includes('Confira os dados da turma.')");
    assert(await evaluate("document.querySelector('#class-name').value === 'Turma com erro'"), 'Nome perdido apos 422.');
    pass('resposta_422_preserva_preenchimento');

    await openForm('serverError');
    await fillValid('Turma instavel', '4');
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('[role=\"alert\"]').textContent.includes('Não foi possível confirmar')");
    assert(await evaluate("document.querySelector('#class-occupancy').value === '4'"), 'Capacidade perdida apos falha.');
    mode = 'ok';
    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('Turma cadastrada com sucesso.')");
    pass('falha_500_preserva_dados_e_permite_reenvio');

    await openForm('networkError');
    await fillValid('Turma sem rede', '5');
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('[role=\"alert\"]').textContent.includes('Não foi possível confirmar')");
    assert(await evaluate("document.querySelector('#class-name').value === 'Turma sem rede'"), 'Nome perdido apos falha de rede.');
    pass('falha_de_rede_preserva_preenchimento');

    await openForm('missingSchool');
    await fillValid('Turma orfa', '6');
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('[role=\"alert\"]').textContent.includes('A escola não foi encontrada')");
    assert(await evaluate("document.querySelector('form') !== null"), 'Formulario removido apos 404 do envio.');
    pass('escola_ausente_no_envio_preserva_formulario');

    await openForm();
    await fillValid('Turma unica', '7');
    mode = 'slow';
    const beforeDouble = writes.length;
    await click('form button[type="submit"]');
    await waitFor("document.querySelector('form button[type=\"submit\"]').disabled && document.querySelector('form button[type=\"button\"]').disabled");
    await click('form button[type="submit"]');
    await waitFor("document.body.textContent.includes('Turma cadastrada com sucesso.')");
    assert(writes.length === beforeDouble + 1, 'Envio duplicado observado.');
    pass('envio_unico_e_estado_salvando');

    await openForm();
    await fill('#class-name', 'Nao deve salvar');
    await click('form button[type="button"]');
    await waitFor("location.pathname === '/escola/990002/classes' && document.body.textContent.includes('Adicionar Classe')");
    assert(writes.length === beforeDouble + 1, 'Voltar provocou escrita.');
    pass('voltar_sem_mutacao');

    mode = 'loadError';
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/escola/990002/classes/nova' });
    await waitFor("document.body.textContent.includes('Não foi possível carregar a escola.') && !document.querySelector('form')");
    mode = 'ok';
    await click('main button');
    await waitFor("document.querySelector('#class-name') !== null");
    pass('falha_no_carregamento_e_nova_tentativa');

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/escola/999999/classes/nova' });
    await waitFor("document.body.textContent.includes('Escola não encontrada.') && !document.querySelector('form') && !document.body.textContent.includes('Tentar novamente')");
    pass('escola_inexistente_404');

    const domPath = path.join(path.dirname(output), `REV-03-FE-A005-cadastro-formulario-${Date.now()}.html`);
    await openForm();
    fs.writeFileSync(domPath, await evaluate('document.documentElement.outerHTML'), 'utf8');

    const record = {
      data: '2026-11-08',
      metodo: 'Chrome/CDP; GETs e POSTs da API simulados e interceptados antes do servidor.',
      gravacoes_reais: false,
      dados: 'Ficticios; escola 990002; turma listada 880000.',
      resultados: results,
      requisicoes_de_escrita: writes,
      documento_dom: domPath,
      limites: 'Nao comprova persistencia, unicidade real no banco, contraste, texto 200%, teclado completo ou NVDA. Sem prints.',
      resultado: 'passou_nos_casos_verificados',
    };
    fs.writeFileSync(output, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({
      casos: results.length, escritas_simuladas: writes.length, gravacoes_reais: false, resultado: record.resultado,
    }));
  } catch (error) {
    let failPath = output.replace(/\.json$/, '-falha.json');
    if (fs.existsSync(failPath)) failPath = output.replace(/\.json$/, `-falha-${Date.now()}.json`);
    fs.writeFileSync(failPath, `${JSON.stringify({
      erro: String(error.stack || error), resultados: results, requisicoes_de_escrita: writes,
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
