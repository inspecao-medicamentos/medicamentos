#!/usr/bin/env node
/* Teste de preenchimento: em cada roteiro, percorre todas as telas, marca
   “Não cumpre” na primeira pergunta de cada item (para abrir a situação
   encontrada) e preenche cada campo de texto visível com um código único
   (Zq0001…), número, data, CNPJ ou CPF válidos. Depois confere, código a
   código, se o conteúdo aparece na prévia do relatório e no Word baixado.
   Lista os campos que não chegam a nenhum dos dois — nem todo campo é feito
   para o relatório (buscas, anotações internas), então a lista é para revisão.
   Uso: node build/testar-preenchimento.cjs [app ...]   (padrão: todos)
   Resultado detalhado em build/capturas/preenchimento-<app>.json. */
'use strict';
const path = require('node:path'), fs = require('node:fs'), http = require('node:http');
const {execSync} = require('node:child_process');
const pw = require(execSync('npm root -g').toString().trim() + '/playwright');
const RAIZ = path.resolve(__dirname, '..'), OUT = path.join(__dirname, 'capturas');
const TIPOS = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png'};
const srv = http.createServer((q, r) => { const u = decodeURIComponent(new URL(q.url, 'http://x').pathname); const f = path.join(RAIZ, u.replace('/medicamentos/', '') || 'index.html');
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, {'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream'}); r.end(d); }); });

/* preenche os campos visíveis ainda vazios; devolve [{tok, rotulo}] */
const PREENCHE = () => {
  const vis = e => e.checkVisibility && e.checkVisibility();
  const rot = e => { const l = e.closest('label'); let t = l ? l.innerText : ''; if (!t && e.id) { const x = document.querySelector('label[for="' + e.id + '"]'); if (x) t = x.innerText; }
    if (!t) { let p = e.previousElementSibling; while (p && !t) { t = p.innerText || ''; p = p.previousElementSibling; } }
    return (t || e.placeholder || e.name || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 90); };
  const out = [], tentados = new Set();
  const chave = e => e.tagName + [...e.attributes].filter(a => a.name !== 'value' && a.name !== 'style' && a.name !== 'class').map(a => a.name + '=' + a.value).join('&') + '|' + rot(e);
  const elegivel = e => vis(e) && !e.closest('#cmp-painel,#cmp-modal,dialog:not([open])') && !e.readOnly && !e.disabled && !e.value
    && /^(text|number|date|email|tel|)$/i.test(e.tagName === 'TEXTAREA' ? '' : (e.getAttribute('type') || 'text'))
    && !/busca|pesquis|search|ocr|filtro|rawText|^q$/i.test((e.id || '') + ' ' + (e.name || '') + ' ' + (e.placeholder || ''));
  /* um campo por vez, buscando de novo a cada passo: os roteiros redesenham a tela ao salvar */
  for (let guarda = 0; guarda < 300; guarda++) {
    const e = [...document.querySelectorAll('input,textarea')].find(x => elegivel(x) && !tentados.has(chave(x)));
    if (!e) break;
    tentados.add(chave(e));
    const n = (window.__zq = (window.__zq || 0) + 1), r = rot(e), tipo = (e.getAttribute('type') || 'text').toLowerCase();
    let v, tok;
    if (tipo === 'date') { v = '2026-09-' + String(10 + n % 18).padStart(2, '0'); tok = v.split('-').reverse().join('/'); }
    else if (tipo === 'number') { v = String(700 + n); tok = v; }
    else if (/cnpj/i.test(r)) { v = '11.222.333/0001-81'; tok = '11.222.333/0001-81'; }
    else if (/\bcpf\b/i.test(r)) { v = '529.982.247-25'; tok = '529.982.247-25'; }
    else if (tipo === 'email' || /e-?mail/i.test(r)) { v = 'zq' + n + '@teste.sp.gov.br'; tok = v; }
    else if (tipo === 'tel' || /telefone|fone/i.test(r)) { v = '(11) 3333-' + String(1000 + n); tok = String(1000 + n); }
    else { tok = 'Zq' + String(n).padStart(4, '0'); v = tok + ' ' + (e.tagName === 'TEXTAREA' ? 'texto de teste da inspeção' : 'Teste'); }
    e.focus(); e.value = v; e.dispatchEvent(new Event('input', {bubbles: true})); e.dispatchEvent(new Event('change', {bubbles: true})); e.blur();
    out.push({tok, rotulo: r, tipo, repetido: /^\d{2}\/\d{2}\/\d{4}$|11\.222|529\.982/.test(tok)});
  }
  return out;
};

/* motores: telas(f) → lista de funções que abrem cada tela; relatorio(f,p) → texto da prévia; word(f,p) → download */
const clicaTxt = (f, sel, txt) => f.evaluate(([s, t]) => { const b = [...document.querySelectorAll(s)].find(x => (!t || x.textContent.includes(t)) && x.checkVisibility()); if (b) b.click(); return !!b; }, [sel, txt || '']);
const MOTORES = {
  rs: {
    telas: async f => (await f.evaluate(() => ROTEIRO.secoes.flatMap(s => s.itens.map(i => [s.id, i.id])))).map(([s, i]) => async () => f.evaluate(([a, b]) => UvisPadrao.vai({aba: 'roteiro', secao: a, item: b}), [s, i])),
    relatorio: async (f, p) => { await f.click('[data-pu-aba="relatorio"]'); await p.waitForTimeout(800); return f.evaluate(() => (document.querySelector('.rs-relatorio') || document.body).innerText); },
    word: async (f, p) => { const [dl] = await Promise.all([p.waitForEvent('download', {timeout: 20000}), f.click('[data-rs-word]')]); return dl; }
  },
  drogaria: {
    telas: async f => { const out = []; const secs = await f.evaluate(() => [...document.querySelectorAll('button[data-card]')].filter(b => /SEÇÃO/i.test(b.textContent)).map(b => b.dataset.card));
      for (const c of secs) { out.push(async () => { await f.evaluate(k => { const b = [...document.querySelectorAll('button[data-card="' + k + '"]')].find(x => x.checkVisibility()); if (b) b.click(); }, c); });
        out.push({lazy: async () => { const its = await f.evaluate(() => [...document.querySelectorAll('[data-drg-item]')].map(b => b.dataset.drgItem)); return its.map(i => async () => { await f.evaluate(k => { const b = [...document.querySelectorAll('button[data-card="' + k[0] + '"]')].find(x => x.checkVisibility()); if (b) b.click(); }, [c]); await f.waitForTimeout(250); await f.evaluate(x => { const b = document.querySelector('[data-drg-item="' + x + '"]'); if (b) b.click(); }, i); }); }}); }
      return out; },
    relatorio: async (f, p) => { await clicaTxt(f, 'button', 'Relatório'); await p.waitForTimeout(800); await clicaTxt(f, 'button', 'Atualizar prévia'); await p.waitForTimeout(1500);
      return f.evaluate(() => JSON.stringify(DrogariaAPI.report()) + '\n' + document.body.innerText); },
    word: async (f, p) => { const [dl] = await Promise.all([p.waitForEvent('download', {timeout: 30000}), clicaTxt(f, 'button', 'Baixar Word')]); return dl; }
  },
  manip: {
    telas: async f => { const out = []; const cards = await f.evaluate(() => [...document.querySelectorAll('[data-open-card]')].map(b => b.dataset.openCard));
      for (const c of cards) out.push({lazy: async () => { await f.evaluate(k => { const b = [...document.querySelectorAll('[data-nav-card="' + k + '"],[data-open-card="' + k + '"]')].find(x => x.checkVisibility()); if (b) b.click(); }, c); await f.waitForTimeout(400);
        const its = await f.evaluate(() => [...document.querySelectorAll('[data-man-item]')].filter(b => b.checkVisibility()).map(b => b.dataset.manItem));
        return its.map(i => async () => { await f.evaluate(([k, x]) => { const n = [...document.querySelectorAll('[data-nav-card="' + k + '"],[data-open-card="' + k + '"]')].find(y => y.checkVisibility()); if (n) n.click(); const b = [...document.querySelectorAll('[data-man-item="' + x + '"]')].find(y => y.checkVisibility()); if (b) b.click(); }, [c, i]); }); }});
      return out; },
    relatorio: async (f, p) => { await f.click('[data-tab="relatorio"]'); await p.waitForTimeout(1500); return f.evaluate(() => (document.getElementById('reportPreview') || document.body).innerText); },
    word: async (f, p) => { const [dl] = await Promise.all([p.waitForEvent('download', {timeout: 30000}), clicaTxt(f, 'button', 'Baixar relatório para Word')]); return dl; }
  },
  dist: {
    telas: async f => { const out = []; const cards = await f.evaluate(() => [...document.querySelectorAll('[data-dist-card]')].map(b => b.dataset.distCard));
      for (const c of cards) out.push({lazy: async () => { await f.evaluate(k => { const b = [...document.querySelectorAll('[data-dist-card="' + k + '"]')].find(x => x.checkVisibility()); if (b) b.click(); }, c); await f.waitForTimeout(400);
        const ss = await f.evaluate(() => [...document.querySelectorAll('[data-dist-section]')].map(b => b.dataset.distSection));
        return ss.map(x => async () => { await f.evaluate(([k, y]) => { const n = [...document.querySelectorAll('[data-dist-card="' + k + '"]')].find(z => z.checkVisibility()); if (n) n.click(); const b = document.querySelector('[data-dist-section="' + y + '"]'); if (b) b.click(); }, [c, x]); }); }});
      /* Relatório › Anexo I: campos próprios do modelo */
      out.push(async () => { await f.evaluate(() => { const b = document.querySelector('[data-dnav="relatorio"]'); if (b) b.click(); }); });
      return out; },
    relatorio: async f => f.evaluate(() => reportText()),
    word: async (f, p) => { await f.evaluate(() => { const b = document.querySelector('[data-dnav="relatorio"]'); if (b) b.click(); }); await p.waitForTimeout(600);
      const [dl] = await Promise.all([p.waitForEvent('download', {timeout: 30000}), clicaTxt(f, 'button', 'Baixar prévia (.docx)')]); return dl; }
  }
};
const CASOS = [['Drogaria', 'drogaria', 'drogaria'], ['Manipulação', 'farmacia-manipulacao', 'manip'], ['Atacadista de medicamentos', 'distribuidoras-transportadoras', 'dist'], ['Drogaria', 'vacina', 'rs']];

(async () => {
  const so = process.argv.slice(2);
  await new Promise(ok => srv.listen(0, ok)); fs.mkdirSync(OUT, {recursive: true});
  const b = await pw.chromium.launch();
  let resumo = [];
  for (const [nuc, app, m] of CASOS.filter(c => !so.length || so.includes(c[1]))) {
    const ctx = await b.newContext({viewport: {width: 800, height: 1280}, acceptDownloads: true});
    const p = await ctx.newPage(), erros = [];
    p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept());
    await p.goto(`http://localhost:${srv.address().port}/medicamentos/`); await p.waitForTimeout(700);
    await p.evaluate(a => window.__cascaAbrirRoteiro(a[0], a[1], 'x'), [nuc, app]); await p.waitForTimeout(5000);
    const f = p.frames().find(x => x !== p.mainFrame()), M = MOTORES[m];
    /* manipulação: marca estéreis na caracterização para abrir o bloco 13 */
    if (m === 'manip') { await f.evaluate(() => { const b = document.querySelector('[data-open-card="1"]'); if (b) b.click(); }); await p.waitForTimeout(400); await f.evaluate(() => { const b = document.querySelector('[data-man-item="i1.2"]'); if (b) b.click(); }); await p.waitForTimeout(500);
      await f.evaluate(() => document.querySelectorAll('.checks input[type=checkbox]').forEach(c => { if (!c.checked) c.click(); })); await p.waitForTimeout(600); }
    const preenchidos = [];
    const visita = async abre => { await abre(); await p.waitForTimeout(450);
      await f.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => (x.textContent.trim() === 'Não cumpre' || /\|nc$/.test(x.dataset.rsR || '')) && x.checkVisibility() && x.getAttribute('aria-pressed') !== 'true'); if (b) b.click(); document.querySelectorAll('details').forEach(d => { if (!d.closest('#cmp-painel') && !d.classList.contains('uvs-previa')) d.open = true; }); });
      await p.waitForTimeout(350);
      for (let k = 0; k < 3; k++) { const l = await f.evaluate(PREENCHE); preenchidos.push(...l); if (!l.length) break; await p.waitForTimeout(300); } };
    for (const t of await M.telas(f)) { if (typeof t === 'function') await visita(t); else for (const u of await t.lazy()) await visita(u); }
    await p.waitForTimeout(1500);
    const previa = await M.relatorio(f, p);
    let word = '';
    /* aviso de conferência ao emitir (modulos/campo.js): o teste confirma “Emitir mesmo assim” */
    await f.evaluate(() => { window.__avisoEmissao = ''; new MutationObserver(() => { const m = document.getElementById('cmp-modal'); const b = m && m.querySelector('[data-m="emite"]'); if (b) { window.__avisoEmissao = m.querySelector('b').textContent; b.click(); } }).observe(document.body, {childList: true, subtree: true}); });
    let semWord = false;
    try { const dl = await M.word(f, p); const arq = path.join(OUT, `preench-${app}.docx`); await dl.saveAs(arq);
      word = execSync(`python3 -c "import docx,sys;d=docx.Document(sys.argv[1]);print('\\n'.join([p.text for p in d.paragraphs]+[c.text for t in d.tables for r in t.rows for c in r.cells]))" "${arq}"`, {maxBuffer: 64 << 20}).toString(); }
    catch (e) { word = ''; semWord = true; console.log(`  ${app}: Word não baixado (${String(e.message).split('\n')[0]})`); }
    const unicos = preenchidos.filter(x => !x.repetido);
    const lower = s => s.toLowerCase();
    const res = unicos.map(x => ({...x, previa: lower(previa).includes(lower(x.tok)), word: lower(word).includes(lower(x.tok))}));
    const fora = res.filter(x => !x.previa && !x.word), soPrevia = res.filter(x => x.previa && !x.word && word), soWord = res.filter(x => !x.previa && x.word);
    fs.writeFileSync(path.join(OUT, `preenchimento-${app}.json`), JSON.stringify({app, total: unicos.length, fora, soPrevia, soWord, erros}, null, 1));
    console.log(`${app}: ${unicos.length} campos únicos preenchidos · na prévia ${res.filter(x => x.previa).length} · no Word ${res.filter(x => x.word).length} · fora dos dois ${fora.length} · só na prévia ${soPrevia.length} · só no Word ${soWord.length} · erros JS ${erros.length}`);
    resumo.push({app, fora: fora.map(x => x.rotulo), soPrevia: soPrevia.map(x => x.rotulo), soWord: soWord.map(x => x.rotulo), semWord, erros});
    await ctx.close();
  }
  await b.close(); srv.close();
  fs.writeFileSync(path.join(OUT, 'preenchimento-resumo.json'), JSON.stringify(resumo, null, 1));
  /* falha (código 1) se algum dado digitado não chegou à prévia ou ao Word, ou se houve erro JS */
  const ruins = resumo.filter(r => r.semWord || r.erros.length || r.fora.length || r.soPrevia.length || r.soWord.length);
  console.log(ruins.length ? 'FALHA em: ' + ruins.map(r => r.app).join(', ') : 'TUDO OK');
  process.exitCode = ruins.length ? 1 : 0;
})();
