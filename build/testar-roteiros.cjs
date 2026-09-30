#!/usr/bin/env node
/* Teste dos roteiros simples (modulos/roteiros/*.cjs): abre cada roteiro no
   site local, preenche a identificação, percorre todos os itens pelo botão →,
   responde cada pergunta (alternando Cumpre / Não cumpre / Não se aplica),
   marca as infrações sugeridas, confere a prévia e baixa o Word. Falha em erro
   de JavaScript, item que não abre, pergunta sem resposta, Word inválido ou
   irregularidade que não chega ao relatório. Com --fotos, grava capturas. */
'use strict';
const path = require('node:path'), fs = require('node:fs'), http = require('node:http');
const {execSync} = require('node:child_process');
const pw = require(execSync('npm root -g').toString().trim() + '/playwright');
const RAIZ = path.resolve(__dirname, '..'), OUT = path.join(__dirname, 'capturas'), FOTOS = process.argv.includes('--fotos');
const CAT = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalogo.json'), 'utf8'));
const ROTS = fs.readdirSync(path.join(RAIZ, 'modulos', 'roteiros')).filter(f => f.endsWith('.cjs')).map(f => require(path.join(RAIZ, 'modulos', 'roteiros', f)));
const TIPOS = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png'};
const srv = http.createServer((q, r) => { const u = decodeURIComponent(new URL(q.url, 'http://x').pathname); const f = path.join(RAIZ, u.replace('/medicamentos/', '') || 'index.html');
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, {'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream'}); r.end(d); }); });

(async () => {
  await new Promise(ok => srv.listen(0, ok));
  fs.mkdirSync(OUT, {recursive: true});
  const b = await pw.chromium.launch();
  let falhas = 0; const falha = m => { falhas++; console.error('FALHA: ' + m); };
  for (const d of ROTS) {
    const nuc = CAT.nucleos.find(n => n.roteiros.some(r => r[2] === d.app));
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: FOTOS ? 2 : 1, acceptDownloads: true});
    const p = await ctx.newPage(), erros = [];
    p.on('pageerror', e => erros.push(e.message));
    await p.goto(`http://localhost:${srv.address().port}/medicamentos/`); await p.waitForTimeout(700);
    await p.evaluate(a => { localStorage.removeItem(a[3]); window.__cascaAbrirRoteiro(a[0], a[1], a[2]); }, [nuc.id, d.app, d.titulo, d.store]); await p.waitForTimeout(2500);
    const f = p.frames().find(x => x !== p.mainFrame());
    /* identificação: todos os campos de texto, 1ª opção dos checks e “sim” nos selects */
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'ident', item: null}));
    const itensIdent = d.secoes[0].itens.map(i => i.id);
    for (const it of itensIdent) {
      await f.evaluate(id => UvisPadrao.vai({aba: 'roteiro', secao: 'ident', item: id}), it); await p.waitForTimeout(150);
      await f.evaluate(() => {
        document.querySelectorAll('input[data-rs-meta]').forEach(i => { i.value = i.type === 'date' ? '2026-09-30' : (i.dataset.rsMeta === 'cnpj' ? '12345678000190' : 'Teste ' + i.dataset.rsMeta); i.dispatchEvent(new Event('input', {bubbles: true})); });
        document.querySelectorAll('textarea[data-rs-meta]').forEach(i => { i.value = 'Texto de teste'; i.dispatchEvent(new Event('input', {bubbles: true})); });
        const vistos = new Set(); document.querySelectorAll('[data-rs-check]').forEach(c => { if (!vistos.has(c.dataset.rsCheck)) { vistos.add(c.dataset.rsCheck); c.click(); } });
      });
      for (const nome of await f.$$eval('select[data-rs-meta]', xs => xs.map(x => x.dataset.rsMeta))) { await f.selectOption(`select[data-rs-meta="${nome}"]`, 'sim').catch(() => {}); await p.waitForTimeout(100); }
    }
    /* percorre todos os itens pelo → e responde */
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: null, item: null}));
    let passos = 0, k = 0, visitados = new Set();
    while (passos++ < 200) {
      await f.click('[data-pu-nav="prox"]'); await p.waitForTimeout(120);
      const n = await f.evaluate(() => UvisPadrao.estado());
      if (!n.item) continue;
      const chave = n.secao + '/' + n.item; if (visitados.has(chave)) break; visitados.add(chave);
      const qs = await f.$$eval('[data-rs-q]', xs => xs.map(x => x.dataset.rsQ));
      for (const q of qs) {
        const op = ['c', 'nc', 'na'][k++ % 3];
        const sel = `[data-rs-r="${q}|${op}"]`;
        if (await f.$(sel)) await f.click(sel); else await f.click(`[data-rs-r="${q}|c"]`);
        await p.waitForTimeout(40);
        if (op === 'nc' && await f.$(`[data-rs-sit="${q}"]`)) await f.fill(`[data-rs-sit="${q}"]`, 'constatado na inspeção');
      }
      const ok = await f.evaluate(() => !document.querySelector('.pu-erro'));
      if (!ok) falha(`${d.app}: item ${chave} não abriu`);
      if (await f.evaluate(() => { const n = UvisPadrao.estado(), L = UvisPadrao.lista(); const u = L[L.length - 1]; return n.secao === u.id && n.item === u.itens[u.itens.length - 1].id; })) break;
    }
    const totalItens = d.secoes.reduce((a, s) => a + s.itens.length, 0);
    if (visitados.size !== totalItens) falha(`${d.app}: visitou ${visitados.size} de ${totalItens} itens`);
    /* estado */
    const st = await f.evaluate(k => JSON.parse(localStorage.getItem(k)), d.store);
    const nperg = d.secoes.reduce((a, s) => a + s.itens.reduce((b2, i) => b2 + (i.perguntas || []).length, 0), 0);
    const nresp = Object.keys(st.r).length;
    if (nresp !== nperg) { const todas = d.secoes.flatMap(s => s.itens.flatMap(i => (i.perguntas || []).map(q => q.id))); falha(`${d.app}: ${nresp} de ${nperg} perguntas respondidas; faltam ${todas.filter(q => !st.r[q]).join(', ')}`); }
    const nnc = Object.values(st.r).filter(v => v === 'nc').length;
    /* infrações e relatório */
    await f.click('[data-pu-aba="infracoes"]'); await p.waitForTimeout(300);
    if (await f.$('[data-rs-sugeridas]')) await f.click('[data-rs-sugeridas]');
    await p.waitForTimeout(200);
    if (FOTOS) await p.screenshot({path: path.join(OUT, `${d.app}-infracoes.png`)});
    await f.click('[data-pu-aba="relatorio"]'); await p.waitForTimeout(400);
    const irrPrevia = await f.evaluate(() => { const r = document.querySelector('.rs-relatorio'); const t = r ? r.innerText : ''; const i = t.indexOf('IRREGULARIDADES OBSERVADAS'); return (t.slice(i).match(/\n\d+\. /g) || []).length; });
    if (irrPrevia !== nnc) falha(`${d.app}: ${nnc} "Não cumpre" mas ${irrPrevia} irregularidades na prévia`);
    if (FOTOS) await p.screenshot({path: path.join(OUT, `${d.app}-relatorio.png`), fullPage: true});
    const [dl] = await Promise.all([p.waitForEvent('download'), f.click('[data-rs-word]')]);
    const arq = path.join(OUT, dl.suggestedFilename()); await dl.saveAs(arq);
    try { execSync(`python3 -c "import docx,sys;d=docx.Document(sys.argv[1]);print(len(d.paragraphs))" "${arq}"`); } catch (e) { falha(`${d.app}: Word inválido`); }
    for (const e of erros) falha(`${d.app}: erro JS ${e}`);
    console.log(`${d.app}: ${visitados.size} itens, ${nresp}/${nperg} respostas, ${nnc} irregularidades, Word ${fs.statSync(arq).size} bytes`);
    await ctx.close();
  }
  await b.close(); srv.close();
  console.log(falhas ? `${falhas} falha(s)` : 'TUDO OK');
  process.exitCode = falhas ? 1 : 0;
})();
