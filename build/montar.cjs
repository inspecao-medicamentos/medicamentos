#!/usr/bin/env node
/* Gera o site Medicamentos (uvisvp.github.io/medicamentos) a partir do
   index.html do repositório roteiros.

   Os módulos de drogaria, manipulação, distribuidora, a Central de Consultas,
   o estoque e o banco normativo vêm do roteiros sem alteração. Assim uma
   correção feita lá chega aqui ao rodar de novo este script. Aqui mudam só:
   - a tela inicial: três cards horizontais (Drogaria, Manipulação e
     Atacadista, este com distribuidora e transportadora) e três tons de azul;
   - a lista de roteiros de cada card;
   - os módulos provisórios dos roteiros novos (EAC, vacinação, estéreis,
     gases medicinais), até cada um ser escrito;
   - título, ícones, manifest e service worker (prefixo de cache próprio).

   Uso: node build/montar.cjs [caminho/do/roteiros]   (padrão ../roteiros) */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const ROT = path.resolve(process.argv[2] || path.join(RAIZ, '..', 'roteiros'));
const {unpack} = require(path.join(ROT, 'scripts', 'integrated-html.cjs'));
const CAT = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalogo.json'), 'utf8'));
const VERSAO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'versao.json'), 'utf8')).versao;

/* Paleta: um petróleo institucional e quatro tons sóbrios, todos com texto
   branco acima de 4,5:1. Os hex existem só aqui e no :root gerado. */
const PALETA = {
  brand: '#16325C', brandStrong: '#0F2545', brandWash: '#E8EDF5',
  /* três tons de azul: drogaria cobalto, manipulação celeste, atacadista marinho */
  '--t-dro': ['#1F4E99', '#173B75', '#E7EDF8'],
  '--t-man': ['#0B6FA4', '#085582', '#E3F1F9'],
  '--t-ata': ['#34426E', '#27325A', '#ECEEF5']
};

const APPS_FORA = ['estetica', 'odontologia', 'servicos-assistenciais', 'alimentos-integrado',
  'servicos-alimentacao-roteiro', 'produtos-correlatos', 'analise-produtos', 'estoque-produtos'];

const {html: origem, lz, blocks: BLOCOS} = unpack(path.join(ROT, 'index.html'));
let h = origem;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

function troca(de, para, rotulo) {
  const n = h.split(de).length - 1;
  if (n !== 1) throw Error(`${rotulo}: esperava 1 ocorrência, achei ${n}`);
  h = h.replace(de, () => para);
}
function trocaRx(rx, para, rotulo) {
  if (!rx.test(h)) throw Error(`${rotulo}: padrão não encontrado`);
  h = h.replace(rx, para);
}

/* 1. Blocos: tira os módulos de outros núcleos e acrescenta os provisórios. */
for (const app of APPS_FORA) {
  trocaRx(new RegExp(`<script type="text/plain" id="app--${app}">[\\s\\S]*?</script>\\s*`), '', `bloco ${app}`);
}
function provisorio(id, def) {
  const nuc = CAT.nucleos.find(n => n.id === def.nucleo);
  const [tom, tomD, wash] = PALETA[nuc.var];
  const normas = def.normas.map(([nome, desc, url]) =>
    `<li><b>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(nome)}</a>` : esc(nome)}</b><span>${esc(desc)}</span></li>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(def.titulo)}</title>
<style>
:root{--tom:${tom};--tom-d:${tomD};--wash:${wash}}
*{box-sizing:border-box}body{margin:0;background:#F4F6F8;color:#1B262D;font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
header{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:10px;min-height:56px;padding:8px max(14px,env(safe-area-inset-left));background:var(--tom);color:#fff}
header button{min-width:44px;min-height:44px;border:1px solid rgba(255,255,255,.35);border-radius:10px;background:transparent;color:#fff;font:inherit;font-size:1.1rem;cursor:pointer}
header h1{margin:0;font-size:1.02rem;font-weight:650;line-height:1.25}
main{max-width:860px;margin:0 auto;padding:18px 16px 40px}
.aviso{display:flex;gap:14px;align-items:flex-start;padding:18px;border:1px solid #D6DEE4;border-left:5px solid var(--tom);border-radius:12px;background:#fff}
.aviso svg{flex:0 0 auto;width:30px;height:30px;color:var(--tom)}
.aviso b{display:block;font-size:1.02rem}.aviso p{margin:4px 0 0;color:#4F5F69;font-size:.92rem}
h2{margin:26px 2px 10px;color:var(--tom-d);font-size:.78rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
ul{margin:0;padding:0;list-style:none;display:grid;gap:8px}
li{padding:12px 14px;border:1px solid #DDE4E9;border-radius:10px;background:#fff}
li b{display:block;font-size:.95rem}li span{display:block;margin-top:2px;color:#56656F;font-size:.86rem}
a{color:var(--tom-d)}
</style></head><body>
<header><button type="button" data-voltar-nucleo aria-label="Voltar" title="Voltar">←</button><h1>${esc(def.titulo)}</h1></header>
<main>
<div class="aviso"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/></svg>
<div><b>Roteiro em elaboração</b><p>Este roteiro será construído a partir das normas abaixo, já incluídas no banco de legislação, no mesmo padrão dos demais roteiros de medicamentos: navegação por itens, fotos, prévia e relatório em Word.</p></div></div>
<h2>Normas de referência</h2><ul>${normas}</ul>
</main>
<script>
document.addEventListener('click',function(e){if(e.target.closest('[data-voltar-nucleo]')){e.preventDefault();parent.postMessage({__casca:'voltar'},'*');}});
parent.postMessage({__casca:'pronto'},'*');
</script></body></html>`;
}
/* Roteiros prontos (modulos/roteiros/<app>.cjs) usam o motor roteiro-simples;
   os demais ficam com a página provisória até serem escritos. */
const LEGAL = JSON.parse(fs.readFileSync(path.join(RAIZ, 'modulos', 'legislacao.json'), 'utf8'));
const DIR_ROT = path.join(RAIZ, 'modulos', 'roteiros');
const PRONTOS = fs.readdirSync(DIR_ROT).filter(f => f.endsWith('.cjs')).map(f => require(path.join(DIR_ROT, f)));
/* Orientações técnicas por item (modulos/orientacoes/orientacoes.cjs) e, na
   vacinação, o item de consulta com os calendários de vacinação. */
const ORIENT = require(path.join(RAIZ, 'modulos', 'orientacoes', 'orientacoes.cjs'));
for (const d of PRONTOS) {
  const o = ORIENT.rs[d.app] || {}, ids = new Set();
  d.secoes.forEach(s => s.itens.forEach(i => { ids.add(i.id); if (o[i.id]) i.orient = o[i.id]; }));
  for (const k of Object.keys(o)) if (!ids.has(k)) throw Error(`orientações: item ${k} não existe em ${d.app}`);
  if (d.app === 'vacina') d.secoes.push({id: 'consulta', titulo: 'Calendários de vacinação', curto: 'Calendários', icone: 'note',
    itens: [require(path.join(RAIZ, 'modulos', 'orientacoes', 'calendario-vacinacao.cjs'))]});
}
function roteiroSimples(d) {
  const nuc = CAT.nucleos.find(n => n.roteiros.some(r => r[2] === d.app));
  const refs = new Set();
  d.secoes.forEach(s => s.itens.forEach(i => (i.perguntas || []).forEach(q => q.r.forEach(r => refs.add(r)))));
  d.infracoes.forEach(i => i.r.forEach(r => refs.add(r)));
  const legal = {};
  for (const r of refs) { if (!LEGAL[r]) throw Error(`${d.app}: dispositivo sem texto (${r}); rode build/legislacao.cjs`); legal[r] = LEGAL[r]; }
  const ids = d.secoes.flatMap(s => s.itens.flatMap(i => (i.perguntas || []).map(q => q.id)));
  const rep = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (rep.length) throw Error(`${d.app}: perguntas com id repetido: ${rep.join(', ')}`);
  for (const s of d.secoes) for (const i of s.itens) for (const q of i.perguntas || []) for (const f of q.inf || [])
    if (!d.infracoes.some(x => x.id === f)) throw Error(`${d.app}: infração inexistente ${f} em ${q.id}`);
  const dados = JSON.stringify({...d, cor: PALETA[nuc.var][0], legal}).replace(/<\//g, '<\\/');
  const le = f => fs.readFileSync(path.join(RAIZ, 'modulos', f), 'utf8');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(d.titulo)}</title>`
    + `<style>${le('roteiro-simples.css')}</style></head><body>`
    + `<script>${BLOCOS.get('rec--jszip.js')}</script>`
    + `<script>${fs.readFileSync(path.join(ROT, 'relatorio-fotos.js'), 'utf8')}</script>`
    + `<script>window.ROTEIRO=${dados};</script>`
    + `<script>${le('roteiro-simples.js')}</script></body></html>`;
}
const novos = Object.entries(CAT.novos).map(([id, def]) => {
  const pronto = PRONTOS.find(d => d.app === id);
  return `<script type="text/plain" id="app--${id}">${lz.compressToBase64(pronto ? roteiroSimples(pronto) : provisorio(id, def))}</script>\n`;
}).join('');
/* A casca injeta o componente padrão (UvisPadrao) nos apps desta lista. */
troca('var padraoApps=["produtos-correlatos","servicos-alimentacao-roteiro","odontologia","servicos-assistenciais"];',
  'var padraoApps=' + JSON.stringify(["produtos-correlatos", "servicos-alimentacao-roteiro", "odontologia", "servicos-assistenciais"].concat(PRONTOS.map(d => d.app))) + ';', 'apps no padrão');
troca('<script type="text/plain" id="app--central-consultas">', novos + '<script type="text/plain" id="app--central-consultas">', 'inserir provisórios');

/* 1b. Complementos dentro dos módulos herdados. Cada bloco é descompactado,
   alterado com a mesma checagem de ocorrência única e compactado de novo. */
function blocoAltera(id, fn) {
  const rx = new RegExp(`(<script type="text/plain" id="${id.replace(/[.]/g, '\\.')}">)([\\s\\S]*?)(</script>)`);
  const m = h.match(rx);
  if (!m) throw Error(`bloco ${id} não encontrado`);
  const novo = fn(lz.decompressFromBase64(m[2].trim()));
  h = h.replace(rx, (_, a, __, c) => a + lz.compressToBase64(novo) + c);
}
function trocaEm(s, de, para, rotulo) {
  const n = s.split(de).length - 1;
  if (n !== 1) throw Error(`${rotulo}: esperava 1 ocorrência, achei ${n}`);
  return s.replace(de, () => para);
}
/* Referências do catálogo da drogaria (VISA_LOCAL embutido no módulo). */
function catalogoDrogaria(s, fn) {
  const at = s.indexOf('const VISA_LOCAL='), ini = s.indexOf('{', at);
  let prof = 0, aspas = false, esc2 = false, fim = -1;
  for (let i = ini; i < s.length; i++) {
    const c = s[i];
    if (aspas) { if (esc2) esc2 = false; else if (c === '\\') esc2 = true; else if (c === '"') aspas = false; }
    else if (c === '"') aspas = true;
    else if (c === '{') prof++;
    else if (c === '}' && --prof === 0) { fim = i + 1; break; }
  }
  const visa = JSON.parse(s.slice(ini, fim));
  fn(visa);
  return s.slice(0, ini) + JSON.stringify(visa) + s.slice(fim);
}

/* Drogaria em supermercado: perguntas na Área física, texto na seção 4 e
   irregularidades na seção 11 (modulos/drogaria-supermercado.js). */
const SUPER_JS = fs.readFileSync(path.join(RAIZ, 'modulos', 'drogaria-supermercado.js'), 'utf8');
blocoAltera('app--drogaria', s => {
  s = catalogoDrogaria(s, visa => {
    const cat = visa['roteiros/drogaria.json'];
    const lei = visa['legislacao_v12/normas/lei-5991-1973.json'], rdc = visa['legislacao_v12/normas/rdc-44-2009.json'];
    const base44 = cat.referencias['rdc-44-2009::artigo::13'], base5991 = cat.referencias['lei-5991-1973::artigo::35::paragrafo::2'];
    const novas = [['lei-5991-1973::artigo::6::paragrafo::2', 'Art. 6º, § 2º', base5991, lei], ['lei-5991-1973::artigo::6::paragrafo::3', 'Art. 6º, § 3º', base5991, lei],
      ['lei-5991-1973::artigo::6::paragrafo::4', 'Art. 6º, § 4º', base5991, lei], ['lei-5991-1973::artigo::6::paragrafo::5', 'Art. 6º, § 5º', base5991, lei],
      ['rdc-44-2009::artigo::13::paragrafo::2', 'Art. 13, § 2º', base44, rdc]];
    for (const [id, disp, base, norma] of novas) {
      if (!norma.nos.some(n => n.id === id)) throw Error('dispositivo ausente no banco: ' + id);
      cat.referencias[id] ??= {...base, id, dispositivo: disp};
    }
  });
  const fim = s.lastIndexOf('</body>');
  return s.slice(0, fim) + '<script>' + SUPER_JS + '</script>' + s.slice(fim);
});
blocoAltera('rec--drogaria-area-fisica.js', s => trocaEm(s,
  "question(n,'acesso','O acesso ao estabelecimento é independente ou se enquadra nas exceções aplicáveis para galerias, shoppings e supermercados?',null,false)",
  "question(n,'acesso','O acesso ao estabelecimento é independente ou se enquadra nas exceções aplicáveis para galerias, shoppings e supermercados?',null,false)+(window.__drgSuperHtml?window.__drgSuperHtml(n,a,{question,select,field,check}):'')",
  'supermercado: tela'));
blocoAltera('rec--drogaria-report-final.js', s => {
  s = trocaEm(s, "else if(no(a.acesso))intro+=' O acesso ao estabelecimento não é independente e não se enquadra nas exceções aplicáveis.';p(B,intro);",
    "else if(no(a.acesso))intro+=' O acesso ao estabelecimento não é independente e não se enquadra nas exceções aplicáveis.';p(B,intro);if(window.__drgSuperReport)window.__drgSuperReport(B,g,p,yes,no);", 'supermercado: relatório');
  return trocaEm(s, `if(no(ag.answers.acesso))addIssue(out,'final_area_acesso',2,'4 Área Física','O acesso ao estabelecimento não é independente e não se enquadra nas exceções aplicáveis.',["rdc-44-2009::artigo::13"]);`,
    `if(no(ag.answers.acesso))addIssue(out,'final_area_acesso',2,'4 Área Física','O acesso ao estabelecimento não é independente e não se enquadra nas exceções aplicáveis.',["rdc-44-2009::artigo::13"]);if(window.__drgSuperIssues)window.__drgSuperIssues(ag,out,addIssue,no);`, 'supermercado: irregularidades');
});

/* 2. Cabeçalho do documento. */
troca('<title>Inspeção Sanitária — Roteiros e apoio técnico</title>', '<title>Inspeção Medicamentos</title>', 'title');
troca('<meta name="apple-mobile-web-app-capable" content="yes">', '<meta name="apple-mobile-web-app-capable" content="yes">\n  <meta name="apple-mobile-web-app-title" content="Inspeção Medicamentos">', 'nome no iOS');
troca('<meta name="theme-color" content="#062D3E">', `<meta name="theme-color" content="${PALETA.brand}">`, 'theme-color');
trocaRx(/<link rel="icon" href="data:image\/svg\+xml,[^"]*">/,
  `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(fs.readFileSync(path.join(__dirname, 'icone.svg'), 'utf8').trim())}">`, 'favicon');
trocaRx(/<link rel="apple-touch-icon" href="data:image\/png;base64,[^"]*">/, '<link rel="apple-touch-icon" href="./apple-touch-icon.png">', 'apple-touch-icon');
troca('<h1 id="titulo-principal">Roteiros e apoio técnico</h1>', '<h1 id="titulo-principal">Medicamentos</h1>', 'h1');

/* 3. Cards da tela inicial. */
const seta = '<span class="card-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>';
const cards = CAT.nucleos.map(n => `
        <button class="nucleus-card med-card" type="button" data-nucleo="${esc(n.id)}">
          <span class="nucleus-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${n.icone}</svg></span>
          <span class="nucleus-content"><strong>${esc(n.id)}</strong><span>${esc(n.sub)}</span><em>${n.roteiros.length} ${n.roteiros.length === 1 ? 'roteiro' : 'roteiros'}</em></span>
          ${seta}
        </button>`).join('\n');
trocaRx(/<div class="nuclei-grid">[\s\S]*?<\/div>\s*\n\s*\n\s*<\/section>/, `<div class="nuclei-grid med-grid">${cards}\n      </div>\n    </section>`, 'cards');
troca('<h2 id="titulo-nucleos">Núcleos de inspeção</h2>', '<h2 id="titulo-nucleos">Estabelecimentos</h2>', 'título dos cards');

/* 4. Guia de uso. */
trocaRx(/(<h3>Núcleos de inspeção<\/h3>\s*<div class="guide-routes">)[\s\S]*?(<\/div>\s*<\/section>)/,
  (_, a, b) => a + CAT.nucleos.map(n => `\n            <article class="guide-route"><b>${esc(n.id)}</b><p>${esc(n.roteiros.map(r => r[0]).join(' · '))}.</p></article>`).join('') + '\n          ' + b, 'guia');
troca('<h3>Núcleos de inspeção</h3>', '<h3>Estabelecimentos</h3>', 'guia título');
trocaRx(/<article class="guide-route"><b>Inspeções salvas<\/b><p>[^<]*<\/p><\/article>/,
  '<article class="guide-route"><b>Inspeções salvas</b><p>Nos roteiros de drogaria, manipulação e atacadista, o botão Salvas no cabeçalho guarda a inspeção em andamento (respostas e fotos) e permite começar outra em branco.</p></article>', 'guia salvas');

/* 5. Casca: roteiros, núcleos, tema. */
const roteiros = Object.fromEntries(CAT.nucleos.map(n => [n.id, n.roteiros]));
trocaRx(/var ROTEIROS = \{[^\n]*\};/, () => `var ROTEIROS = ${JSON.stringify(roteiros)};`, 'ROTEIROS');
trocaRx(/var VAR_NUCLEO = \{[\s\S]*?\};/, () => `var VAR_NUCLEO = ${JSON.stringify(Object.fromEntries(CAT.nucleos.map(n => [n.id, n.var])))};`, 'VAR_NUCLEO');
const appNucleo = {'estoque-medicamentos': 'Drogaria'};
for (const n of CAT.nucleos) for (const r of n.roteiros) appNucleo[r[2]] ??= n.id;
trocaRx(/var APP_NUCLEO = \{[\s\S]*?\};/, () => `var APP_NUCLEO = ${JSON.stringify(appNucleo)};`, 'APP_NUCLEO');
const icones = {};
for (const n of CAT.nucleos) for (const r of n.roteiros) if (r[2] !== 'farmacia-manipulacao') icones[r[2] + (r[3] ? '|' + r[3] : '')] = n.icone;
Object.assign(icones, {
  'eac': '<path d="M9 3h6M10 3v5l-4.5 9a2.5 2.5 0 0 0 2.2 3.6h8.6a2.5 2.5 0 0 0 2.2-3.6L14 8V3M7.5 14h9"/>',
  'vacina': '<path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3a1 1 0 0 1-1.4 0l-2.6-2.6a1 1 0 0 1 0-1.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/>',
  'gases-medicinais': '<path d="M9 7h6v13a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zM10 7V4.5A1.5 1.5 0 0 1 11.5 3h1A1.5 1.5 0 0 1 14 4.5V7M9 11h6"/>'
});
trocaRx(/var ICONES = \{[\s\S]*?\n  \};/, () => `var ICONES = ${JSON.stringify(icones, null, 2).replace(/\n/g, '\n  ')};`, 'ICONES');

/* 6. Inspeções salvas: o núcleo de cada roteiro passa a ser o card. */
troca("'drogaria':{nome:'Drogaria',nucleo:'Medicamentos',", "'drogaria':{nome:'Drogaria',nucleo:'Drogaria',", 'salvas drogaria');
troca("'farmacia-manipulacao':{nome:'Farmácia com Manipulação',nucleo:'Medicamentos',", "'farmacia-manipulacao':{nome:'Farmácia com Manipulação',nucleo:'Manipulação',", 'salvas manipulação');
troca("'distribuidoras-transportadoras':{nome:'Distribuidora / transportadora',nucleo:'Medicamentos',", "'distribuidoras-transportadoras':{nome:'Atacadista de medicamentos',nucleo:'Atacadista de medicamentos',", 'salvas atacadista');
/* Salvas dos roteiros simples: respostas e fotos ficam no mesmo registro. */
troca("  'odontologia':{nome:'Odontologia',nucleo:'Odontologia',", PRONTOS.map(d => {
  const nuc = CAT.nucleos.find(n => n.roteiros.some(r => r[2] === d.app)).id;
  return `  ${JSON.stringify(d.app).replace(/"/g, "'")}:{nome:${JSON.stringify(d.titulo).replace(/"/g, "'")},nucleo:${JSON.stringify(nuc).replace(/"/g, "'")},ls:['${d.store}'],fotos:[],barra:'.pu-header .pu-acoes'},\n`;
}).join('') + "  'odontologia':{nome:'Odontologia',nucleo:'Odontologia',", 'salvas roteiros simples');

/* 7. Arquivo auxiliar carregado pela Central: servido por este site, qualquer
   que seja o endereço (o site não depende de uvisvp.github.io). */
troca('https://uvisvp.github.io/roteiros/central-nomes-medicamentos.js', "'+new URL('./central-nomes-medicamentos.js',location.href).href+'", 'central nomes');

/* 7b. Parâmetro do roteiro (?instalacao=...): a casca injetava no primeiro
   '</head>' do texto, que na drogaria está dentro de uma string JS do
   relatório Word, e o módulo quebrava. Injeta logo após a abertura <head>. */
troca("if(qs){ fonte = fonte.replace('</head>','<script>window.__QS='+JSON.stringify('?'+qs)+';<\\/script></head>'); }",
  "if(qs){ fonte = fonte.replace(/<head(\\s[^>]*)?>/i, function(m){ return m+'<script>window.__QS='+JSON.stringify('?'+qs)+';<\\/script>'; }); }", 'injeção do parâmetro');

/* 7g. Manipulação: bloco 13 “Manipulação de estéreis” (RDC 67/2007, Anexo IV;
   verificações do Anexo VII, item 18) dentro do roteiro principal. Aparece
   quando a caracterização marca a preparação “Estéreis” (condição estereis).
   Dados em modulos/estereis/cartao13.json, gerado por estereis/gerar.py. */
{
  const CARTAO13 = JSON.parse(fs.readFileSync(path.join(RAIZ, 'modulos', 'estereis', 'cartao13.json'), 'utf8'));
  blocoAltera('app--farmacia-manipulacao', s => {
    s = trocaEm(s, 'const APP_DATA={"cards":{', 'const APP_DATA={"cards":{"13":' + JSON.stringify(CARTAO13).replace(/<\//g, '<\\/') + ',', 'estéreis: cartão 13');
    s = trocaEm(s, '"conditionLabels":{', '"conditionLabels":{"estereis":"Manipula preparações estéreis",', 'estéreis: rótulo da condição');
    s = trocaEm(s, '"orient":{', '"orient":{' + JSON.stringify(ORIENT.estereis).slice(1, -1) + ',', 'estéreis: orientações');
    s = trocaEm(s, 'chip("preps","oficinais","Oficinais")', 'chip("preps","oficinais","Oficinais")}${chip("preps","estereis","Estéreis")', 'estéreis: caracterização');
    s = trocaEm(s, "homeopatia:preps.includes('homeopaticas')", "estereis:preps.includes('estereis'),homeopatia:preps.includes('homeopaticas')", 'estéreis: condição');
    return trocaEm(s, "const L={homeopaticas:'homeopáticas',", "const L={homeopaticas:'homeopáticas',estereis:'estéreis',", 'estéreis: relatório');
  });
}

/* 7h. Drogaria: a equipe inspetora (Seção 1 › Dados da inspeção) não saía no
   relatório; entra como 2.4 na seção 2 INSPEÇÃO. */
blocoAltera('rec--drogaria-report-final.js', s => trocaEm(s,
  "kv(B,'2.3. Período da última inspeção',m.ultima_inspecao_periodo||m.ultima_inspecao);",
  "kv(B,'2.3. Período da última inspeção',m.ultima_inspecao_periodo||m.ultima_inspecao);kv(B,'2.4. Equipe inspetora',m.equipe);",
  'drogaria: equipe inspetora'));

/* 7i. Atacadista/Transportadora — Anexo I: itens 5 (informações gerais) e 6
   (NCs anteriores) usam o rascunho montado da etapa 1 do roteiro quando a
   equipe não escreveu o texto na aba Relatório (antes saíam “Não informado”
   mesmo com a caracterização e o histórico preenchidos). */
blocoAltera('app--distribuidoras-transportadoras', s => {
  s = trocaEm(s, "it(5,'Informações gerais');ddParas(R.general).forEach(t=>p(t));if(!ddTem(R.general))p('Não informado.');",
    "it(5,'Informações gerais');{const rg=ddRascunhoGeral(),g=ddTem(R.general)?R.general:rg;ddParas(g).forEach(t=>p(t));const fg=ddTem(R.general)?ddFaltantes(R.general,rg):'';if(fg)p('Dados registrados na etapa 1: '+fg);if(!ddTem(g))p('Não informado.')}", 'anexo I: item 5');
  s = trocaEm(s, "it(6,'Não conformidades anteriores');ddParas(R.previous).forEach(t=>p(t));if(!ddTem(R.previous))p(primeira?'Não se aplica: primeira inspeção.':'Não informado.');",
    "it(6,'Não conformidades anteriores');{const ra=ddRascunhoAnterior(),q=ddTem(R.previous)?R.previous:ra;ddParas(q).forEach(t=>p(t));const fq=ddTem(R.previous)?ddFaltantes(R.previous,ra):'';if(fq)p('Histórico registrado na etapa 1: '+fq);if(!ddTem(q))p(primeira?'Não se aplica: primeira inspeção.':'Não informado.')}", 'anexo I: item 6');
  s = trocaEm(s, "if(!ddTem(R.general))out.push('Item 5: informações gerais não preenchidas.');", "if(!ddTem(R.general)&&!ddTem(ddRascunhoGeral()))out.push('Item 5: informações gerais não preenchidas.');", 'anexo I: pendência 5');
  /* Tipo de operação e trilha de transportadora na Etapa 1 › Estabelecimento */
  s = trocaEm(s, "business:[['meta.company','Razão social'],",
    "business:[['meta.opTipo','Tipo de operação','select',['Distribuidora (distribuição e armazenagem)','Transportadora (somente transporte)','Distribuidora e transportadora']],['meta.company','Razão social'],", 'atacadista: tipo de operação');
  s = trocaEm(s, "['meta.otherUnits','Outros estabelecimentos / unidades vinculadas','textarea']],",
    "['meta.otherUnits','Outros estabelecimentos / unidades vinculadas','textarea'],"
    + "['meta.transpClientes','Transportadora — clientes atendidos','checks',['Indústrias','Importadoras','Distribuidoras','Farmácias e drogarias','Hospitais e clínicas','Entrega ao consumidor (dispensação a distância de farmácia)','Outros']],"
    + "['meta.transpProdutos','Transportadora — produtos transportados','checks',['Medicamentos em temperatura ambiente','Termolábeis (2 °C a 8 °C)','Sujeitos a controle especial','Produtos para saúde','Cosméticos e saneantes','Produtos perigosos (ANTT)']],"
    + "['meta.transpCross','Transportadora — faz armazenagem temporária (cross-docking)?','select',['Sim','Não']],"
    + "['meta.transpFrota','Transportadora — frota','select',['Própria','Terceirizada','Própria e terceirizada']],"
    + "['meta.transpVeiculos','Transportadora — veículos (quantidade, tipo, controle de temperatura)','textarea'],"
    + "['meta.transpRntrc','Transportadora — RNTRC (ANTT) nº']],", 'atacadista: trilha de transportadora');
  /* a trilha entra no rascunho das informações gerais (item 5 do Anexo I) */
  s = trocaEm(s, "function ddRascunhoGeral(){",
    "function ddTrilhaTransp(){const m=state.meta||{},t=[];if(ddTem(m.opTipo))t.push('Tipo de operação: '+ddLc(m.opTipo)+'.');if(!/transportadora/i.test(m.opTipo||''))return t.join(' ');"
    + "const c=ddLista(m.transpClientes),p=ddLista(m.transpProdutos);if(c.length)t.push('Como transportadora, atende: '+ddJoin(c.map(ddLc))+'.');if(p.length)t.push('Produtos transportados: '+ddJoin(p.map(ddLc))+'.');"
    + "if(m.transpCross==='Sim')t.push('Realiza armazenagem temporária (cross-docking).');else if(m.transpCross==='Não')t.push('Não realiza armazenagem temporária.');"
    + "if(ddTem(m.transpFrota))t.push('Frota '+ddLc(m.transpFrota)+'.');if(ddTem(m.transpVeiculos))t.push('Veículos: '+ddFim(m.transpVeiculos));if(ddTem(m.transpRntrc))t.push('RNTRC nº '+m.transpRntrc+'.');return t.join(' ')}"
    + "function ddRascunhoGeral(){return [ddTrilhaTransp(),ddRascunhoGeral0()].filter(ddTem).join('\\n\\n')}function ddRascunhoGeral0(){", 'atacadista: trilha no item 5');
  /* Etapa 1 › Dados da inspeção › Atividades (meta.activities) não saía em lugar
     nenhum do Anexo I: os quadros de atividades dos itens 1 e 2 são os da licença,
     da AFE e da AE. O modelo não tem linha própria no item 3; entra junto do objetivo. */
  s = trocaEm(s, "kv('Objetivo da inspeção',[m.objective,m.inspectionType&&('Tipo: '+m.inspectionType)].filter(Boolean).join('. '));",
    "kv('Objetivo da inspeção',[m.objective,m.inspectionType&&('Tipo: '+m.inspectionType),(Array.isArray(m.activities)?m.activities:ddLista(m.activities)).length&&('Atividades verificadas: '+ddJoin((Array.isArray(m.activities)?m.activities:ddLista(m.activities)).map(ddLc)))].filter(Boolean).join('. '));", 'anexo I: atividades verificadas');
  return trocaEm(s, "if(!ddTem(R.previous)&&m.first!=='Sim')", "if(!ddTem(R.previous)&&!ddTem(ddRascunhoAnterior())&&m.first!=='Sim')", 'anexo I: pendência 6');
});

/* 7f. Prévia “Como sai no relatório”: o módulo da distribuidora tem um ouvinte
   de clique em window (captura) que interrompe a propagação, e a prévia ouvia
   em document, por isso nunca registrava a resposta dada. Ouvindo em window
   ela recebe o clique antes da interrupção. */
for (const id of ['app--drogaria', 'app--distribuidoras-transportadoras'])
  blocoAltera(id, s => trocaEm(trocaEm(s, "document.addEventListener(k,evento,true)", "window.addEventListener(k,evento,true)", 'prévia: ' + id),
    "var GEN=/^(Não foram registradas irregularidades|", "var GEN=/^(Nº \\||Avaliação de risco não informada|Análise do plano de ação — será anexada|Não foram registradas irregularidades|", 'prévia GEN: ' + id));

/* 7d. Drogaria › Área física › "Informações gerais" (tipo de instalação,
   pavimentos, acesso, áreas, caixa d'água, ventilação) não aparecia: a casca
   procurava o bloco no HTML antigo do card, onde ele não existe. Passa a ler
   da tela própria da Área física. (O mesmo defeito existe no roteiros.) */
troca("var geral=Array.from(t.content.querySelectorAll('.box')).find(function(el){",
  "var tg=document.createElement('template');try{tg.innerHTML=(window.DrogariaAreaFisica&&window.DrogariaAreaFisica.render(2))||''}catch(e){}var geral=Array.from(tg.content.querySelectorAll('.box')).concat(Array.from(t.content.querySelectorAll('.box'))).find(function(el){",
  'drogaria: informações gerais');
troca("if(geral)itens.push({id:'area-geral',title:'Informações gerais',html:geral.outerHTML});",
  "if(geral)itens.push({id:'area-geral',title:'Informações gerais',html:geral.innerHTML.replace(/^\\s*<h3>[^<]*<\\/h3>/,'')});",
  'drogaria: informações gerais aberta');

/* 7e. Atacadista de medicamentos (módulo da distribuidora): a identificação
   diz se o estabelecimento é distribuidora, só transportadora ou as duas; a
   trilha de transportadora (clientes, cross-docking, frota, RNTRC…) aparece
   quando há transporte, e o cabeçalho leva o nome conforme o tipo
   (modulos/atacadista-ajustes.js). Nada é marcado “Não se aplica” sozinho. */
const le = f => fs.readFileSync(path.join(RAIZ, 'modulos', f), 'utf8');
const jsStr = t => JSON.stringify(t).replace(/<\//g, '<\\/');
/* Central de Consultas: modo Automático (modulos/central-auto.js).
   Ferramentas de campo (modulos/campo.js) em todos os roteiros: entra no fim
   do módulo; a chave med-campo-<roteiro> e o prefixo das fotos dos achados
   entram na lista das Salvas; Nova inspeção apaga também essa chave. */
const CAMPO_APPS = CAT.nucleos.flatMap(n => n.roteiros.map(r => r[2]));
troca("k.indexOf('uvis-previa-')===0", "(k.indexOf('uvis-previa-')===0||k.indexOf('med-campo-')>=0)", 'campo: nova inspeção');
{
  const SALVAS_CAMPO = "(function(){var n=0;function f(){var S=window.UvisSalvas;if(!S){if(++n<80)setTimeout(f,150);return}Object.keys(S.CFG).forEach(function(a){var c=S.CFG[a],k='med-campo-'+a;if(c.ls.indexOf(k)<0)c.ls.push(k);if(!c.fotos.length)c.fotos.push(a+'-campo-')})}f()})();";
  const k = h.lastIndexOf('</body>');
  h = h.slice(0, k) + '<script>' + SALVAS_CAMPO + '</script>\n' + h.slice(k);
  /* cópia automática da inspeção em andamento (modulos/copia-auto.js) */
  const k2 = h.lastIndexOf('</body>');
  h = h.slice(0, k2) + '<script>' + le('copia-auto.js').replace(/<\//g, '<\\/') + '</script>\n' + h.slice(k2);
  /* ditado por voz nas caixas de texto da tela inicial (modulos/ditado.js) */
  const k3 = h.lastIndexOf('</body>');
  h = h.slice(0, k3) + '<script>' + le('ditado.js').replace(/<\//g, '<\\/') + '</script>\n' + h.slice(k3);
}
troca('  function montar(app){',
  `  var ATACADISTA_JS = ${jsStr(le('atacadista-ajustes.js'))};
  var CAMPO_APPS = ${JSON.stringify(CAMPO_APPS)};
  var CAMPO_JS = ${jsStr(['cnpj-guarda.js', 'campo.js', 'foto-marca.js', 'ditado.js'].map(le).join('\n'))};
  var CENTRAL_AUTO_JS = ${jsStr(le('central-auto.js'))};
  var DITADO_JS = ${jsStr(le('ditado.js'))};
  var MANIP_JS = ${jsStr(le('manipulacao-ajustes.js'))};
  var ORIENT_TRANSP = ${jsStr(JSON.stringify(ORIENT.transporte))};
  var TRANSP_ORIENT_JS = ${jsStr(le('transporte-orient.js'))};
  function montar(app){ var s = montarBase(app);
    if(app === 'distribuidoras-transportadoras'){ var k = s.lastIndexOf('</body>'); s = s.slice(0, k) + '<scr' + 'ipt>' + ATACADISTA_JS + '</scr' + 'ipt>' + s.slice(k); }
    if(app === 'farmacia-manipulacao'){ var mj = s.lastIndexOf('</body>'); s = s.slice(0, mj) + '<scr' + 'ipt>' + MANIP_JS + '</scr' + 'ipt>' + s.slice(mj); }
    if(app === 'central-consultas'){ var c = s.lastIndexOf('</body>'); s = s.slice(0, c) + '<scr' + 'ipt>' + CENTRAL_AUTO_JS + '</scr' + 'ipt>' + s.slice(c); }
    if(app === 'distribuidoras-transportadoras'){ var o = s.lastIndexOf('</body>'); s = s.slice(0, o) + '<scr' + 'ipt>window.__ORIENT_TRANSP=' + ORIENT_TRANSP + ';' + TRANSP_ORIENT_JS + '</scr' + 'ipt>' + s.slice(o); }
    if(CAMPO_APPS.indexOf(app) >= 0){ var j = s.lastIndexOf('</body>'); s = s.slice(0, j) + '<scr' + 'ipt>' + CAMPO_JS + '</scr' + 'ipt>' + s.slice(j); }
    else { var dj = s.lastIndexOf('</body>'); if(dj >= 0) s = s.slice(0, dj) + '<scr' + 'ipt>' + DITADO_JS + '</scr' + 'ipt>' + s.slice(dj); }
    return s; }
  function montarBase(app){`, 'variantes: montar');
troca("if(window.RoteiroEvidence)for(var k=1;k<=12;k++)await RoteiroEvidence.clear('manipulacao-card-'+k);", "if(window.RoteiroEvidence)for(var k=1;k<=13;k++)await RoteiroEvidence.clear('manipulacao-card-'+k);", 'manipulação: fotos do bloco 13');

/* 7c. Tom do módulo: drogaria, manipulação e atacadista trazem o ardósia do
   roteiros fixo no código (#365B73 e vizinhos). Ao montar, essa família vira o
   tom do card aberto; a Central (sem card) fica como está. */
troca("try { fonte = montar(app);", "try { fonte = montar(app); if(nucleoAtual && window.__medTom) fonte = window.__medTom(fonte, css(VAR_NUCLEO[nucleoAtual], ''), css(VAR_NUCLEO[nucleoAtual] + '-d', ''));", 'tom do módulo');

/* 7j. Central de Consultas — três correções no núcleo de busca:
   - CNPJ ou EAN com dígito verificador errado: o aviso aparecia, mas a área de
     resultados continuava com a consulta anterior (dado de outra empresa na
     tela). Agora limpa os resultados até o usuário escolher “Consultar assim
     mesmo”.
   - Processo: o índice aponta saneantes e medicamentos para as visões por
     processo (saneantes_processos, medicamentos_processos), que materialize()
     não lia; só o complemento da casca achava, com atraso fixo, e perdia para a
     renderização (ex.: saneante 25351121048202134 dava 0). Agora o núcleo lê
     essas visões.
   - Medidas fiscais: empresa, produtos e medidas são objetos e saíam como
     “[object Object]” (título e campos). Agora viram texto. */
blocoAltera('app--central-consultas', s => {
  const LIMPA = "$('results').className='results-empty';$('results').textContent='Consulta não realizada. Confira o número digitado ou toque em “Consultar assim mesmo”.';ultimo=null;";
  s = trocaEm(s, "status(forcar(raw,'O dígito verificador deste CNPJ não confere", LIMPA + "status(forcar(raw,'O dígito verificador deste CNPJ não confere", 'central: DV CNPJ limpa');
  s = trocaEm(s, "status(forcar(raw,'O dígito verificador deste EAN/GTIN não confere", LIMPA + "status(forcar(raw,'O dígito verificador deste EAN/GTIN não confere", 'central: DV EAN limpa');
  s = trocaEm(s, "else if(b==='cosmeticos')data=await json(`cosmeticos/${shardProcessBase('cosmeticos',processo)}.json`)||[];",
    "else if(b==='cosmeticos')data=await json(`cosmeticos/${shardProcessBase('cosmeticos',processo)}.json`)||[];"
    + "else if(b==='saneantes_processos'||b==='medicamentos_processos'){const base=b.replace('_processos','');"
    + "if(out.some(x=>x._base===base&&digits(x.processo)===processo))continue;"
    + "out.push(...(await json(`${b}/${shardProcessBase(b,processo)}.json`)||[]).filter(x=>digits(x.processo)===processo).map(x=>{const y={...x,_base:base};"
    + "if(y.situacao==='S')y.situacao='Ativo';else if(y.situacao==='N')y.situacao='Inativo';"
    + "if(String(y.registrado)==='0'&&!y.registro)y.regularizacao='Notificado / sem número de registro';"
    + "const v=/^(\\d{2})\\/(\\d{2})\\/(\\d{4})/.exec(String(y.vencimento||''));if(v)y.vencimento=v[2]+'/'+v[1]+'/'+v[3];"
    + "delete y.registrado;delete y.atualizado_em;return y}));continue}",
    'central: processo em saneantes/medicamentos_processos');
  s = trocaEm(s, "const item=data?.[processo];if(item)out.push({...item,processo,_base:'produtos_irregulares'})",
    "const item=data?.[processo];if(item)out.push(achataIrregular({...item,processo,_base:'produtos_irregulares'}))", 'central: medida fiscal achatada');
  s = trocaEm(s, 'async function irregular(kind,value){',
    `function achataIrregular(it){
  const x={...it},dt=v=>{const m=/^(\\d{4})-(\\d{2})-(\\d{2})/.exec(String(v||''));return m?m[3]+'/'+m[2]+'/'+m[1]:String(v||'')},uniq=a=>[...new Set(a.filter(Boolean).map(String))].join(' · ');
  const ps=Array.isArray(it.produtos)?it.produtos.filter(p=>p&&typeof p==='object'):[];
  x.produto=(typeof it.produto==='string'&&it.produto)||uniq(ps.map(p=>p.produto))||String(it.produto_resumo||'').replace(/\\s*-\\s*Registrad[oa]:.*$/i,'')||'Produto com medida fiscal';
  if(ps.length){const r=uniq(ps.map(p=>p.registro)),l=uniq(ps.map(p=>p.lotes||p.lote));if(r)x.registro=r;if(l)x.lote=l}
  const e=it.empresa&&typeof it.empresa==='object'?it.empresa:null;
  if(e){x.empresa=e.razao_social||'';if(e.cnpj)x.cnpj=e.cnpj;if(e.municipio)x.municipio=e.municipio;if(e.uf)x.uf=e.uf}
  const ms=Array.isArray(it.medidas)?it.medidas.filter(m=>m&&typeof m==='object'):[];
  if(ms.length)x.medidas=ms.map(m=>[m.numero_resolucao?'RE '+m.numero_resolucao:'',m.data_publicacao?'DOU de '+dt(m.data_publicacao):'',Array.isArray(m.acoes_atividades)?m.acoes_atividades.join('; '):'',m.situacao_medida?'medida '+String(m.situacao_medida).toLowerCase():''].filter(Boolean).join(' — '));
  if(it.assunto&&typeof it.assunto==='object')x.assunto=it.assunto.descricao||'';
  if(it.data_ultima_medida)x.data_ultima_medida=dt(it.data_ultima_medida);
  ['produtos','controle','consultado_em','detalhe_status','codigo_risco','codigo_tipo_produto','id_dossie','presente_na_fonte','data_atualizacao','produto_resumo'].forEach(k=>delete x[k]);
  Object.keys(x).forEach(k=>{if(x[k]&&typeof x[k]==='object'&&!Array.isArray(x[k]))delete x[k]});
  return x;
}
async function irregular(kind,value){`, 'central: função achataIrregular');
  s = trocaEm(s, 'function valor(k,v){', "Object.assign(field,{infracao:'Infração',acoes_resumo:'Ações',medidas:'Medidas publicadas',assunto:'Assunto',risco:'Risco',data_ultima_medida:'Última medida',total_medidas:'Total de medidas',situacao_investigacao:'Em investigação',prova_processual_apensa:'Prova processual apensa'});\nfunction valor(k,v){", 'central: rótulos das medidas fiscais');
  /* Situação “S”/“N” e vencimento “mm/dd/aaaa hh:mm:ss” das bases de saneantes, em
     qualquer caminho (registro, processo); CNPJ tirado do “detentor” quando falta. */
  s = trocaEm(s, 'function valor(k,v){', "function valor(k,v){if(k==='situacao'&&(v==='S'||v==='N'))v=v==='S'?'Ativo':'Inativo';if(k==='vencimento'){const u=/^(\\d{2})\\/(\\d{2})\\/(\\d{4})\\s+\\d/.exec(String(v));if(u)return esc(u[2]+'/'+u[1]+'/'+u[3])}", 'central: situação e vencimento');
  s = trocaEm(s, "delete y.registrado;delete y.atualizado_em;return y}", "if(!y.cnpj){const c=/^(\\d{14})\\s*-/.exec(String(y.detentor||''));if(c)y.cnpj=c[1]}delete y.registrado;delete y.atualizado_em;return y}", 'central: cnpj do detentor');
  /* Alertas sanitários: identificadores (lote, série, modelo), anexos e outras
     publicações são listas de objetos e saíam “[object Object]” (ex.: ABL90Flex,
     alerta 2781). Viram texto; o link oficial vira link; datas com hora em dd/mm/aaaa.
     Rede de segurança no valor(): qualquer outra lista de objetos vira texto. */
  s = trocaEm(s, "if(numeros.includes(digits(item.numero_alerta)))out.push({...item,_base:'alertas_sanitarios'})",
    "if(numeros.includes(digits(item.numero_alerta)))out.push(achataAlerta({...item,_base:'alertas_sanitarios'}))", 'central: alerta achatado');
  s = trocaEm(s, 'async function alerts(kind,value){',
    `function achataAlerta(it){
  const x={...it},TIPO={lote:'Lote',serie:'Série',modelo:'Modelo',referencia:'Referência',codigo:'Código'};
  const ids=Array.isArray(it.identificadores)?it.identificadores.filter(i=>i&&typeof i==='object'):[];
  if(ids.length){const g=new Map();ids.forEach(i=>{const t=TIPO[i.tipo]||String(i.tipo||'Identificador');if(!g.has(t))g.set(t,[]);const vv=/^ver$/i.test(String(i.valor||'').trim())?'ver lista no anexo':String(i.valor||'');if(vv&&!g.get(t).includes(vv))g.get(t).push(vv)});x.identificadores=[...g].map(([t,v])=>t+': '+v.join(', ')).join(' · ')}else delete x.identificadores;
  const an=Array.isArray(it.anexos)?it.anexos.filter(a=>a&&typeof a==='object'):[];
  if(an.length)x.anexos=an.map(a=>a.nome||('Anexo '+(a.id||''))).join(' · ')+' (disponíveis na página oficial do alerta)';else delete x.anexos;
  const op=Array.isArray(it.outras_publicacoes)?it.outras_publicacoes.filter(a=>a&&typeof a==='object'):[];
  if(op.length)x.outras_publicacoes=op.map(a=>a.nome||a.url||'').filter(Boolean).join(' · ');else delete x.outras_publicacoes;
  if(Array.isArray(x.cnpjs))x.cnpjs=x.cnpjs.map(c=>/^\\d{14}$/.test(String(c))?fmtCnpj(String(c)):String(c));
  delete x.id_alerta;
  return x;
}
async function alerts(kind,value){`, 'central: função achataAlerta');
  s = trocaEm(s, "function valor(k,v){if(k==='situacao'",
    "function valor(k,v){if(/^data_/.test(k)){const d=/^(\\d{4})-(\\d{2})-(\\d{2})T/.exec(String(v||''));if(d)return esc(d[3]+'/'+d[2]+'/'+d[1])}"
    + "if(k==='url_oficial'&&/^https?:\\/\\//.test(String(v)))return '<a href=\"'+esc(v)+'\" target=\"_blank\" rel=\"noopener\">Abrir na Anvisa ↗</a>';"
    + "if(Array.isArray(v)&&v.some(e=>e&&typeof e==='object'))v=v.map(e=>e&&typeof e==='object'?(e.nome||e.valor||e.descricao||e.titulo||Object.values(e).filter(z=>z!=null&&typeof z!=='object').join(' ')):e);"
    + "if(k==='situacao'", 'central: datas, link e listas de objetos');
  s = trocaEm(s, "Object.assign(field,{infracao:'Infração',", "Object.assign(field,{identificadores:'Identificadores (lote, série, modelo)',anexos:'Anexos do alerta',outras_publicacoes:'Outras publicações',url_oficial:'Página oficial',informacoes_complementares:'Informações complementares',data_atualizacao:'Atualização',tipo_alerta:'Tipo',registros:'Registros',cnpjs:'CNPJ',motivacao:'Motivação',infracao:'Infração',", 'central: rótulos dos alertas');
  return s;
});

/* 7k. OCR de PDF (auditoria de 30/09/2026, R-01): passam pelo OCR no máximo 4
   páginas de imagem (6 em POP/manual/PGRSS e sumário). As páginas só de imagem
   além desse limite eram puladas sem aviso; agora entram na descrição da leitura
   (“sem OCR: página(s) …”), que aparece no painel do documento. */
for (const bloco of ['rec--drogaria-ocr-tools.js', 'app--farmacia-manipulacao', 'app--distribuidoras-transportadoras']) {
  blocoAltera(bloco, s => {
    s = trocaEm(s, 'let ocrPages = 0;', 'let ocrPages = 0; const semOcr = [];', `ocr ${bloco}: lista`);
    s = trocaEm(s, '      pages.push({ number: p, page, textLayer, region });', '      if (!region && ocrPages >= maxOcrPages && chars < 25) semOcr.push(p);\n      pages.push({ number: p, page, textLayer, region });', `ocr ${bloco}: página pulada`);
    s = trocaEm(s, 'return { pdf, pages, total: pdf.numPages };', 'return { pdf, pages, total: pdf.numPages, semOcr, maxOcrPages };', `ocr ${bloco}: retorno`);
    s = trocaEm(s, 'const { pdf, pages, total } = await pdfPages(file, type, progress);', 'const { pdf, pages, total, semOcr, maxOcrPages } = await pdfPages(file, type, progress);', `ocr ${bloco}: leitura`);
    return trocaEm(s, "const cut = total > pages.length ? ' · lidas ' + pages.length + ' de ' + total + ' páginas' : '';",
      "const cut = (total > pages.length ? ' · lidas ' + pages.length + ' de ' + total + ' páginas' : '') + (semOcr && semOcr.length ? ' · sem OCR (limite de ' + maxOcrPages + ' páginas de imagem por documento): página' + (semOcr.length > 1 ? 's ' : ' ') + semOcr.join(', ') + ' — confira essas páginas no documento' : '');", `ocr ${bloco}: aviso`);
  });
}

/* 7l. Evidência escrita que não chegava ao relatório (varredura de 01/10/2026,
   inspeção completa com respostas em rodízio):
   - Manipulação: a evidência só saía com “Não cumpre”; com “Cumpre” a frase saía
     sem ela, e “Não se aplica” era sempre omitido. Agora a evidência entra entre
     parênteses na frase de conformidade, e o “Não se aplica” com anotação sai com
     a justificativa (sem anotação continua omitido).
   - Atacadista: “Não se aplica” com anotação perdia a justificativa; agora sai. */
blocoAltera('app--farmacia-manipulacao', s => {
  s = trocaEm(s, "if(a.status==='C'){const dt=v2DocTxt(q.id);frases.push(esc(dt?q.pos.replace(/\\.$/,'')+' ('+dt+').':q.pos))}",
    "const evx=String(a.evidence||'').trim().replace(/\\s*\\n\\s*/g,'; ').replace(/\\.$/,'');"
    + "if(a.status==='C'){const dt=v2DocTxt(q.id),par=[dt,evx].filter(Boolean).join('; ');frases.push(esc(par?q.pos.replace(/\\.$/,'')+' ('+par+').':q.pos))}"
    + "else if(a.status==='NA'&&evx){frases.push(esc('Não se aplica ('+evx+'): '+q.pos.charAt(0).toLowerCase()+q.pos.slice(1).replace(/\\.?$/,'.')))}", 'manipulação: evidência em Cumpre e Não se aplica');
  return s;
});
/* Com “Descrição para o relatório” escrita pela equipe, o texto dela continua no
   lugar das frases de Cumpre (descrição consolidada do POP 011), mas as evidências
   que não estiverem no texto e as justificativas de Não se aplica vêm depois dele. */
blocoAltera('app--distribuidoras-transportadoras', s => {
  s = trocaEm(s, "else if(a.status==='NC'){const m=ctx.nc.map[q.id];",
    "else if(a.status==='NA'){const ev=String(a.evidence||'').trim().replace(/\\s*\\n\\s*/g,'; ').replace(/\\.$/,'');if(ev){const nf='Não se aplica ('+ev+'): '+ddLc(ddAfirma(q)).replace(/\\.?$/,'.');frases.push(nf);naF.push(nf)}}"
    + "else if(a.status==='NC'){const m=ctx.nc.map[q.id];", 'atacadista: justificativa do Não se aplica');
  s = trocaEm(s, "const sec=ddSec(sid),manual=String(state.narratives[sid]||'').trim(),frases=[],ncs=[];", "const sec=ddSec(sid),manual=String(state.narratives[sid]||'').trim(),frases=[],ncs=[],evsC=[],naF=[];", 'atacadista: listas de evidências');
  s = trocaEm(s, "if(a.status==='C'){let f=ddAfirma(q),ev=String(a.evidence||'').trim().replace(/\\s*\\n\\s*/g,'; ');", "if(a.status==='C'){let f=ddAfirma(q),ev=String(a.evidence||'').trim().replace(/\\s*\\n\\s*/g,'; ');if(ev)evsC.push(ev.replace(/\\.$/,''));{const ck=(state.checklists||{})[q.id],cl=Array.isArray(ck)?ck:ddLista(ck);if(cl.length){const it='itens verificados: '+ddJoin(cl.map(ddLc));evsC.push(it);ev=[ev.replace(/\\.$/,''),it].filter(Boolean).join('; ')}}", 'atacadista: evidência de Cumpre guardada');
  return trocaEm(s, "const corpo=manual?ddParas(manual):frases.length?[frases.join(' ')]:[];",
    "const evsFora=evsC.filter(e=>!manual.includes(e)),corpo=manual?ddParas(manual).concat(evsFora.length?['Evidências registradas nas verificações: '+ddJoin(evsFora)+'.']:[],naF.length?[naF.join(' ')]:[]):frases.length?[frases.join(' ')]:[];", 'atacadista: descrição + evidências');
});

/* 7m. Atacadista — campos da etapa 1 e do roteiro que não chegavam ao Anexo I
   (varredura de 01/10/2026): validade da licença; processo, classe, situação na
   fonte oficial e atividades da AFE/AE; processo SEI; pessoas contatadas; CRT e
   AVCB completos (ramo, RTs, horários, órgão emissor, mesmo sem “situação”);
   finalidade e pior caso da qualificação térmica; dados do documento de
   expedição conferido. Itens 5 e 6 escritos à mão: o que a etapa 1 registrou e
   não está no texto vem logo abaixo (ddFaltantes). */
blocoAltera('app--distribuidoras-transportadoras', s => {
  s = trocaEm(s, "function ddItemNodes(item,ctx){",
    "function ddFaltantes(manual,rasc){const nz=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/\\s+/g,' ').trim(),M=nz(manual);return String(rasc||'').split(/\\n+|(?<=\\.)\\s+(?=[A-ZÀ-Ú])/).map(x=>x.trim()).filter(x=>x&&!M.includes(nz(x).slice(0,40))).join(' ')}"
    + "function ddDocExped(d){if(!d)return '';const L=[['DANFE / nota fiscal nº ',d.danfe],['emitida em ',ddData(d.issueDate)],['expedida em ',ddData(d.dispatchDate)],['emitente: ',d.issuer],['remetente: ',d.sender],['destinatário: ',d.recipient],['transportador: ',d.transporter],['motorista: ',d.driver],['ordem de entrega: ',d.order],['veículo: ',d.vehicle],['instrumento de monitoramento: ',d.instrument]].filter(x=>ddTem(x[1])).map(x=>x[0]+String(x[1]).trim());const IT={q245:'data da expedição ou do recebimento',q246:'transportador',q247:'motorista',q248:'destinatário',q249:'medicamento e apresentação',q250:'quantidade, lote e validade',q251:'condições de transporte e veículo',q252:'ordem de entrega',q253:'nota fiscal ou DANFE',q254:'lotes na nota fiscal'},cf=Object.keys(d.items||{}).filter(k=>d.items[k]&&IT[k]).map(k=>IT[k]);if(cf.length)L.push('dados conferidos: '+ddJoin(cf));return L.length?'Documento de expedição conferido — '+L.join('; ')+'.':''}"
    + "function ddItemNodes(item,ctx){", 'atacadista: auxiliares');
  s = trocaEm(s, "const fotos=ctx.fotosQ[q.id]||[],ref=", "if(a.document&&typeof a.document==='object'){const dx=ddDocExped(a.document);if(dx){frases.push(dx);naF.push(dx);alguma=true;todasNA=false}}const fotos=ctx.fotosQ[q.id]||[],ref=", 'atacadista: documento de expedição');
  s = trocaEm(s, "['   Data: ',{b:true}],[semLic?'—':(ddData(lic.date)||'—'),{}],", "['   Data: ',{b:true}],[semLic?'—':(ddData(lic.date)||'—'),{}],...(!semLic&&ddTem(lic.validity)?[['   Validade: ',{b:true}],[ddData(lic.validity)||lic.validity,{}]]:[]),", 'atacadista: validade da licença');
  const det = v => "{const x="+v+"||{},dd=[ddTem(x.process)&&'processo '+x.process,ddTem(x.class)&&'classe '+x.class,ddTem(x.statusOfficial)&&'situação na fonte oficial: '+x.statusOfficial,ddTem(x.activities)&&'atividades autorizadas: '+String(x.activities).replace(/\\s*\\n\\s*/g,'; ')].filter(Boolean);if(dd.length)nodes.push({k:'p',ind:360,t:ddFim(dd.join('; ').replace(/^./,c=>c.toUpperCase()))})}";
  s = trocaEm(s, "[R.afeRe?' (RE nº '+R.afeRe+')':'',{}],['.',{}]]});", "[R.afeRe?' (RE nº '+R.afeRe+')':'',{}],['.',{}]]});" + det('af'), 'atacadista: detalhes da AFE');
  s = trocaEm(s, "[R.aeRe?' (RE nº '+R.aeRe+')':'',{}],['.',{}]]});", "[R.aeRe?' (RE nº '+R.aeRe+')':'',{}],['.',{}]]});" + det('ae'), 'atacadista: detalhes da AE');
  s = trocaEm(s, "const primeira=m.first==='Sim'||R.primeira==='Sim';", "if(ddTem(m.process))kv('Processo SEI / solicitação',m.process);const primeira=m.first==='Sim'||R.primeira==='Sim';", 'atacadista: processo SEI');
  s = trocaEm(s, "rows:[['Nome','Cargo','Contato']].concat(cont.length?cont.map(x=>[x.name,x.role||'',x.contact||'']):[['','','']])});",
    "rows:[['Nome','Cargo','Contato']].concat(cont.length?cont.map(x=>[x.name,x.role||'',x.contact||'']):[['','','']])});if(ddTem(m.contactInspection))p('Pessoas contatadas nesta inspeção: '+ddFim(m.contactInspection));", 'atacadista: pessoas contatadas');
  s = trocaEm(s, "if(D.crt&&D.crt.status)docs.push('Certidão de regularidade técnica: '+ddLc(D.crt.status)+(D.crt.number?' (nº '+D.crt.number+(D.crt.validity?', validade '+D.crt.validity:'')+')':''));if(D.avcb&&D.avcb.status)docs.push('AVCB/CLCB: '+ddLc(D.avcb.status)+(D.avcb.number?' (nº '+D.avcb.number+(D.avcb.validity?', validade '+D.avcb.validity:'')+')':''));",
    "{const c=D.crt||{},a=D.avcb||{},dc=[ddTem(c.number)&&'nº '+c.number,ddTem(c.validity)&&'validade '+(ddData(c.validity)||c.validity),ddTem(c.activity)&&'ramo de atividade: '+c.activity,ddTem(c.technical)&&'responsáveis técnicos: '+String(c.technical).replace(/\\s*\\n\\s*/g,'; '),ddTem(m.crtSchedule)&&'horários: '+m.crtSchedule].filter(Boolean),da=[ddTem(a.number)&&'nº '+a.number,ddTem(a.validity)&&'validade '+(ddData(a.validity)||a.validity),ddTem(a.issuer)&&'emitido por '+a.issuer].filter(Boolean);"
    + "if(ddTem(c.status)||dc.length)docs.push('Certidão de regularidade técnica'+(ddTem(c.status)?': '+ddLc(c.status):'')+(dc.length?' ('+dc.join('; ')+')':''));if(ddTem(a.status)||da.length)docs.push('AVCB/CLCB'+(ddTem(a.status)?': '+ddLc(a.status):'')+(da.length?' ('+da.join('; ')+')':''))}", 'atacadista: CRT e AVCB completos');
  s = trocaEm(s, "tq.map(x=>[x.kind||'',x.identification||'',x.document||'',ddData(x.date),x.range||'',[x.result,x.observations].filter(ddTem).join(' — ')])",
    "tq.map(x=>[[x.kind,x.purpose].filter(ddTem).join(' — '),x.identification||'',x.document||'',ddData(x.date),x.range||'',[x.result,ddTem(x.risk)?'pior caso: '+x.risk:'',x.observations].filter(ddTem).join(' — ')])", 'atacadista: finalidade e pior caso');
  return s;
});

/* 7n. Manipulação — dados registrados que não chegavam ao relatório (varredura
   de 01/10/2026): campos da qualificação da exaustão (8.1) e outros quadros de
   campos; opções marcadas em venda remota (meios, produtos, exigências) e
   “Outros”; laboratório contratado (nome, CNPJ, REBLAS, contrato); fabricante de
   matéria-prima vegetal e de embalagem e certificado da embalagem; observação das
   planilhas sem status marcado; POPs com número/data sem status; dados do
   documento também em Não cumpre e Não se aplica; filiais; “Outra não
   conformidade” escrita sem o botão Irregular. */
blocoAltera('app--farmacia-manipulacao', s => {
  s = trocaEm(s, "if(comp.t==='lab'){}",
    "if(comp.t==='lab'&&e===Object.values(APP_DATA.cards).flatMap(c=>c.extraItems||[]).find(x=>x.c&&x.c.t==='lab')){const l=v.fields.lab||{},ps=[l.nome&&'laboratório '+l.nome,l.cnpj&&'CNPJ '+l.cnpj,l.reblas&&'habilitação REBLAS nº '+l.reblas,l.contrato&&'contrato válido até '+manData(l.contrato)].filter(Boolean);if(ps.length)corpo+='<p>Laboratório contratado para o monitoramento: '+esc(ps.join('; '))+'.</p>'}"
    + "if(comp.t==='fields'){const fv=v.fields[iid]||{},ps=comp.f.map(([l])=>{const x=String(fv[v2Slug(l)]||'').trim();return x?l+': '+(/^\\d{4}-\\d{2}-\\d{2}$/.test(x)?manData(x):x):''}).filter(Boolean);if(ps.length)corpo+='<p>'+esc(ps.join('; '))+'.</p>'}"
    + "if(comp.t==='chips'){const k=v2Slug(comp.title),ch=(v.chips[iid]||{})[k]||{},sel=comp.opts.filter(o=>ch[o]),ou=String((v.fields[iid]||{})[k+'-outros']||'').trim();if(sel.length||ou)corpo+='<p>'+esc(comp.title+': '+v2Join(sel.map(v2Lc).concat(ou?[ou]:[]))+'.')+'</p>'}", 'manipulação: fields, chips e laboratório');
  s = trocaEm(s, "corpo+='<p>Matéria-prima vegetal '+esc(d.prod||'')+(d.lote?' (lote '+esc(d.lote)+')':'')", "corpo+='<p>Matéria-prima vegetal '+esc(d.prod||'')+(d.lote?' (lote '+esc(d.lote)+')':'')+(d.fab?', fabricante '+esc(d.fab):'')", 'manipulação: fabricante MP vegetal');
  s = trocaEm(s, "corpo+='<p>Embalagem '+esc(d.prod||'')+(d.lote?' (lote '+esc(d.lote)+')':'')", "corpo+='<p>Embalagem '+esc(d.prod||'')+(d.lote?' (lote '+esc(d.lote)+')':'')+(d.fab?', fabricante '+esc(d.fab):'')+(!d.cq&&d.cert?', certificado '+esc(d.cert):'')", 'manipulação: fabricante e certificado da embalagem');
  s = trocaEm(s, "if(fc.sistema)ptxt+=' Sistema informatizado: '+fc.sistema+'.';", "if(fc.sistema)ptxt+=' Sistema informatizado: '+fc.sistema+'.';if(fc.filiais)ptxt+=' Filiais: '+fc.filiais+'.';if((c.areas||[]).length)ptxt+=' Áreas existentes: '+v2Join(c.areas.map(a=>{const x=AREAS_LIST.find(y=>y[0]===a);return v2Lc(x?x[1]:a)}))+'.';", 'manipulação: filiais e áreas');
  s = trocaEm(s, "+(falta?' Apresentadas '+rows.length+' de '+comp.n+' análises exigidas'+v2Mk(falta)+'.':'')+'</p>';",
    "+(falta?' Apresentadas '+rows.length+' de '+comp.n+' análises exigidas'+v2Mk(falta)+'.':'')+'</p>';{const MCK=['Periodicidade atendida','Rodízio de manipuladores, fármacos e dosagens','Laudos arquivados','Metodologia e especificação farmacopeica'],mk=MCK.filter((_,i)=>(d.chk||{})[i]),mn=MCK.filter((_,i)=>!(d.chk||{})[i]);if(mk.length)corpo+='<p>Conferido: '+esc(v2Join(mk.map(v2Lc)))+'.'+(mn.length?' Não conferido: '+esc(v2Join(mn.map(v2Lc)))+'.':'')+'</p>'}", 'manipulação: conferências do monitoramento');
  s = trocaEm(s, "if(d&&d.status)pops.push([row.name,d.nr||'',manData(d.date),d.status])", "if(d&&(d.status||d.nr||d.date))pops.push([row.name,d.nr||'',manData(d.date),d.status||'situação não marcada'])", 'manipulação: POP sem status');
  s = trocaEm(s, "if(!com.length&&!par.length&&!nao.length)continue;", "if(!com.length&&!par.length&&!nao.length){if(v.obs['plan-'+g])partes.push(esc(t+': '+String(v.obs['plan-'+g]).trim().replace(/\\.?$/,'.')));continue}", 'manipulação: observação de planilha');
  s = trocaEm(s, "else if(a.status==='NC'){if(q.informativo)frases.push(esc(q.neg));else{const k=addIrr(v2ItemTitulo(iid)+': '+q.neg+(a.evidence&&a.evidence.trim()?",
    "else if(a.status==='NC'){const dtn=v2DocTxt(q.id);if(q.informativo)frases.push(esc(q.neg));else{const k=addIrr(v2ItemTitulo(iid)+': '+q.neg+(dtn?' Documento: '+dtn+'.':'')+(a.evidence&&a.evidence.trim()?", 'manipulação: documento em Não cumpre');
  s = trocaEm(s, "else if(a.status==='NA'&&evx){frases.push(esc('Não se aplica ('+evx+'): '",
    "else if(a.status==='NA'&&(evx||v2DocTxt(q.id))){frases.push(esc('Não se aplica ('+[evx,v2DocTxt(q.id)].filter(Boolean).join('; ')+'): '", 'manipulação: documento em Não se aplica');
  const n = s.split("d.xI==='I'&&d.outra").length - 1;
  if (n !== 2) throw Error('manipulação: outra irregularidade — esperava 2, achei ' + n);
  return s.split("d.xI==='I'&&d.outra").join("d.outra&&String(d.outra).trim()");
});

/* 7o. Drogaria — identificação (varredura de 01/10/2026): “Atividades constantes
   da licença” (meta.atividade_licenciada, uma por linha) e CNAE não saíam; com o
   endereço completo preenchido, bairro, município, UF e CEP digitados à parte
   eram ignorados — agora entram os que não estiverem no endereço. */
blocoAltera('rec--drogaria-report-final.js', s => {
  s = trocaEm(s, "address=text(m.endereco_completo)||join([m.endereco,m.endereco_numero,m.complemento,m.bairro,m.municipio,m.estado,m.cep]);",
    "address=text(m.endereco_completo)?join([text(m.endereco_completo)].concat([m.bairro,m.municipio,m.estado,m.cep].filter(x=>text(x)&&!String(m.endereco_completo).toLowerCase().includes(String(x).trim().toLowerCase())))):join([m.endereco,m.endereco_numero,m.complemento,m.bairro,m.municipio,m.estado,m.cep]);", 'drogaria: endereço + componentes');
  s = trocaEm(s, "kv(B,'Atividades licenciadas',(s.fields?.atividades_licenciadas||[]).join('; '));",
    "kv(B,'Atividades licenciadas',[...new Set((s.fields?.atividades_licenciadas||[]).concat(String(m.atividade_licenciada||'').split(/\\n+/).map(x=>x.trim()).filter(Boolean)))].join('; '));if(text(m.cnae))kv(B,'CNAE',m.cnae);", 'drogaria: atividades da licença e CNAE');
  /* Word: as seções refeitas a partir das respostas (SNGPC, estoque, resíduos…) usam
     só a frase da resposta e perdiam a “Observação factual”. Conferência final: toda
     observação registrada que não estiver no texto entra antes do item 11. */
  s = trocaEm(s, "x9(B,s);B.push(...(C['10']||[]));",
    "x9(B,s);B.push(...(C['10']||[]));{const J=JSON.stringify(B),obs=(base.records||[]).filter(r=>text(r.observacao)&&!J.includes(JSON.stringify(String(r.observacao).trim()).slice(1,-1).slice(0,60)));if(obs.length){p(B,'Observações registradas nas verificações:');obs.forEach(r=>B.push({t:'num',n:'•',x:[r.grupo,r.contexto].filter(x=>text(x)).filter((x,i,a)=>a.indexOf(x)===i).join(' — ')+(r.grupo||r.contexto?': ':'')+String(r.observacao).trim()}))}}", 'drogaria: observações no Word');
  return s;
});

/* 7p. Evidência digitada em pergunta sem situação marcada (nem Cumpre, nem Não
   cumpre, nem Não se aplica): Atacadista e Manipulação descartavam o texto. Agora
   sai como “Sem situação marcada — pergunta: anotação”, para a equipe ver na
   prévia e decidir antes de emitir. */
blocoAltera('app--distribuidoras-transportadoras', s => trocaEm(s, "else if(a.status==='NA'){const ev=String(a.evidence",
  "else if(!a.status){const ev=String(a.evidence||'').trim().replace(/\\s*\\n\\s*/g,'; ').replace(/\\.$/,''),ck=(state.checklists||{})[q.id],cl=Array.isArray(ck)?ck:ddLista(ck),tx=[ev,cl.length?'itens verificados: '+ddJoin(cl.map(ddLc)):''].filter(Boolean).join('; ');if(tx){const nf='Sem situação marcada — '+String(q.text||'').replace(/\\s*\\?\\s*$/,'')+': '+tx+'.';frases.push(nf);naF.push(nf)}}"
  + "else if(a.status==='NA'){const ev=String(a.evidence", 'atacadista: anotação sem situação'));
blocoAltera('app--farmacia-manipulacao', s => trocaEm(s, "else if(a.status==='NC'){const dtn=v2DocTxt(q.id);",
  "else if(!a.status&&(evx||v2DocTxt(q.id))){frases.push(esc('Sem situação marcada — '+String(q.text||q.pos).replace(/\\s*\\?\\s*$/,'')+': '+[evx,v2DocTxt(q.id)].filter(Boolean).join('; ')+'.'))}"
  + "else if(a.status==='NC'){const dtn=v2DocTxt(q.id);", 'manipulação: anotação sem situação'));

/* 7q. Central — consulta por CNPJ: os grupos eram ordenados pela quantidade, e numa
   indústria os centenas de registros de produto empurravam a AFE/AE para o fim.
   Agora AFE/AE vem sempre primeiro e aberta; dentro dela, ativas antes das
   canceladas, classe de medicamento e insumo antes das demais, AFE antes de AE.
   Os outros grupos seguem pela quantidade, com os registros ativos antes dos
   inativos ou cancelados. */
blocoAltera('app--central-consultas', s => {
  s = trocaEm(s, "const bases=[...porBase.entries()].sort((a,b)=>b[1].length-a[1].length);",
    "const prio=b=>b==='afe_ae'?0:1,ordAfe=x=>[/^(sim|s|ativ)/i.test(String(x.ativo||x.situacao||''))?0:1,/medicament/i.test(x.classe||'')?0:/insumo/i.test(x.classe||'')?1:2,String(x.tipo||'').toUpperCase()==='AFE'?0:1];"
    + "if(porBase.has('afe_ae'))porBase.get('afe_ae').sort((a,b)=>{const p=ordAfe(a),q=ordAfe(b);for(let k=0;k<p.length;k++)if(p[k]!==q[k])return p[k]-q[k];return 0});"
    + "if(!kind){const inat=x=>/^(inativ|cancel|vencid|caduc|n$|não)/i.test(String(x.situacao||x.ativo||'').trim())?1:0;for(const [k,l] of porBase)if(k!=='afe_ae')l.sort((a,b)=>inat(a)-inat(b))}"
    + "const bases=[...porBase.entries()].sort((a,b)=>prio(a[0])-prio(b[0])||b[1].length-a[1].length);", 'central: AFE/AE primeiro');
  return trocaEm(s, "const aberto=(bases.length===1||lista.length<=6||i===0)?' open':'';",
    "const aberto=(bases.length===1||lista.length<=6||i===0||b==='afe_ae')?' open':'';", 'central: AFE/AE aberta');
});

/* 7r. Microfone (ditado) e localização (carimbo das fotos) dentro do roteiro, que
   abre num iframe: a permissão precisa ser delegada a ele. */
troca('<iframe id="quadro" title="Roteiro"', '<iframe id="quadro" title="Roteiro" allow="microphone; geolocation; camera"', 'iframe: microfone e localização');

/* 8. Versão. */
trocaRx(/const APP_VERSAO = '[^']+';/, `const APP_VERSAO = '${VERSAO}';`, 'APP_VERSAO');
trocaRx(/<span id="casca-versao">v[^ <]+/, `<span id="casca-versao">v${VERSAO}`, 'versão rodapé');

/* 9. Visual da tela inicial e da lista. Vem por último para prevalecer. */
const [dro, man, ata] = ['--t-dro', '--t-man', '--t-ata'].map(k => PALETA[k]);
const tokens = ['--t-dro', '--t-man', '--t-ata'].map(k => `${k}:${PALETA[k][0]};${k}-d:${PALETA[k][1]};${k}-w:${PALETA[k][2]};`).join('\n  ');
const estilo = `<style id="medicamentos-visual">
:root{
  --brand:${PALETA.brand};--brand-strong:${PALETA.brandStrong};--brand-soft:${PALETA.brandWash};
  ${tokens}
}
body{background:#F3F5F7!important}
.hero{background:#fff!important;border:1px solid #DCE3E8!important;box-shadow:inset 0 4px 0 var(--brand),0 8px 24px rgba(13,40,52,.06)!important}
.hero .brand{color:#1D2B33!important}
.brand-mark{color:var(--brand)!important}
.hero #titulo-principal{display:block!important;width:100%!important;margin:4px auto 0!important;text-align:center!important;color:var(--brand)!important;font-size:1.02rem!important;font-weight:650!important;letter-spacing:.02em!important}
.quick-action.primary{background:var(--brand)!important;border-color:var(--brand)!important;box-shadow:0 8px 18px rgba(13,79,92,.18)!important}
.quick-action.primary:hover,.quick-action.primary:focus-visible{background:var(--brand-strong)!important;border-color:var(--brand-strong)!important}
.section-heading h2{color:#4A5E6A!important}
.nuclei-grid.med-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
.med-card{display:grid!important;grid-template-columns:56px minmax(0,1fr) 34px!important;align-items:center!important;justify-items:stretch!important;gap:16px!important;min-height:112px!important;aspect-ratio:auto!important;padding:18px 16px 18px 20px!important;border:1px solid #DCE3E8!important;border-left:5px solid var(--tone)!important;border-radius:14px!important;background:#fff!important;color:#1B262D!important;text-align:left!important;box-shadow:0 4px 14px rgba(13,40,52,.05)!important}
.med-card:hover,.med-card:focus-visible{border-color:color-mix(in srgb,var(--tone) 45%,#DCE3E8)!important;border-left-color:var(--tone)!important;box-shadow:0 10px 24px rgba(13,40,52,.10)!important;transform:translateY(-1px)}
.med-card .nucleus-symbol{width:56px!important;height:56px!important;border-radius:14px!important;background:var(--tone)!important;color:#fff!important;border:0!important;box-shadow:none!important}
.med-card .nucleus-symbol svg{width:28px!important;height:28px!important}
.med-card .nucleus-content{align-items:flex-start!important}
.med-card .nucleus-content strong{color:#16232B!important;font-size:1.04rem!important;font-weight:700!important;text-align:left!important}
.med-card .nucleus-content span{display:block!important;margin-top:3px!important;color:#5A6972!important;font-size:.83rem!important;line-height:1.4!important}
.med-card .nucleus-content em{display:inline-block!important;margin-top:9px!important;padding:3px 9px!important;border-radius:999px!important;background:var(--wash)!important;color:var(--tone-dark)!important;font-size:.68rem!important;font-style:normal!important;font-weight:700!important;letter-spacing:.05em!important;text-transform:uppercase!important}
.med-card .card-arrow{display:grid!important;width:34px;height:34px;place-items:center;border:1px solid #DCE3E8;border-radius:50%;background:#fff;color:var(--tone)}
.med-card:hover .card-arrow{background:var(--tone);border-color:var(--tone);color:#fff}
.med-card[data-nucleo="Drogaria"]{--tone:${dro[0]};--tone-dark:${dro[1]};--wash:${dro[2]}}
.med-card[data-nucleo="Manipulação"]{--tone:${man[0]};--tone-dark:${man[1]};--wash:${man[2]}}
.med-card[data-nucleo="Atacadista de medicamentos"]{--tone:${ata[0]};--tone-dark:${ata[1]};--wash:${ata[2]}}
@media(max-width:700px){
 .nuclei-grid.med-grid{grid-template-columns:1fr!important;gap:10px!important}
 .med-card{grid-template-columns:48px minmax(0,1fr) 30px!important;gap:13px!important;min-height:92px!important;padding:14px 12px 14px 15px!important}
 .med-card .nucleus-symbol{width:48px!important;height:48px!important;border-radius:12px!important}
 .med-card .nucleus-symbol svg{width:24px!important;height:24px!important}
 .med-card .nucleus-content strong{font-size:.98rem!important}
 .med-card .nucleus-content span{font-size:.8rem!important}
 .med-card .card-arrow{width:30px;height:30px}
}
</style>
`;
const tomJs = `<script id="medicamentos-tom">
window.__medTom=function(fonte,tom,tomD){
  if(!tom||!tomD)return fonte;
  return fonte.replace(/#(365B73|2F4655|304F63|2B485C|205777|263F50)\\b/gi,function(m,h){h=h.toUpperCase();return (h==='365B73'||h==='2F4655')?tom:tomD;});
};
</script>
`;
troca('<script id="inspecoes-salvas">', estilo + tomJs + '<script id="inspecoes-salvas">', 'estilo');

/* Nada de outros núcleos pode sobrar na casca. */
for (const app of APPS_FORA) if (new RegExp(`id="app--${app}"`).test(h)) throw Error('sobrou ' + app);

fs.writeFileSync(path.join(RAIZ, 'index.html'), h);
console.log('index.html', (h.length / 1e6).toFixed(2), 'MB · versão', VERSAO);
