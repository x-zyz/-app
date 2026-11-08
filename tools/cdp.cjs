// 通过 WebView DevTools 协议在页面里执行 JS
// usage: node tools/cdp.cjs "expression" [--json]
const expr = process.argv[2];
const asJson = process.argv.includes('--json');

async function main() {
  const list = await (await fetch('http://127.0.0.1:9222/json')).json();
  const page = list.find((p) => p.type === 'page' && /index\.html/.test(p.url)) || list[0];
  if (!page) throw new Error('no page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  const send = (method, params) => new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result && r.result.exceptionDetails) {
    console.error('EXCEPTION', JSON.stringify(r.result.exceptionDetails, null, 2));
  } else {
    const v = r.result && r.result.result ? r.result.result.value : r;
    console.log(asJson ? JSON.stringify(v, null, 2) : (typeof v === 'string' ? v : JSON.stringify(v, null, 2)));
  }
  ws.close();
}
main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
