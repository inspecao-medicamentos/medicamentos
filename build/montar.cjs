#!/usr/bin/env node
/* Gera o site Medicamentos (uvisvp.github.io/medicamentos) a partir do
   index.html do repositório roteiros.

   Os módulos de drogaria, manipulação, distribuidora, a Central de Consultas,
   o estoque e o banco normativo vêm do roteiros sem alteração. Assim uma
   correção feita lá chega aqui ao rodar de novo este script. Aqui mudam só:
   - a tela inicial: quatro cards horizontais (Drogaria, Manipulação,
     Atacadista, Transportadora) e uma paleta própria;
   - a lista de roteiros de cada card;
   - os módulos provisórios dos roteiros novos (EAC, vacinação, estéreis,
     gases medicinais e transportadora), até cada um ser escrito;
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
  brand: '#0D4F5C', brandStrong: '#093C47', brandWash: '#E7F0F2',
  '--t-dro': ['#1E5A8A', '#174668', '#E8F0F7'],
  '--t-man': ['#0F6962', '#0B504B', '#E5F2F0'],
  '--t-ata': ['#3C4B78', '#2E3A5E', '#ECEEF5'],
  '--t-tra': ['#55606E', '#424B56', '#EEF0F2']
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
  'manipulacao-estereis': '<path d="M12 3c3.5 4.2 5.5 7.4 5.5 10a5.5 5.5 0 0 1-11 0C6.5 10.4 8.5 7.2 12 3zM9.5 14.5l2 2 3.5-4"/>',
  'gases-medicinais': '<path d="M9 7h6v13a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zM10 7V4.5A1.5 1.5 0 0 1 11.5 3h1A1.5 1.5 0 0 1 14 4.5V7M9 11h6"/>'
});
trocaRx(/var ICONES = \{[\s\S]*?\n  \};/, () => `var ICONES = ${JSON.stringify(icones, null, 2).replace(/\n/g, '\n  ')};`, 'ICONES');

/* 6. Inspeções salvas: o núcleo de cada roteiro passa a ser o card. */
troca("'drogaria':{nome:'Drogaria',nucleo:'Medicamentos',", "'drogaria':{nome:'Drogaria',nucleo:'Drogaria',", 'salvas drogaria');
troca("'farmacia-manipulacao':{nome:'Farmácia com Manipulação',nucleo:'Medicamentos',", "'farmacia-manipulacao':{nome:'Farmácia com Manipulação',nucleo:'Manipulação',", 'salvas manipulação');
troca("'distribuidoras-transportadoras':{nome:'Distribuidora / transportadora',nucleo:'Medicamentos',", "'distribuidoras-transportadoras':{nome:'Atacadista de medicamentos',nucleo:'Atacadista de medicamentos',", 'salvas atacadista');
/* Salvas dos roteiros simples: respostas e fotos ficam no mesmo registro. */
troca("  'odontologia':{nome:'Odontologia',nucleo:'Odontologia',", "  'manipulacao-estereis':{nome:'Manipulação de estéreis',nucleo:'Manipulação',ls:['esteril:uvisvp_manipulacao_v1','esteril:uvis-previa-farmacia-manipulacao'],fotos:['esteril-manipulacao-']},\n  'transportadora':{nome:'Transportadora de medicamentos',nucleo:'Transportadora de medicamentos',ls:['transp:uvis-dist-bpdiat-v2','transp:dist-anexo2-campos-v1','transp:distribuidoras-transportadoras-v2','transp:uvis-previa-distribuidoras-transportadoras'],fotos:['transp-dist-'],barra:'header.top .topin'},\n" + PRONTOS.map(d => {
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

/* 7e. Variantes: cards que reaproveitam o módulo de outro, com rascunho e
   fotos próprios (modulos/variante-inicio.js) e ajustes no fim do módulo.
   - Transportadora: módulo da distribuidora; atividade Transportar e partes de
     distribuidora em “Não se aplica” (transportadora-fim.js).
   - Manipulação de estéreis: módulo da manipulação com o bloco 13, Anexo IV da
     RDC 67/2007 (modulos/estereis/cartao13.json, gerado por estereis/gerar.py). */
const le = f => fs.readFileSync(path.join(RAIZ, 'modulos', f), 'utf8');
const jsStr = t => JSON.stringify(t).replace(/<\//g, '<\\/');
const CARTAO13 = JSON.parse(le('estereis/cartao13.json'));
const VARIANTES = {
  transportadora: {base: 'distribuidoras-transportadoras', app: 'transportadora', prefixo: 'transp:', escopo: 'dist-',
    chaves: ['uvis-dist-bpdiat-v2', 'dist-anexo2-campos-v1', 'distribuidoras-transportadoras-v2', 'uvis-previa-distribuidoras-transportadoras'],
    fim: le('transportadora-fim.js')},
  'manipulacao-estereis': {base: 'farmacia-manipulacao', app: 'manipulacao-estereis', prefixo: 'esteril:', escopo: 'manipulacao-',
    chaves: ['uvisvp_manipulacao_v1', 'uvis-previa-farmacia-manipulacao'],
    dados: ['const APP_DATA={"cards":{', 'const APP_DATA={"cards":{"13":' + JSON.stringify(CARTAO13) + ','],
    fim: le('estereis-fim.js')}
};
const VAR_INI = le('variante-inicio.js');
/* no site Medicamentos o módulo da distribuidora, aberto pelo card Atacadista, leva o nome do card */
const ATACADISTA_TIT = "(function(){function t(){var w=document.createTreeWalker(document.querySelector('header')||document.body,NodeFilter.SHOW_TEXT),n;while((n=w.nextNode()))if(/distribuidora\\s*\\/\\s*transportadora/i.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/distribuidora\\s*\\/\\s*transportadora/i,'Atacadista de medicamentos')}function i(){t();setTimeout(t,400)}document.readyState==='loading'?document.addEventListener('DOMContentLoaded',i):i()})();";
const VARIANTES_JS = '{' + Object.entries(VARIANTES).map(([k, v]) => JSON.stringify(k) + ':{base:' + JSON.stringify(v.base)
  + ',ini:' + jsStr('window.__uvisVariante=' + JSON.stringify({app: v.app, prefixo: v.prefixo, chaves: v.chaves, escopo: v.escopo}) + ';' + VAR_INI)
  + ',fim:' + jsStr(v.fim) + (v.dados ? ',dados:[' + jsStr(v.dados[0]) + ',' + jsStr(v.dados[1]) + ']' : '') + '}').join(',') + '}';
troca('  function montar(app){',
  `  var VARIANTES = ${VARIANTES_JS};
  function montar(app){ var v = VARIANTES[app]; if(v) return montarVariante(v); var s = montarBase(app);
    if(app === 'distribuidoras-transportadoras'){ var k = s.lastIndexOf('</body>'); s = s.slice(0, k) + '<scr' + 'ipt>' + ${jsStr(ATACADISTA_TIT)} + '</scr' + 'ipt>' + s.slice(k); }
    return s; }
  function montarVariante(v){
    var s = montarBase(v.base);
    if(v.dados){ if(s.indexOf(v.dados[0]) < 0) throw new Error('dados da variante não encontrados'); s = s.replace(v.dados[0], function(){ return v.dados[1]; }); }
    s = s.replace(/<head(\\s[^>]*)?>/i, function(m){ return m + '<scr' + 'ipt>' + v.ini + '</scr' + 'ipt>'; });
    var k = s.lastIndexOf('</body>');
    return s.slice(0, k) + '<scr' + 'ipt>' + v.fim + '</scr' + 'ipt>' + s.slice(k);
  }
  function montarBase(app){`, 'variantes: montar');
troca('window.parent.UvisSalvas.novaInspecao(modulo)', 'window.parent.UvisSalvas.novaInspecao(window.__uvisAppSalvas||modulo)', 'variantes: apagar inspeção');
troca("if(window.RoteiroEvidence)for(var k=1;k<=12;k++)await RoteiroEvidence.clear('manipulacao-card-'+k);", "if(window.RoteiroEvidence)for(var k=1;k<=13;k++)await RoteiroEvidence.clear('manipulacao-card-'+k);", 'manipulação: fotos do bloco 13');

/* 7c. Tom do módulo: drogaria, manipulação e atacadista trazem o ardósia do
   roteiros fixo no código (#365B73 e vizinhos). Ao montar, essa família vira o
   tom do card aberto; a Central (sem card) fica como está. */
troca("try { fonte = montar(app);", "try { fonte = montar(app); if(nucleoAtual && window.__medTom) fonte = window.__medTom(fonte, css(VAR_NUCLEO[nucleoAtual], ''), css(VAR_NUCLEO[nucleoAtual] + '-d', ''));", 'tom do módulo');

/* 8. Versão. */
trocaRx(/const APP_VERSAO = '[^']+';/, `const APP_VERSAO = '${VERSAO}';`, 'APP_VERSAO');
trocaRx(/<span id="casca-versao">v[^ <]+/, `<span id="casca-versao">v${VERSAO}`, 'versão rodapé');

/* 9. Visual da tela inicial e da lista. Vem por último para prevalecer. */
const [dro, man, ata, tra] = ['--t-dro', '--t-man', '--t-ata', '--t-tra'].map(k => PALETA[k]);
const tokens = ['--t-dro', '--t-man', '--t-ata', '--t-tra'].map(k => `${k}:${PALETA[k][0]};${k}-d:${PALETA[k][1]};${k}-w:${PALETA[k][2]};`).join('\n  ');
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
.med-card[data-nucleo="Transportadora de medicamentos"]{--tone:${tra[0]};--tone-dark:${tra[1]};--wash:${tra[2]}}
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
