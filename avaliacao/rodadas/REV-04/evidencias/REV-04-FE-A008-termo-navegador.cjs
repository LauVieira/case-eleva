const fs = require('fs');

const cases = [
  {
    caso: 'detalhe',
    url: 'http://127.0.0.1:9000/turma/8',
    pronto: "Array.from(document.querySelectorAll('dt')).some((item) => /Capacidade|Limite de alunos/.test(item.innerText))",
  },
  {
    caso: 'cadastro',
    url: 'http://127.0.0.1:9000/escola/6/classes/nova',
    pronto: "Array.from(document.querySelectorAll('label')).some((item) => /Capacidade|Limite de alunos/.test(item.innerText))",
  },
  {
    caso: 'edicao',
    url: 'http://127.0.0.1:9000/turma/8/editar',
    pronto: "Array.from(document.querySelectorAll('label')).some((item) => /Capacidade|Limite de alunos/.test(item.innerText))",
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
      const leitura = await evaluate(`(() => {
        const rotulos = Array.from(document.querySelectorAll('dt, label, .card-text, p'))
          .map((node) => (node.innerText || '').trim().replace(/\\s+/g, ' '))
          .filter((text) => /Capacidade|Limite de alunos/.test(text));
        return { url: location.pathname, rotulos };
      })()`);
      results.push({ caso: item.caso, ...leitura });
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
