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
  const pending = new Map();
  const send = (method, params = {}, session = sessionId) => new Promise((resolve, reject) => {
    const id = sequence + 1;
    sequence = id;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Tempo esgotado: ${method}`));
    }, 15000);
    pending.set(id, { resolve, reject, timer });
    const payload = { id, method, params };
    if (session) payload.sessionId = session;
    ws.send(JSON.stringify(payload));
  });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(item.timer);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
    } else if (message.method === 'Target.attachedToTarget') attachedParams = message.params;
  });
  async function evaluate (expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function waitFor (expression) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      try {
        if (await evaluate(`Boolean(${expression})`)) return;
      } catch (error) { /* navegação */ }
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    throw new Error(`Estado ausente: ${expression}`);
  }
  try {
    const discovered = await send('Target.getTargets', {}, null);
    const page = discovered.targetInfos.find((target) => target.type === 'page' && !target.attached);
    if (!page) throw new Error('Pagina do Chrome nao encontrada ou ja anexada.');
    const attached = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true }, null);
    const deadline = Date.now() + 5000;
    while (!attachedParams && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 20));
    sessionId = (attachedParams && attachedParams.sessionId) || attached.sessionId;
    await send('Runtime.runIfWaitingForDebugger');
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:9000/escola/6/classes/nova' });
    await waitFor("document.querySelector('form')");
    await evaluate("document.querySelector('#class-occupancy').value = '1.5'; document.querySelector('#class-occupancy').dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('#class-occupancy').dispatchEvent(new Event('change', { bubbles: true }));");
    await evaluate("document.querySelector('form').requestSubmit()");
    await waitFor("document.body.innerText.includes('limite de alunos')");
    const mensagem = await evaluate("document.querySelector('#class-occupancy-error') ? document.querySelector('#class-occupancy-error').innerText.trim() : ''");
    fs.writeFileSync(output, JSON.stringify({ navegador: version.Browser, mensagem }, null, 2));
  } finally {
    ws.close();
  }
}

verify().catch((error) => {
  console.error(error);
  process.exit(1);
});
