#!/usr/bin/env node
/* Teste das ferramentas de campo (modulos/campo.js) em um roteiro de cada
   motor: marca pendência e confere que some ao responder; registra achado com
   foto e vincula ao item; monta constatação e insere no campo de texto; confere
   o aviso ao emitir o relatório com pendência; tira foto no roteiro e confere
   data, hora, complemento e tipo no PDF de fotos; registra verificação; salva
   a inspeção (Salvas) com a chave do campo. Falha em erro de JavaScript. */
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
    /* editor de foto (modulos/foto-marca.js): desenha uma seta e conclui */
    const marcaFoto = async (onde) => { await p.waitForTimeout(600); if (!(await f.evaluate(() => !!document.querySelector('.mfm')))) return falha(`${app}: editor de foto não abriu (${onde})`);
      const r = await f.locator('.mfm canvas').boundingBox(); await p.mouse.move(r.x + r.width * .2, r.y + r.height * .2); await p.mouse.down(); await p.mouse.move(r.x + r.width * .6, r.y + r.height * .6, {steps: 5}); await p.mouse.up();
      await f.click('.mfm [data-f="ok"]'); await p.waitForTimeout(3200); ok(!(await f.evaluate(() => !!document.querySelector('.mfm'))), 'editor de foto não fechou'); };
    await abreItem(f, clica); await p.waitForTimeout(800);
    /* pendência: marca, confere, responde, some */
    const nBotoes = await f.evaluate(() => document.querySelectorAll('.cmp-pbtn').length);
    ok(nBotoes > 0, 'sem botão Marcar como pendente');
    await f.locator('.cmp-pbtn').nth(0).click(); await p.waitForTimeout(300);
    ok(await f.evaluate(() => MedCampo.pendencias().length) === 1, 'pendência não registrada');
    await f.locator('button:text-is("Não cumpre"), button[data-rs-r$="|nc"]').first().click(); await p.waitForTimeout(2500);
    ok(await f.evaluate(() => MedCampo.pendencias().length) === 0, 'pendência não saiu ao responder');
    /* conferência: o Não cumpre recém-marcado, sem evidência, aparece (drogaria não tem o campo por pergunta) */
    if (app !== 'drogaria') ok(await f.evaluate(() => MedCampo.consistencia().some(x => x.tipo === 'Não cumpre sem evidência')), 'conferência sem o Não cumpre sem evidência');
    const cont = await f.evaluate(() => MedCampo.contagem());
    ok(cont.nc === 1, `resumo com ${cont.nc} não conformidade(s)`);
    /* achado com foto, vinculado ao item aberto */
    await f.click('#cmp-fab'); await f.click('#cmp-painel [data-aba="achados"]');
    await f.fill('#cmp-painel [data-a="local"]', 'sanitário do mezanino'); await f.fill('#cmp-painel [data-a="txt"]', 'ralo danificado');
    await f.setInputFiles('#cmp-painel [data-a="foto"]', {name: 'f.png', mimeType: 'image/png', buffer: PNG}); await marcaFoto('achado');
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
    if (emite) { await p.waitForTimeout(400); ok(await f.evaluate(() => /conferir antes de emitir/.test((document.getElementById('cmp-modal') || {}).textContent || '')), 'sem aviso de pendência ao emitir'); await f.evaluate(() => { const m = document.getElementById('cmp-modal'); if (m) m.remove(); }); }
    else console.log(`  ${app}: botão de emitir não visível nesta tela (aviso testado em outro roteiro)`);
    /* foto tirada no roteiro: data, hora e item registrados; revisão e PDF */
    /* botão de foto do próprio roteiro (abre o seletor de arquivo) */
    const temBotao = await f.evaluate(() => { document.querySelectorAll('details').forEach(d => { if (!d.closest('#cmp-painel') && d.querySelector('button')) d.open = true; });
      const b = [...document.querySelectorAll('button,label')].find(x => !x.closest('#cmp-painel,header,.ui-header,#uvs-fotos') && x.id !== 'uvs-fotos' && /📷|^\s*Fotos?\b|Tirar foto|Adicionar foto/i.test(x.textContent) && x.checkVisibility && x.checkVisibility());
      if (!b) return false; b.setAttribute('data-teste-foto', '1'); return true; });
    if (temBotao) {
      const [fc] = await Promise.all([p.waitForEvent('filechooser', {timeout: 5000}).catch(() => null), f.click('[data-teste-foto]')]);
      if (fc) { await fc.setFiles({name: 'r.png', mimeType: 'image/png', buffer: PNG}); await marcaFoto('foto do roteiro'); }
      else if (await f.evaluate(() => !!(document.getElementById('med-tools-dialog') || {}).open)) {
        /* manipulação: janela própria com Fotografar / Selecionar foto */
        await f.setInputFiles('#med-tools-dialog [data-file-input]', {name: 'r.png', mimeType: 'image/png', buffer: PNG}); await marcaFoto('janela de fotos'); await p.waitForTimeout(1500);
        await f.evaluate(() => { const b = document.querySelector('#med-tools-dialog [data-close]'); if (b) b.click(); });
      } else console.log(`  ${app}: o botão de foto não abriu seletor de arquivo`);
      await p.waitForTimeout(1500);
      await f.evaluate(() => document.querySelectorAll('.modal .btn.primary, dialog button').forEach(b => { if (/salvar|confirmar|ok/i.test(b.textContent)) b.click(); }));
      await p.waitForTimeout(6500);
      const fm = await f.evaluate(() => Object.values(MedCampo.estado().fotos));
      const comHora = fm.filter(x => x.ts);
      if (!comHora.length) console.log(`  ${app}: foto do roteiro não identificada com hora (${fm.length} foto(s) no registro)`);
      await f.click('#cmp-fab'); await f.click('#cmp-painel [data-aba="fotos"]'); await p.waitForTimeout(1500);
      const nf = await f.evaluate(() => document.querySelectorAll('#cmp-painel .cmp-ft').length);
      ok(nf >= 1, 'aba Fotos vazia');
      await f.fill('#cmp-painel .cmp-ft input[data-campo="leg"]', 'balança MARK 50');
      if (nf > 1) await f.selectOption('#cmp-painel .cmp-ft >> nth=1 >> select', 'consulta');
      const [dl] = await Promise.all([p.waitForEvent('download', {timeout: 15000}).catch(() => null), f.click('#cmp-painel [data-c="gera-pdf"]')]);
      ok(!!dl, 'PDF de fotos não gerado');
      if (dl) { const arq = path.join(__dirname, 'capturas', `${app}-fotos.pdf`); fs.mkdirSync(path.dirname(arq), {recursive: true}); await dl.saveAs(arq);
        const txt = fs.readFileSync(arq, 'latin1'); ok(txt.includes('balan') && txt.includes('MARK 50'), 'complemento da legenda fora do PDF'); if (comHora.length) ok(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(txt), 'hora fora da legenda');
        const nimg = (txt.match(/\/Subtype \/Image/g) || []).length; ok(nimg === nf - (nf > 1 ? 1 : 0), `PDF com ${nimg} foto(s) para ${nf} na lista`); }
      await f.evaluate(() => { const x = document.querySelector('#cmp-painel [data-c="fecha"]'); if (x) x.click(); });
    } else console.log(`  ${app}: sem botão de foto nesta tela`);
    /* verificação realizada → texto */
    await f.click('#cmp-fab'); await f.click('#cmp-painel [data-aba="verif"]');
    await f.fill('#cmp-painel [data-v="obj"]', 'balança analítica MARK 50'); await f.fill('#cmp-painel [data-v="pad"]', 'peso-padrão de 100 g');
    await f.fill('#cmp-painel [data-v="esp"]', '100,00 g ± 0,10 g'); await f.fill('#cmp-painel [data-v="enc"]', '100,02 g'); await f.selectOption('#cmp-painel [data-v="concl"]', 'conforme');
    const tv = await f.evaluate(() => document.querySelector('[data-v-prev]').textContent);
    ok(tv === 'Realizou-se verificação de balança analítica MARK 50, utilizando peso-padrão de 100 g. Resultado esperado: 100,00 g ± 0,10 g. Resultado encontrado: 100,02 g. O resultado encontrado está de acordo com o esperado.', 'verificação: ' + tv);
    await f.click('#cmp-painel [data-c="reg-verif"]'); ok(await f.evaluate(() => MedCampo.estado().verif.length) === 1, 'verificação não registrada');
    await f.click('#cmp-painel [data-c="fecha"]');
    /* salva a inspeção: a chave do campo vai junto; a inspeção nova começa limpa */
    await p.waitForTimeout(1500);
    await p.evaluate(() => { window.__avisos = []; new MutationObserver(() => { const a = document.getElementById('uvs-aviso'); if (a && window.__avisos.indexOf(a.textContent) < 0) window.__avisos.push(a.textContent); }).observe(document.body, {childList: true, subtree: true, characterData: true}); });
    await p.evaluate(a => window.UvisSalvas.salvarENova(a), app); await p.waitForTimeout(5000);
    const salvas = await p.evaluate(a => window.UvisSalvas.salvas().then(l => l.filter(x => x.app === a).map(x => ({ls: Object.keys(x.ls), n: x.fotos.length}))), app);
    ok(salvas.length === 1 && salvas[0].ls.some(k => /med-campo-/.test(k)), 'salva sem a chave do campo: ' + JSON.stringify(salvas) + ' aviso: ' + await p.evaluate(() => window.__avisos.join(' | ')));
    ok(salvas.length === 1 && salvas[0].n >= 1, 'salva sem a foto do achado');
    f = p.frames().find(x => x !== p.mainFrame()); await p.waitForTimeout(1500);
    ok(await f.evaluate(() => MedCampo.estado().achados.length + MedCampo.estado().verif.length) === 0, 'inspeção nova ainda com achados/verificações');
    for (const e of erros) falha(`${app}: erro JS ${e}`);
    console.log(`${app}: ${nBotoes} botões de pendência, ${cont.resp} resposta(s), ${cont.nc} NC, ok`);
    await ctx.close();
  }
  /* Central de Consultas: modo Automático */
  {
    const p = await b.newPage({viewport: {width: 390, height: 844}}), erros = [];
    p.on('pageerror', e => erros.push(e.message));
    await p.goto(`http://localhost:${srv.address().port}/medicamentos/`); await p.waitForTimeout(700);
    await p.locator('#abrir-consultas').click(); await p.waitForTimeout(3500);
    const f = p.frames().find(x => x !== p.mainFrame());
    /* primeira abertura: a Central pergunta por quanto tempo guardar as bases; o teste escolhe uma opção */
    await p.waitForTimeout(900); await f.evaluate(() => { const d = document.getElementById('cacheDialog'); const o = d && d.querySelector('.opt'); if (o) o.click(); else if (d && d.open) d.close(); });
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
