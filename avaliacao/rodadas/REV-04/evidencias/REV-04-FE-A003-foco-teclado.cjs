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
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    throw new Error(`Estado ausente: ${expression}`);
  }
  async function tab () {
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9,
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9,
    });
  }
  async function enter () {
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r',
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13,
    });
  }
  const ring = `(() => {
    const el = document.activeElement;
    const h1 = document.querySelector('main h1');
    const floater = document.querySelector('.floating-focus');
    const fr = floater ? floater.getBoundingClientRect() : null;
    const hr = h1 ? h1.getBoundingClientRect() : null;
    const overlap = !!(fr && hr && fr.width > 0 && fr.height > 0 && !(fr.right < hr.left || fr.left > hr.right || fr.bottom < hr.top || fr.top > hr.bottom));
    return {
      url: location.pathname,
      tag: el.tagName,
      href: el.getAttribute && el.getAttribute('href'),
      texto: (el.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 80),
      bodyEnabled: document.body.classList.contains('floating-focus-enabled'),
      floater: floater ? String(floater.className) : '',
      overlap,
      h1Top: hr ? Math.round(hr.top) : null,
      navBottom: document.querySelector('nav') ? Math.round(document.querySelector('nav').getBoundingClientRect().bottom) : null,
    };
  })()`;

  try {
    const discovered = await send('Target.getTargets', {}, null);
    const page = discovered.targetInfos.find((target) => target.type === 'page');
    const attached = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true }, null);
    const attachDeadline = Date.now() + 5000;
    while (!attachedParams && Date.now() < attachDeadline) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    sessionId = (attachedParams && attachedParams.sessionId) || attached.sessionId;
    await send('Runtime.runIfWaitingForDebugger');
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    await send('Page.navigate', { url: 'http://127.0.0.1:9000/' });
    await waitFor("Array.from(document.querySelectorAll('a[href^=\"/setor/\"]')).length > 0");
    let noLink = null;
    for (let step = 0; step < 12; step += 1) {
      await tab();
      await new Promise((resolve) => setTimeout(resolve, 80));
      noLink = await evaluate(ring);
      if (noLink.tag === 'A' && noLink.href && noLink.href.startsWith('/setor/')) break;
    }
    if (!noLink || noLink.tag !== 'A' || !String(noLink.href).startsWith('/setor/')) {
      throw new Error(`Link de setor nao alcancado: ${JSON.stringify(noLink)}`);
    }
    await enter();
    await waitFor("document.querySelector('main h1') && document.querySelector('main h1').innerText.includes('Setor:')");
    await new Promise((resolve) => setTimeout(resolve, 400));
    const setor = await evaluate(ring);
    await tab();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const tabSeguinte = await evaluate(ring);
    const casos = { linkAntesDoEnter: noLink, setorDepoisDoEnter: setor, tabSeguinte };
    fs.writeFileSync(output, JSON.stringify({ navegador: version.Browser, casos }, null, 2));
    if (setor.tag !== 'H1' || setor.h1Top < setor.navBottom) {
      throw new Error(`Titulo sem foco ou coberto: ${JSON.stringify(casos)}`);
    }
    if (tabSeguinte.tag !== 'A' || tabSeguinte.texto.includes('Ir para o conteúdo principal') || !tabSeguinte.bodyEnabled) {
      throw new Error(`Tab seguinte fora do conteudo: ${JSON.stringify(casos)}`);
    }
  } finally {
    ws.close();
  }
}

verify().catch((error) => {
  console.error(error);
  process.exit(1);
});
