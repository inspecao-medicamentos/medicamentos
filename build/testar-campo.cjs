#!/usr/bin/env node
/* Teste das ferramentas de campo (modulos/campo.js) em um roteiro de cada
   motor: marca pendência e confere que some ao responder; registra achado com
   foto e vincula ao item; monta constatação e insere no campo de texto; salva a
   inspeção (Salvas) e confere que a lista de NCs foi junto; na inspeção nova,
   usa a salva na reinspeção e insere o texto; confere o aviso ao emitir o
   relatório com pendência. Falha em erro de JavaScript. */
'use strict';
const path = require('node:path'), fs = require('node:fs'), http = require('node:http');
const {execSync} = require('node:child_process');
const pw = require(execSync('npm root -g').toString().trim() + '/playwright');
const RAIZ = path.resolve(__dirname, '..');
const TIPOS = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png'};
const srv = http.createServer((q, r) => { const u = decodeURIComponent(new URL(q.url, 'http://x').pathname); const f = path.join(RAIZ, u.replace('/medicamentos/', '') || 'index.html');
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, {'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream'}); r.end(d); }); });
/* PNG 2×2 para a foto do achado */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8DwnwEJMDGgASBgAQBUZwMBpB0zqgAAAABJRU5ErkJggg==', 'base64');

/* [núcleo, app, abre um item com perguntas C/NC/NA, campo de texto do item, título para o botão Relatório/Word] */
const CASOS = [
  ['Drogaria', 'drogaria', async (f, c) => { await c('button[data-card]', 'SEÇÃO 3'); await c('[data-drg-item="bloco-0-SNGPC"]'); }],
  ['Manipulação', 'farmacia-manipulacao', async (f, c) => { await c('[data-open-card="3"]'); await c('[data-man-item="i3.1"]'); }],
  ['Atacadista de medicamentos', 'distribuidoras-transportadoras', async (f, c) => { await c('[data-dist-card="3"]'); await c('[data-dist-section="recebimento"]'); }],
  ['Atacadista de medicamentos', 'transportadora', async (f, c) => { await c('[data-dist-card="3"]'); await c('[data-dist-section="recebimento"]'); }],
  ['Drogaria', 'eac', async f => { await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: ROTEIRO.secoes[1].id, item: ROTEIRO.secoes[1].itens[0].id})); }]
];

(async () => {
  await new Promise(ok => srv.listen(0, ok));
  const b = await pw.chromium.launch();
  let falhas = 0; const falha = m => { falhas++; console.error('FALHA: ' + m); };
  for (const [nuc, app, abreItem] of CASOS) {
    const ctx = await b.newContext({viewport: {width: 800, height: 1280}});
    const p = await ctx.newPage(), erros = [];
    p.on('pageerror', e => erros.push(e.message));
    p.on('dialog', d => d.accept(d.type() === 'prompt' ? 'Teste reinspeção' : undefined));
    await p.goto(`http://localhost:${srv.address().port}/medicamentos/`); await p.waitForTimeout(700);
    const abre = async () => { await p.evaluate(a => window.__cascaAbrirRoteiro(a[0], a[1], 'x'), [nuc, app]); await p.waitForTimeout(4500); return p.frames().find(x => x !== p.mainFrame()); };
    let f = await abre();
    const clica = async (sel, txt) => { await f.evaluate(([s, t]) => { const x = [...document.querySelectorAll(s)].find(e => !t || e.textContent.includes(t)); if (x) x.click(); }, [sel, txt || '']); await p.waitForTimeout(700); };
    const ok = (cond, msg) => { if (!cond) falha(`${app}: ${msg}`); };
    await abreItem(f, clica); await p.waitForTimeout(800);
    /* pendência: marca, confere, responde, some */
    const nBotoes = await f.evaluate(() => document.querySelectorAll('.cmp-pbtn').length);
    ok(nBotoes > 0, 'sem botão Marcar como pendente');
    await f.locator('.cmp-pbtn').nth(0).click(); await p.waitForTimeout(300);
    ok(await f.evaluate(() => MedCampo.pendencias().length) === 1, 'pendência não registrada');
    await f.locator('button:text-is("Não cumpre")').first().click(); await p.waitForTimeout(2500);
    ok(await f.evaluate(() => MedCampo.pendencias().length) === 0, 'pendência não saiu ao responder');
    const ncs = await f.evaluate(() => MedCampo.estado().ncs);
    ok(ncs.length === 1, `lista de NCs com ${ncs.length}`);
    /* achado com foto, vinculado ao item aberto */
    await f.click('#cmp-fab'); await f.click('#cmp-painel [data-aba="achados"]');
    await f.fill('#cmp-painel [data-a="local"]', 'sanitário do mezanino'); await f.fill('#cmp-painel [data-a="txt"]', 'ralo danificado');
    await f.setInputFiles('#cmp-painel [data-a="foto"]', {name: 'f.png', mimeType: 'image/png', buffer: PNG});
    await f.click('#cmp-painel [data-c="add-achado"]'); await p.waitForTimeout(800);
    const ach = await f.evaluate(() => MedCampo.estado().achados[0]);
    ok(ach && ach.foto, 'achado sem foto');
    ok(await f.evaluate(() => !!document.querySelector('#cmp-painel [data-c="vinc"]')), 'sem botão de vincular ao item aberto');
    await f.click('#cmp-painel [data-c="vinc"]'); await p.waitForTimeout(200);
    ok(!!(await f.evaluate(() => MedCampo.estado().achados[0].item)), 'achado não vinculado');
    await f.click('#cmp-painel [data-c="fecha"]');
    /* construtor → campo de texto do item */
    /* campo de texto visível do item; se estiver num bloco recolhido (Anotações), abre o bloco */
    const marcou = await f.evaluate(() => { const ts = [...document.querySelectorAll('textarea')].filter(t => !t.closest('#cmp-painel'));
      let t = ts.find(x => x.checkVisibility && x.checkVisibility());
      if (!t && ts[0]) { t = ts[0]; for (let d = t.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true; }
      if (!t) return false; t.setAttribute('data-teste-alvo', '1'); t.scrollIntoView({block: 'center'}); return true; });
    if (marcou) {
      await p.waitForTimeout(300); await f.click('[data-teste-alvo]');
      await f.click('#cmp-fab'); await f.click('#cmp-painel [data-aba="redacao"]');
      await f.fill('#cmp-painel [data-cons="local"]', 'No sanitário localizado no mezanino');
      await f.fill('#cmp-painel [data-cons="itens"]', 'Ralo danificado\nfiação exposta no chuveiro\nausência de papel-toalha');
      const txt = await f.evaluate(() => document.querySelector('[data-cons-prev]').textContent);
      ok(txt === 'No sanitário localizado no mezanino, verificou-se ralo danificado, fiação exposta no chuveiro e ausência de papel-toalha.', 'construtor: ' + txt);
      await f.click('#cmp-painel [data-c="ins-cons"]'); await p.waitForTimeout(500);
      const v = await f.evaluate(() => [...document.querySelectorAll('textarea')].map(t => t.value).join('|'));
      ok(v.includes('verificou-se ralo danificado'), 'texto do construtor não chegou ao campo');
    } else falha(`${app}: item sem campo de texto para o teste do construtor`);
    /* aviso ao emitir, com lembrete aberto */
    await f.click('#cmp-fab'); await f.click('#cmp-painel [data-aba="pend"]');
    await f.fill('#cmp-painel [data-novo-lemb]', 'pedir certificado da balança'); await f.click('#cmp-painel [data-c="add-lemb"]');
    await f.click('#cmp-painel [data-c="fecha"]');
    const emite = await f.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.matches('[data-rs-word]') || /^(Baixar (Word|relatório|prévia)|Baixar relatório para Word|Imprimir)/.test(x.textContent.trim())); if (!b) return false; b.click(); return true; });
    if (emite) { await p.waitForTimeout(400); ok(await f.evaluate(() => /pendência/.test((document.getElementById('cmp-modal') || {}).textContent || '')), 'sem aviso de pendência ao emitir'); await f.evaluate(() => { const m = document.getElementById('cmp-modal'); if (m) m.remove(); }); }
    else console.log(`  ${app}: botão de emitir não visível nesta tela (aviso testado em outro roteiro)`);
    /* salva a inspeção e começa outra */
    await p.waitForTimeout(1800);
    await p.evaluate(() => { window.__avisos = []; new MutationObserver(() => { const a = document.getElementById('uvs-aviso'); if (a && window.__avisos.indexOf(a.textContent) < 0) window.__avisos.push(a.textContent); }).observe(document.body, {childList: true, subtree: true, characterData: true}); });
    await p.evaluate(a => window.UvisSalvas.salvarENova(a), app); await p.waitForTimeout(5000);
    const avisoCasca = await p.evaluate(() => window.__avisos.join(' | '));
    const salvas = await p.evaluate(a => window.UvisSalvas.salvas().then(l => l.filter(x => x.app === a).map(x => ({ls: Object.keys(x.ls), n: x.fotos.length}))), app);
    ok(salvas.length === 1 && salvas[0].ls.some(k => /med-campo-/.test(k)), 'salva sem a chave do campo: ' + JSON.stringify(salvas) + ' aviso: ' + avisoCasca);
    ok(salvas.length === 1 && salvas[0].n >= 1, 'salva sem a foto do achado');
    f = p.frames().find(x => x !== p.mainFrame());
    await p.waitForTimeout(1500);
    ok(await f.evaluate(() => MedCampo.estado().achados.length) === 0, 'inspeção nova ainda com achados');
    /* reinspeção a partir da salva */
    await f.click('#cmp-fab'); await f.click('#cmp-painel [data-aba="reinsp"]'); await p.waitForTimeout(800);
    await f.click('#cmp-painel [data-c="usa-salva"]').catch(() => falha(`${app}: salva não aparece na reinspeção`));
    await p.waitForTimeout(300);
    await f.selectOption('#cmp-painel [data-cmp-sit="0"]', 'parcial').catch(() => {});
    const tr = await f.evaluate(() => (document.querySelector('[data-reinsp-prev]') || {}).textContent || '');
    ok(/^Verificação das não conformidades apontadas na inspeção anterior/.test(tr) && /parcialmente corrigida/.test(tr), 'texto da reinspeção: ' + tr.slice(0, 120));
    await f.click('#cmp-painel [data-c="fecha"]');
    for (const e of erros) falha(`${app}: erro JS ${e}`);
    console.log(`${app}: ${nBotoes} botões de pendência, NC "${(ncs[0] || '').slice(0, 50)}…", reinspeção ok`);
    await ctx.close();
  }
  /* Central de Consultas: modo Automático */
  {
    const p = await b.newPage({viewport: {width: 390, height: 844}}), erros = [];
    p.on('pageerror', e => erros.push(e.message));
    await p.goto(`http://localhost:${srv.address().port}/medicamentos/`); await p.waitForTimeout(700);
    await p.locator('#abrir-consultas').click(); await p.waitForTimeout(3500);
    const f = p.frames().find(x => x !== p.mainFrame());
    const modo = () => f.evaluate(() => document.querySelector('[data-mode].on').dataset.mode);
    const esperado = {'57.507.378/0003-65': 'cnpj', '7896006200260': 'ean', '102351314': 'registro', '25351720415201709': 'processo', '5079496': 'afe'};
    for (const [t, m] of Object.entries(esperado)) {
      await f.click('#clearSearch'); await f.type('#q', t); await f.press('#q', 'Enter'); await p.waitForTimeout(400);
      if (await modo() !== m) falha(`central: ${t} foi para ${await modo()}, esperado ${m}`);
    }
    await f.click('#clearSearch'); await f.type('#q', 'dipi'); await p.waitForTimeout(400);
    if (await modo() !== 'uvis-nome-medicamento' || await f.inputValue('#q') !== 'dipi') falha('central: letras não foram para Medicamento');
    for (const e of erros) falha('central: erro JS ' + e);
    console.log('central: modo Automático ok');
    await p.close();
  }
  await b.close(); srv.close();
  console.log(falhas ? `${falhas} falha(s)` : 'TUDO OK');
  process.exitCode = falhas ? 1 : 0;
})();
