const fs = require('fs');

const cases = [
  {
    caso: 'escola',
    url: 'http://127.0.0.1:9000/escola/6',
    pronto: "document.body.innerText.includes('Ver turmas')",
  },
  {
    caso: 'setor',
    url: 'http://127.0.0.1:9000/setor/1',
    pronto: "document.body.innerText.includes('Adicionar Escola')",
  },
  {
    caso: 'turmas',
    url: 'http://127.0.0.1:9000/escola/6/classes',
    pronto: "document.body.innerText.includes('Adicionar Turma')",
  },
];

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
        // A navegação ainda pode estar sem documento.
      }
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    throw new Error(`Estado ausente: ${expression}`);
  }

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

    const results = [];
    for (const item of cases) {
      await send('Page.navigate', { url: item.url });
      await waitFor(item.pronto);
      const icones = await evaluate(`(() => Array.from(document.querySelectorAll('a, button')).map((node) => {
        const svg = node.querySelector('svg');
        if (!svg) return null;
        return {
          texto: (node.innerText || '').trim().replace(/\\s+/g, ' '),
          ariaHidden: svg.getAttribute('aria-hidden'),
          focusable: svg.getAttribute('focusable'),
        };
      }).filter(Boolean))()`);
      results.push({ caso: item.caso, url: item.url, icones });
    }
    fs.writeFileSync(output, JSON.stringify({ navegador: version.Browser, casos: results }, null, 2));
  } finally {
    ws.close();
  }
}

verify().catch((error) => {
  console.error(error);
  process.exit(1);
});
