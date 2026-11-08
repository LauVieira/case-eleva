const fs = require('fs');
const path = require('path');

async function verify() {
  const [port, output] = process.argv.slice(2);
  if (!port || !output || fs.existsSync(output)) throw Error('Informe porta e resultado novo.');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(targets.find(x => x.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  let fatal = null;
  let mode = 'ok';
  let heldDelete = null;
  let heldSchool = null;
  const pending = new Map();
  const writes = [];
  const results = [];
  const reads = [];
  const exceptions = [];
  const doms = [];
  const runId = Date.now();
  const school = { id: 990002, sectorId: 10, name: 'escola fictícia de exclusão', address: 'Rua Fictícia, 10', headteacher: null, phone: null };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error(`Tempo esgotado: ${method}`)); }, 12000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const fulfill = (requestId, status, data) => send('Fetch.fulfillRequest', {
    requestId, responseCode: status,
    responseHeaders: [
      { name: 'Content-Type', value: 'application/json; charset=utf-8' },
      { name: 'Access-Control-Allow-Origin', value: 'http://127.0.0.1:9000' },
    ],
    body: status === 204 ? '' : Buffer.from(JSON.stringify(data)).toString('base64'),
  });
  async function paused({ requestId, request }) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.origin === 'http://localhost:3000') {
      reads.push({ path: url.pathname, scenario: mode });
      if (url.pathname === '/schools/990002') {
        if (mode === 'holdSchool') { heldSchool = requestId; return; }
        if (mode === 'loadError') return fulfill(requestId, 500, { message: 'Falha fictícia.' });
        if (mode === 'load404') return fulfill(requestId, 404, { message: 'Escola não encontrada.' });
        return fulfill(requestId, 200, school);
      }
      if (url.pathname === '/sectors/10/schools' || url.pathname === '/schools/990002/classes') return fulfill(requestId, 200, []);
      return fulfill(requestId, 404, { message: 'Recurso fictício não encontrado.' });
    }
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return send('Fetch.continueRequest', { requestId });
    if (url.origin !== 'http://localhost:3000' || request.method !== 'DELETE' || url.pathname !== '/schools/990002') {
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw Error('Escrita inesperada bloqueada.');
    }
    writes.push({ method: request.method, path: url.pathname, payload: request.postData || null, scenario: mode });
    if (mode === 'holdDelete') { heldDelete = requestId; return; }
    if (mode === 'active' || mode === 'completed') return fulfill(requestId, 409, { message: 'Não é possível excluir esta escola porque existem turmas vinculadas a ela. Exclua primeiro as turmas e tente novamente.' });
    if (mode === 'serverError') return fulfill(requestId, 500, { message: 'Não foi possível excluir a escola. Tente novamente.' });
    if (mode === 'networkError') return send('Fetch.failRequest', { requestId, errorReason: 'ConnectionFailed' });
    if (mode === 'delete404') return fulfill(requestId, 404, { message: 'Escola não encontrada.' });
    return fulfill(requestId, 204);
  }
  ws.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id); pending.delete(message.id); clearTimeout(item.timer);
      if (message.error) item.reject(Error(JSON.stringify(message.error))); else item.resolve(message.result);
    } else if (message.method === 'Fetch.requestPaused') paused(message.params).catch(error => { fatal = error; });
    else if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params);
  });
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function waitFor(expression) {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      if (fatal) throw fatal;
      if (await evaluate(`Boolean(${expression})`)) return;
      await new Promise(resolve => setTimeout(resolve, 60));
    }
    throw Error(`Estado ausente: ${expression}`);
  }
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const pass = (caso, observado) => results.push({ caso, resultado: 'passou_com_respostas_simuladas', observado });
  const trigger = 'main button.list-group-item';
  const cancel = '.modal-footer button:first-child';
  const confirm = '.modal-footer button:last-child';
  async function click(selector) {
    const point = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e) throw Error('Elemento ausente'); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  }
  async function key(keyName, code, virtualKey, modifiers = 0) {
    const text = keyName === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {};
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, code, windowsVirtualKeyCode: virtualKey, modifiers, ...text });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, code, windowsVirtualKeyCode: virtualKey, modifiers });
  }
  async function open(nextMode = 'ok') {
    mode = nextMode;
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/escola/990002' });
    await waitFor(`document.querySelector(${JSON.stringify(trigger)})`);
    await click(trigger);
    await waitFor("document.querySelector('[role=dialog]') && document.activeElement.textContent === 'Cancelar'");
  }
  function saveDOM(name, dom) {
    const p = path.join(path.dirname(output), `REV-03-FE-A004-r06-${name}-${runId}.html`);
    fs.writeFileSync(p, dom, { encoding: 'utf8', flag: 'wx' });
    doms.push(p);
  }
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await open();
    assert(await evaluate("document.querySelector('[role=dialog]').getAttribute('aria-labelledby') === 'delete-school-title' && document.querySelector('#delete-school-description').textContent.includes('escola fictícia de exclusão')"), 'Registro ou nome do dialogo ausente.');
    assert(writes.length === 0, 'Abrir confirmação enviou escrita.');
    saveDOM('confirmacao', await evaluate('document.documentElement.outerHTML'));
    pass('confirmacao_identifica_registro_sem_envio', 'Diálogo nomeado, escola identificada, foco inicial em Cancelar, zero DELETE ao abrir.');
    await key('Tab', 'Tab', 9);
    assert(await evaluate(`document.activeElement === document.querySelector('${confirm}')`), 'Tab nao chegou a confirmar.');
    await key('Tab', 'Tab', 9, 8);
    assert(await evaluate(`document.activeElement === document.querySelector('${cancel}')`), 'Shift+Tab nao voltou a cancelar.');
    await key('Enter', 'Enter', 13);
    await waitFor("!document.querySelector('[role=dialog]')");
    assert(writes.length === 0 && await evaluate(`document.activeElement === document.querySelector('${trigger}')`), 'Cancelamento ou retorno de foco incorreto.');
    pass('teclado_cancelar_sem_mutacao', 'Tab, Shift+Tab e Enter em Cancelar fecharam sem DELETE e devolveram foco ao botão Excluir escola.');
    await key('Enter', 'Enter', 13);
    await waitFor("document.querySelector('[role=dialog]')");
    await key('Escape', 'Escape', 27);
    await waitFor("!document.querySelector('[role=dialog]')");
    assert(writes.length === 0, 'Escape enviou DELETE.');
    pass('reabrir_por_teclado_e_cancelar_escape', 'Enter reabriu confirmação; Escape fechou sem DELETE.');

    for (const status of ['active', 'completed']) {
      await open(status);
      await click(confirm);
      await waitFor("document.querySelector('.modal [role=alert]')");
      assert(await evaluate("location.pathname === '/escola/990002' && document.activeElement.getAttribute('role') === 'alert' && document.querySelector('.modal [role=alert]').textContent.includes('Exclua primeiro as turmas') && document.querySelector('.modal [role=alert]').textContent.includes('encerradas') && document.querySelector('.modal a').getAttribute('href') === '/escola/990002/classes'"), 'Orientacao do bloqueio incorreta.');
      if (status === 'completed') saveDOM('bloqueio', await evaluate('document.documentElement.outerHTML'));
      pass(`resposta_409_cenario_${status}`, '409 simulado manteve escola e diálogo, focou orientação e ofereceu Ver turmas; não comprova bloqueio real da API.');
    }
    const prior = writes.length;
    await click('.modal a');
    await waitFor("location.pathname === '/escola/990002/classes' && document.body.textContent.includes('Adicionar Classe')");
    assert(writes.length === prior, 'Ver turmas provocou outra escrita.');
    pass('destino_ver_turmas', 'Link abriu a listagem da mesma escola sem mutação adicional; filtro Encerradas ainda ausente.');

    await open('serverError');
    await click(confirm);
    await waitFor("document.querySelector('.modal [role=alert]')");
    assert(await evaluate("document.querySelector('.modal [role=alert]').textContent.includes('Tente novamente') && !document.querySelector('.modal-footer button:last-child').disabled"), 'Nao permitiu repetir apos falha.');
    mode = 'ok';
    await click(confirm);
    await waitFor("location.pathname === '/setor/10' && document.querySelector('[role=status]')?.textContent.includes('excluída com sucesso') && document.body.textContent.includes('Adicionar Escola')");
    assert(await evaluate("document.activeElement.getAttribute('role') === 'status' && !document.querySelector('a[href=\"/escola/990002\"]')"), 'Retorno, foco ou listagem incorretos.');
    saveDOM('sucesso', await evaluate('document.documentElement.outerHTML'));
    pass('falha_500_recuperacao_204', 'Erro manteve contexto e permitiu reenviar; 204 levou ao setor 10, nova listagem vazia exibiu criação e aviso de sucesso focado.');
    await send('Page.reload');
    await waitFor("document.body.textContent.includes('Adicionar Escola')");
    assert(await evaluate("!document.body.textContent.includes('excluída com sucesso')"), 'Aviso de sucesso repetiu no refresh.');
    pass('aviso_sucesso_consumido', 'Recarregar listagem não repetiu aviso de exclusão.');

    await open('networkError');
    await click(confirm);
    await waitFor("document.querySelector('.modal [role=alert]')?.textContent.includes('confirmar a exclusão')");
    assert(await evaluate("location.pathname === '/escola/990002' && !document.querySelector('.modal-footer button:last-child').disabled"), 'Falha de rede fechou ou bloqueou repeticao.');
    const afterNetwork = writes.length;
    await click(cancel);
    await waitFor("!document.querySelector('[role=dialog]')");
    assert(writes.length === afterNetwork, 'Cancelar apos erro enviou nova escrita.');
    pass('falha_rede_e_cancelamento', 'Falha simulada comunicou ausência de confirmação, manteve contexto e permitiu cancelar sem novo DELETE.');

    await open('delete404');
    await click(confirm);
    await waitFor("document.querySelector('.modal [role=alert]')?.textContent.includes('não foi encontrada')");
    assert(await evaluate("document.querySelector('.modal-footer button:last-child').disabled && document.querySelector('.modal a').getAttribute('href') === '/setor/10'"), '404 nao tratou ausencia.');
    pass('escola_removida_404', 'Não afirmou sucesso: informou escola ausente, desabilitou repetição e ofereceu retorno ao setor.');

    await open('holdDelete');
    const beforePending = writes.length;
    await evaluate(`document.querySelector('${confirm}').click(); document.querySelector('${confirm}').click();`);
    const deadline = Date.now() + 5000;
    while (!heldDelete && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 30));
    assert(heldDelete && writes.length === beforePending + 1, 'Duplicacao do DELETE.');
    assert(await evaluate("Array.from(document.querySelectorAll('.modal-footer button')).every(x=>x.disabled) && document.querySelector('.modal [role=status]').textContent.includes('Excluindo')"), 'Estado pendente ausente.');
    await key('Escape', 'Escape', 27);
    assert(await evaluate("!!document.querySelector('[role=dialog]')"), 'Escape fechou exclusao em andamento.');
    mode = 'serverError';
    await fulfill(heldDelete, 500, { message: 'Falha simulada.' }); heldDelete = null;
    await waitFor("document.querySelector('.modal [role=alert]')");
    pass('envio_unico_e_estado_pendente', 'Dois acionamentos síncronos produziram um DELETE; resposta retida apenas para inspecionar estado pendente; botões desabilitados e Escape não encerrou requisição em andamento.');

    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    const layout = await evaluate('({largura:innerWidth,conteudo:document.documentElement.scrollWidth,dialogo:document.querySelector(".modal-content").getBoundingClientRect().width})');
    assert(layout.conteudo <= layout.largura && layout.dialogo <= layout.largura, 'Transbordamento do dialogo.');
    pass('dialogo_320px', layout);
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    mode = 'holdSchool';
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/escola/990002' });
    await waitFor("document.querySelector('main [role=status]')?.textContent.includes('Carregando escola')");
    assert(await evaluate(`!document.querySelector('${trigger}')`), 'Acao antes do carregamento.');
    const schoolDeadline = Date.now() + 5000;
    while (!heldSchool && Date.now() < schoolDeadline) await new Promise(resolve => setTimeout(resolve, 30));
    assert(heldSchool, 'GET nao retido.');
    await fulfill(heldSchool, 200, school); heldSchool = null;
    await waitFor(`document.querySelector('${trigger}')`);
    pass('sem_exclusao_antes_de_carregar', 'Antes da resposta GET havia somente Carregando escola, sem botão de exclusão; após resposta a ação ficou disponível.');
    mode = 'loadError';
    await send('Page.reload');
    await waitFor("document.querySelector('main [role=alert]')");
    assert(await evaluate(`!document.querySelector('${trigger}') && !document.querySelector('main [role=status]')`), 'Acao disponivel em erro.');
    mode = 'ok';
    await click('main [role=alert] button');
    await waitFor(`document.querySelector('${trigger}')`);
    pass('carregamento_falha_e_recuperacao', 'Erro GET não ofereceu exclusão nem manteve carregando; Tentar novamente recuperou o detalhe.');
    mode = 'load404';
    await send('Page.reload');
    await waitFor("document.querySelector('main [role=alert]')?.textContent.includes('Escola não encontrada')");
    assert(await evaluate(`!document.querySelector('${trigger}')`), 'Exclusao em escola inexistente.');
    pass('carregamento_404', 'Escola inexistente apresentou orientação e nenhum botão de exclusão.');

    const record = {
      data: new Date().toISOString(), metodo: 'Interação em Chrome sem interface via CDP, sem prints; API interceptada com respostas fictícias antes do servidor.',
      gravacoes_reais: false, dados: school, resultados: results, requisicoes_de_escrita: writes, documentos_dom: doms,
      limites: 'Não comprova DELETE/persistência reais, bloqueio real por turmas, integridade do banco, filtro Encerradas ausente (A009), teclado completo, contraste, texto 200%, NVDA ou usuários. Retenção pontual de resposta só para conferir envio único, sem teste de desempenho/conexão lenta.',
      resultado: 'passou_nos_casos_verificados',
    };
    if (fatal) throw fatal;
    fs.writeFileSync(output, JSON.stringify(record, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
    console.log(JSON.stringify({ casos: results.length, escritas_simuladas: writes.length, gravacoes_reais: false, resultado: record.resultado }));
  } catch (error) {
    const diagnostic = { error: error.stack, reads, writes, results, exceptions, body: await evaluate('document.body.innerText'), dom: await evaluate('document.documentElement.outerHTML') };
    const diagnosticPath = output.replace(/\.json$/, `-falha-${Date.now()}.json`);
    fs.writeFileSync(diagnosticPath, JSON.stringify(diagnostic, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
    throw error;
  } finally {
    for (const item of pending.values()) clearTimeout(item.timer);
    ws.close();
  }
}
verify().catch(error => { console.error(error.stack); process.exitCode = 1; });
