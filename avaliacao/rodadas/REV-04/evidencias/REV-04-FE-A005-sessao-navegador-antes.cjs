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
    } else if (message.method === 'Target.attachedToTarget') {
      attachedParams = message.params;
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
      try {
        if (await evaluate(`Boolean(${expression})`)) return;
      } catch (error) {
        // A página pode estar recarregando.
      }
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    throw new Error(`Estado ausente: ${expression}`);
  }
  async function click (selector, text) {
    const point = await evaluate(`(() => {
      const nodes = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
      const element = ${text ? `nodes.find((node) => (node.innerText || '').trim() === ${JSON.stringify(text)})` : 'nodes[0]'};
      if (!element) return null;
      element.scrollIntoView({ block: 'center' });
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    if (!point) throw new Error(`Elemento ausente: ${selector} ${text || ''}`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, x: point.x, y: point.y });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, x: point.x, y: point.y });
  }
  const snapshot = `(() => {
    const controles = Array.from(document.querySelectorAll('a, button, input')).map((node) => ({
      tag: node.tagName,
      type: node.getAttribute('type') || '',
      href: node.getAttribute('href') || '',
      texto: (node.innerText || node.getAttribute('placeholder') || node.value || '').trim().replace(/\\s+/g, ' ').slice(0, 80),
    }));
    return { url: location.pathname, titulo: document.title, controles };
  })()`;

  try {
    const discovered = await send('Target.getTargets', {}, null);
    const page = discovered.targetInfos.find((target) => target.type === 'page' && !target.attached);
    if (!page) throw new Error('Pagina do Chrome nao encontrada ou ja anexada.');
    const attached = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true }, null);
    const attachDeadline = Date.now() + 5000;
    while (!attachedParams && Date.now() < attachDeadline) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    sessionId = (attachedParams && attachedParams.sessionId) || attached.sessionId;
    await send('Runtime.runIfWaitingForDebugger');
    await send('Page.enable');
    await send('Runtime.enable');

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/' });
    await waitFor("Array.from(document.querySelectorAll('a')).some((link) => (link.innerText || '').trim() === 'Sair')");
    const setores = await evaluate(snapshot);

    await click('a', 'Sair');
    await waitFor("location.pathname === '/login' && Array.from(document.querySelectorAll('button')).some((button) => (button.innerText || '').trim() === 'Entrar')");
    await evaluate("document.querySelector('input[type=email]').value = 'pessoa@exemplo.test'");
    const antesDoEnvio = await evaluate("document.querySelector('input[type=email]').value");
    await click('button', 'Entrar');
    await waitFor("location.pathname === '/login' && Array.from(document.querySelectorAll('button')).some((button) => (button.innerText || '').trim() === 'Entrar')");
    await new Promise((resolve) => setTimeout(resolve, 300));
    const depoisDoEnvio = await evaluate(`(() => {
      const email = document.querySelector('input[type=email]');
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        url: location.pathname,
        titulo: document.title,
        email: email ? email.value : null,
        navegacao: nav ? nav.type : '',
        entrar: Array.from(document.querySelectorAll('button')).some((button) => (button.innerText || '').trim() === 'Entrar'),
      };
    })()`);

    fs.writeFileSync(output, JSON.stringify({
      navegador: version.Browser,
      setores,
      emailAntesDoEnvio: antesDoEnvio,
      depoisDoEnvio,
    }, null, 2));
  } finally {
    ws.close();
  }
}

verify().catch((error) => {
  console.error(error);
  process.exit(1);
});
