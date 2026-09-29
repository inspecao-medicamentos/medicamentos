#!/usr/bin/env node
/* Abre o site num servidor local em /medicamentos/, entra em cada card e em
   cada roteiro, e falha se houver erro de JavaScript, módulo que não abre ou
   rolagem horizontal. Com --fotos, grava capturas em build/capturas/. */
'use strict';
const path = require('node:path'), fs = require('node:fs'), http = require('node:http');
const {execSync} = require('node:child_process');
const pw = require(execSync('npm root -g').toString().trim() + '/playwright');
const RAIZ = path.resolve(__dirname, '..');
const CAT = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalogo.json'), 'utf8'));
const FOTOS = process.argv.includes('--fotos');
const OUT = path.join(__dirname, 'capturas');
const TIPOS = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json'};

const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(new URL(q.url, 'http://x').pathname);
  if (!u.startsWith('/medicamentos/')) { r.writeHead(404); return r.end(); }
  const f = path.join(RAIZ, u.slice('/medicamentos/'.length) || 'index.html');
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, {'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream'}); r.end(d); });
});

(async () => {
  await new Promise(ok => srv.listen(0, ok));
  const URL0 = `http://localhost:${srv.address().port}/medicamentos/`;
  if (FOTOS) fs.mkdirSync(OUT, {recursive: true});
  const b = await pw.chromium.launch();
  let falhas = 0;
  const falha = m => { falhas++; console.error('FALHA: ' + m); };
  for (const [nome, vp] of [['celular', {width: 390, height: 844}], ['tablet', {width: 800, height: 1280}], ['pc', {width: 1366, height: 900}]]) {
    const p = await b.newPage({viewport: vp, deviceScaleFactor: FOTOS ? 2 : 1});
    const erros = [];
    p.on('pageerror', e => { erros.push(String(e.message).slice(0, 200)); if (process.env.DEPURA) console.log('  erro:', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')); });
    await p.goto(URL0); await p.waitForTimeout(900);
    const larg = () => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (await larg() > 0) falha(`${nome}: rolagem horizontal na tela inicial`);
    const nCards = await p.locator('.med-card').count();
    if (nCards !== CAT.nucleos.length) falha(`${nome}: ${nCards} cards`);
    if (FOTOS) await p.screenshot({path: path.join(OUT, `inicio-${nome}.png`), fullPage: true});
    for (const n of CAT.nucleos) {
      await p.locator(`.med-card[data-nucleo="${n.id}"]`).click(); await p.waitForTimeout(500);
      if (n.roteiros.length > 1) {
        const itens = await p.locator('#tela-lista.on .rot-card').allInnerTexts();
        if (itens.length !== n.roteiros.length) falha(`${nome}/${n.id}: lista com ${itens.length}`);
        if (FOTOS && nome !== 'pc') await p.screenshot({path: path.join(OUT, `lista-${n.var.slice(4)}-${nome}.png`)});
      }
      for (let i = 0; i < n.roteiros.length; i++) {
        const r = n.roteiros[i];
        if (n.roteiros.length > 1) { await p.locator('#tela-lista.on .rot-card').nth(i).click(); }
        await p.waitForTimeout(r[2].startsWith('farmacia') || r[2] === 'drogaria' || r[2].startsWith('distrib') ? 5000 : 1500);
        const aberto = await p.evaluate(() => document.getElementById('tela-app').classList.contains('on') && document.getElementById('casca-carga').classList.contains('off'));
        const f = p.frames().find(x => x !== p.mainFrame());
        const txt = f ? await f.evaluate(() => document.body.innerText.length).catch(() => 0) : 0;
        if (!aberto || txt < 100) falha(`${nome}/${r[0]}: módulo não abriu (texto ${txt})`);
        const tom = f ? await f.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--uvis-tone').trim()).catch(() => '') : '';
        console.log(`${nome.padEnd(8)} ${n.id} › ${r[0]}: ${aberto ? 'abriu' : 'NÃO abriu'} · tom ${tom || '—'}`);
        if (FOTOS && nome === 'tablet') await p.screenshot({path: path.join(OUT, `roteiro-${r[2]}${r[3] ? '-sm' : ''}-${nome}.png`)});
        await p.evaluate(() => window.__cascaVoltarDireto()); await p.waitForTimeout(400);
      }
      await p.evaluate(() => document.querySelector('#tela-lista [data-home]')?.click()); await p.waitForTimeout(300);
    }
    await p.locator('#abrir-consultas').click(); await p.waitForTimeout(3000);
    const central = p.frames().find(x => x !== p.mainFrame());
    if (!central || (await central.evaluate(() => document.body.innerText.length)) < 100) falha(`${nome}: Central não abriu`);
    else console.log(`${nome.padEnd(8)} Central de Consultas: abriu`);
    for (const e of erros) falha(`${nome}: erro JS ${e}`);
    await p.close();
  }
  await b.close(); srv.close();
  console.log(falhas ? `${falhas} falha(s)` : 'TUDO OK');
  process.exitCode = falhas ? 1 : 0;
})();
