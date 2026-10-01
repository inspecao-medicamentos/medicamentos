#!/usr/bin/env node
/* Teste de relatório (inspeção completa): em cada roteiro, percorre todas as
   telas, RESPONDE TODAS AS PERGUNTAS em rodízio (Cumpre, Não cumpre, Não se
   aplica — como numa inspeção real) e preenche cada campo de texto visível com um código único
   (Zq0001…), número, data, CNPJ ou CPF válidos. Depois confere, código a
   código, se o conteúdo aparece na prévia do relatório e no Word baixado.
   Lista os campos que não chegam a nenhum dos dois — nem todo campo é feito
   para o relatório (buscas, anotações internas), então a lista é para revisão.
   Uso: node build/testar-relatorio.cjs [app ...]   (padrão: todos)
   Resultado detalhado em build/capturas/relatorio-<app>.json. */
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
    out.push({tok, rotulo: r, tipo, attrs: [...e.attributes].filter(a => /^(data-|id$|name$)/.test(a.name)).map(a => a.name + '=' + a.value).join(' ').slice(0, 160), repetido: /^\d{2}\/\d{2}\/\d{4}$|11\.222|529\.982/.test(tok)});
  }
  return out;
};

/* responde as perguntas visíveis ainda não respondidas, em rodízio C / NC / NA */
const RESPONDE = () => {
  /* roteiros com Cumpre / Não cumpre e roteiros com Sim / Não (EAC) */
  const R = ['Cumpre', 'Não cumpre', 'Não se aplica', 'Sim', 'Não'], feitos = (window.__resp = window.__resp || new Set());
  const chave = g => g.map(b => [...b.attributes].filter(a => !/^(aria-|class|style)/.test(a.name)).map(a => a.name + '=' + a.value).join('&')).join('|') + '#' + ((g[0].parentElement.parentElement || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  let n = 0;
  for (let guarda = 0; guarda < 500; guarda++) {
    const bs = [...document.querySelectorAll('button')].filter(b => R.includes(b.textContent.trim()) && (!/^(Sim|Não)$/.test(b.textContent.trim()) || b.hasAttribute('data-rs-r')) && b.checkVisibility() && !b.closest('#cmp-painel,#cmp-modal'));
    const grupos = new Map(); bs.forEach(b => { const p = b.parentElement; if (!grupos.has(p)) grupos.set(p, []); grupos.get(p).push(b); });
    const g = [...grupos.values()].find(x => !feitos.has(chave(x)));
    if (!g) break;
    feitos.add(chave(g));
    const k = (window.__rodizio = (window.__rodizio || 0) + 1) % 3, sn = g.some(x => x.textContent.trim() === 'Sim'), quer = (sn ? ['Sim', 'Não', 'Não se aplica'] : ['Cumpre', 'Não cumpre', 'Não se aplica'])[k];
    const b = g.find(x => x.textContent.trim() === quer) || g.find(x => /^Não( cumpre)?$/.test(x.textContent.trim())) || g[0];
    b.click(); n++;
  }
  return n;
};

/* marca caixas e escolhe a última opção das listas; devolve os rótulos (≥ 8 letras) para procurar no relatório */
const MARCA = () => {
  const vis = e => e.checkVisibility && e.checkVisibility(), out = [], feito = (window.__marcados = window.__marcados || new Set());
  const nz = t => String(t || '').replace(/\s+/g, ' ').trim();
  const at = e => [...e.attributes].filter(a => /^(data-|name$|id$|value$)/.test(a.name)).map(a => a.name + '=' + a.value).join(' ');
  for (let g = 0; g < 400; g++) {
    const c = [...document.querySelectorAll('input[type=checkbox]')].find(x => vis(x) && !x.checked && !x.disabled && !x.closest('#cmp-painel,#cmp-modal') && !feito.has(at(x) + '|' + nz((x.closest('label') || {}).textContent)));
    if (!c) break;
    const l = nz((c.closest('label') || {}).textContent || (c.id && (document.querySelector('label[for="' + c.id + '"]') || {}).textContent));
    feito.add(at(c) + '|' + l); c.click();
    if (l.length >= 8) out.push({tok: l.slice(0, 60), rotulo: 'caixa: ' + l.slice(0, 60), tipo: 'checkbox', attrs: at(c).slice(0, 120)});
  }
  for (let g = 0; g < 200; g++) {
    const sel = [...document.querySelectorAll('select')].find(x => vis(x) && !x.disabled && !x.value && !x.closest('#cmp-painel,#cmp-modal') && !feito.has('sel|' + at(x)));
    if (!sel) break; feito.add('sel|' + at(sel));
    const ops = [...sel.options].filter(o => o.value); if (!ops.length) continue;
    const o = ops[ops.length - 1]; sel.value = o.value; sel.dispatchEvent(new Event('input', {bubbles: true})); sel.dispatchEvent(new Event('change', {bubbles: true}));
    const t = nz(o.textContent); if (t.length >= 8) out.push({tok: t.slice(0, 60), rotulo: 'lista: ' + t.slice(0, 60), tipo: 'select', attrs: at(sel).slice(0, 120)});
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
      if (!process.env.SEM_TEXTO_RELATORIO) out.push(async () => { await f.evaluate(() => { const b = document.querySelector('[data-dnav="relatorio"]'); if (b) b.click(); }); });
      return out; },
    relatorio: async f => f.evaluate(() => reportText()),
    word: async (f, p) => { await f.evaluate(() => { const b = document.querySelector('[data-dnav="relatorio"]'); if (b) b.click(); }); await p.waitForTimeout(600);
      const [dl] = await Promise.all([p.waitForEvent('download', {timeout: 30000}), clicaTxt(f, 'button', 'Baixar prévia (.docx)')]); return dl; }
  }
};
const CASOS = [['Drogaria', 'drogaria', 'drogaria'], ['Manipulação', 'farmacia-manipulacao', 'manip'], ['Atacadista de medicamentos', 'distribuidoras-transportadoras', 'dist'], ['Drogaria', 'vacina', 'rs'], ['Drogaria', 'eac', 'rs'], ['Atacadista de medicamentos', 'gases-medicinais', 'rs']];

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
    /* roteiros simples: todas as atividades e modalidades marcadas, para abrir as perguntas condicionais */
    if (m === 'rs') for (const it of await f.evaluate(() => ROTEIRO.secoes[0].itens.map(i => i.id))) {
      await f.evaluate(i => UvisPadrao.vai({aba: 'roteiro', secao: ROTEIRO.secoes[0].id, item: i}), it); await p.waitForTimeout(300);
      await f.evaluate(() => { document.querySelectorAll('[data-rs-check]').forEach(c => { if (!c.checked) c.click(); });
        document.querySelectorAll('select[data-rs-meta]').forEach(s => { const o = [...s.options].find(x => x.value === 'sim'); if (o) { s.value = 'sim'; s.dispatchEvent(new Event('change', {bubbles: true})); } }); });
      await p.waitForTimeout(300); }
    const preenchidos = [], escolhas = []; let respostas = 0;
    const visita = async abre => { await abre(); await p.waitForTimeout(450);
      const abreTudo = () => f.evaluate(() => { document.querySelectorAll('details').forEach(d => { if (!d.closest('#cmp-painel') && !d.classList.contains('uvs-previa')) d.open = true; }); });
      await abreTudo(); await p.waitForTimeout(200);
      for (let k = 0; k < 4; k++) { await abreTudo(); const n = await f.evaluate(RESPONDE); respostas += n; if (!n) break; await p.waitForTimeout(250); }
      await f.evaluate(() => { document.querySelectorAll('details').forEach(d => { if (!d.closest('#cmp-painel') && !d.classList.contains('uvs-previa')) d.open = true; }); });
      await p.waitForTimeout(350);
      if (process.env.ESCOLHAS) for (let k = 0; k < 2; k++) { const l = await f.evaluate(MARCA); escolhas.push(...l); if (!l.length) break; await p.waitForTimeout(300); }
      for (let k = 0; k < 3; k++) { const l = await f.evaluate(PREENCHE); preenchidos.push(...l); if (!l.length) break; await p.waitForTimeout(300); } };
    for (const t of await M.telas(f)) { if (typeof t === 'function') await visita(t); else for (const u of await t.lazy()) await visita(u); }
    await p.waitForTimeout(1500);
    const previa = await M.relatorio(f, p);
    let word = '';
    /* aviso de conferência ao emitir (modulos/campo.js): o teste confirma “Emitir mesmo assim” */
    await f.evaluate(() => { window.__avisoEmissao = ''; new MutationObserver(() => { const m = document.getElementById('cmp-modal'); const b = m && m.querySelector('[data-m="emite"]'); if (b) { window.__avisoEmissao = m.querySelector('b').textContent; b.click(); } }).observe(document.body, {childList: true, subtree: true}); });
    let semWord = false;
    try { const dl = await M.word(f, p); const arq = path.join(OUT, `relatorio-${app}.docx`); await dl.saveAs(arq);
      word = execSync(`python3 -c "import docx,sys;d=docx.Document(sys.argv[1]);print('\\n'.join([p.text for p in d.paragraphs]+[c.text for t in d.tables for r in t.rows for c in r.cells]))" "${arq}"`, {maxBuffer: 64 << 20}).toString(); }
    catch (e) { word = ''; semWord = true; console.log(`  ${app}: Word não baixado (${String(e.message).split('\n')[0]})`); }
    const semAc = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
    if (escolhas.length) { const P = semAc(previa), W = semAc(word); const faltam = escolhas.filter(x => !P.includes(semAc(x.tok)) && !W.includes(semAc(x.tok)));
      fs.writeFileSync(path.join(OUT, `escolhas-${app}.json`), JSON.stringify({total: escolhas.length, faltam}, null, 1));
      console.log(`${app}: ${escolhas.length} escolhas (caixas e listas) · fora do relatório ${faltam.length}`); }
    const unicos = preenchidos.filter(x => !x.repetido);
    const lower = s => s.toLowerCase();
    const res = unicos.map(x => ({...x, previa: lower(previa).includes(lower(x.tok)), word: lower(word).includes(lower(x.tok))}));
    const fora = res.filter(x => !x.previa && !x.word), soPrevia = res.filter(x => x.previa && !x.word && word), soWord = res.filter(x => !x.previa && x.word);
    fs.writeFileSync(path.join(OUT, `relatorio-${app}.json`), JSON.stringify({app, total: unicos.length, fora, soPrevia, soWord, erros}, null, 1));
    console.log(`${app}: ${respostas} respostas · ${unicos.length} campos únicos preenchidos · na prévia ${res.filter(x => x.previa).length} · no Word ${res.filter(x => x.word).length} · fora dos dois ${fora.length} · só na prévia ${soPrevia.length} · só no Word ${soWord.length} · erros JS ${erros.length}`);
    resumo.push({app, fora: fora.map(x => x.rotulo), soPrevia: soPrevia.map(x => x.rotulo), soWord: soWord.map(x => x.rotulo), semWord, erros});
    await ctx.close();
  }
  await b.close(); srv.close();
  fs.writeFileSync(path.join(OUT, 'relatorio-resumo.json'), JSON.stringify(resumo, null, 1));
  /* falha (código 1) se algum dado digitado não chegou à prévia ou ao Word, ou se houve erro JS — no modo ESCOLHAS, campos que só valem com a escolha oposta podem ficar de fora */
  const ruins = resumo.filter(r => r.semWord || r.erros.length || (!process.env.ESCOLHAS && (r.fora.length || r.soPrevia.length || r.soWord.length)));
  console.log(ruins.length ? 'FALHA em: ' + ruins.map(r => r.app).join(', ') : 'TUDO OK');
  process.exitCode = ruins.length ? 1 : 0;
})();
