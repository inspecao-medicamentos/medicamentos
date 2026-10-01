/* Ditado (modulos/ditado.js): conversão de números, horas e datas falados conforme
   o tipo do campo, e texto livre sem conversão. Roda num Chromium com uma página
   mínima de campos; não usa microfone. */
const path = require('node:path'), fs = require('node:fs');
const {execSync} = require('node:child_process');
const pw = require(execSync('npm root -g').toString().trim() + '/playwright');
const JS = fs.readFileSync(path.join(__dirname, '..', 'modulos', 'ditado.js'), 'utf8');
const HTML = `<!doctype html><meta charset="utf-8"><body>
<label>Número de funcionários <input id="func" type="text"></label>
<label>Temperatura da geladeira (°C) <input id="temp" type="number"></label>
<label>Horário de funcionamento <input id="hfun" type="text"></label>
<label>Hora de chegada <input id="hora" type="time"></label>
<label>Data da inspeção <input id="data" type="date"></label>
<label>Validade da licença <input id="val" type="text"></label>
<label>CNPJ <input id="cnpj" type="text"></label>
<label>Processo SEI <input id="proc" type="text"></label>
<label>Razão social <input id="nome" type="text"></label>
<textarea id="obs"></textarea></body>`;
const ANO = new Date().getFullYear();
/* [campo, falado, esperado: {valor} troca o conteúdo; {txt} entra no cursor] */
const CASOS = [
  ['func', 'cinco', {valor: '5'}],
  ['func', 'são doze funcionários', {valor: '12'}],
  ['func', 'cento e vinte e cinco', {valor: '125'}],
  ['func', '7', {valor: '7'}],
  ['func', 'vinte e cinco', {valor: '25'}],
  ['func', 'mil e duzentos', {valor: '1200'}],
  ['func', 'dois mil e vinte e seis', {valor: '2026'}],
  ['func', 'trezentos e quarenta e dois', {valor: '342'}],
  ['temp', 'quatro vírgula cinco', {valor: '4.5'}],
  ['temp', 'menos dois', {valor: '2'}],
  ['hfun', 'segunda a sexta das oito às dezoito', {txt: 'segunda a sexta das 08:00 às 18:00'}],
  ['hfun', 'sábado das oito e meia ao meio-dia', {txt: 'sábado das 08:30 ao 12:00'}],
  ['hora', 'oito e meia', {valor: '08:30'}],
  ['hora', 'catorze e quinze', {valor: '14:15'}],
  ['hora', 'nove horas', {valor: '09:00'}],
  ['hora', '10 horas e 5 minutos', {valor: '10:05'}],
  ['data', 'primeiro de outubro de dois mil e vinte e seis', {valor: '2026-10-01'}],
  ['data', '15 de março de 2025', {valor: '2025-03-15'}],
  ['data', 'cinco de maio', {valor: ANO + '-05-05'}],
  ['val', 'trinta e um de dezembro de dois mil e vinte e sete', {valor: '31/12/2027'}],
  ['val', 'outubro de 2027', {valor: '10/2027'}],
  ['cnpj', '57 507 378 0003 65', {txt: '57507378000365'}],
  ['proc', '6068 barra 2025 traço 12', {txt: '6068/2025-12'}],
  ['nome', 'drogaria cinco irmãos', null],
  ['obs', 'havia cinco caixas no chão', null],
];
(async () => {
  const b = await pw.chromium.launch(), p = await b.newPage(); let falhas = 0;
  await p.setContent(HTML); await p.addScriptTag({content: JS});
  for (const [id, fala, esp] of CASOS) {
    const r = await p.evaluate(([id, fala]) => { const T = window.__medDitadoTeste, el = document.getElementById(id); return {tipo: T.tipoCampo(el), cv: T.converte(fala, T.tipoCampo(el), el)}; }, [id, fala]);
    const ok = JSON.stringify(r.cv) === JSON.stringify(esp);
    if (!ok) falhas++;
    console.log(`${ok ? 'ok   ' : 'FALHA'} ${id.padEnd(5)} [${r.tipo}] “${fala}” → ${JSON.stringify(r.cv)}${ok ? '' : '  esperado ' + JSON.stringify(esp)}`);
  }
  await b.close();
  console.log(falhas ? `${falhas} falha(s)` : 'TUDO OK');
  process.exitCode = falhas ? 1 : 0;
})();
