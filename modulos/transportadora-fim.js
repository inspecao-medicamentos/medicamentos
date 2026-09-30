/* Transportadora de medicamentos — entra no fim do <body> do módulo da
   distribuidora (ver variante-inicio.js). Numa inspeção nova (sem
   atividades marcadas), marca a atividade “Transportar” e deixa como “Não se
   aplica” as verificações próprias de distribuidora; a equipe pode mudar
   qualquer marcação. O título do cabeçalho passa a ser o da transportadora. */
(function(){
  'use strict';
  var NA = [
    'q328', 'q329', 'q330', 'q331',                 /* cadastro e qualificação de fornecedores e clientes */
    'q334', 'q335', 'q336', 'q337', 'q338',         /* recolhimento: POP, mapa de distribuição, simulação, devolvidos */
    'qta-01', 'qta-02', 'qta-03', 'qte-01', 'qte-02' /* qualificação térmica de áreas e equipamentos de armazenagem */
  ];
  for(var i = 1; i <= 16; i++) NA.push('ifa-' + (i < 10 ? '0' : '') + i); /* IFA destinado à manipulação */
  function preset(){
    if(typeof state === 'undefined' || typeof save !== 'function') return false;
    var m = state.meta || (state.meta = {});
    if(m.activities && m.activities.length) return true;
    m.activities = ['Transportar'];
    state.answers = state.answers || {};
    NA.forEach(function(id){ var a = state.answers[id]; if(!a || !a.status) state.answers[id] = {status: 'NA', transp: true}; });
    save();
    try { if(typeof renderHome === 'function') renderHome(); } catch(e){}
    return true;
  }
  function titulo(){
    /* só os nós de texto: o cabeçalho tem subtítulo e botões dentro do mesmo bloco */
    var w = document.createTreeWalker(document.querySelector('header') || document.body, NodeFilter.SHOW_TEXT), n;
    while((n = w.nextNode())) if(/distribuidora\s*\/\s*transportadora/i.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/distribuidora\s*\/\s*transportadora/i, 'Transportadora de medicamentos');
    document.title = 'Transportadora de medicamentos';
  }
  function inicia(){ preset(); titulo(); setTimeout(titulo, 400); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
