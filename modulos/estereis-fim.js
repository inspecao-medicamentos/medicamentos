/* Manipulação de estéreis — fim do <body> do módulo da manipulação (ver
   variante-inicio.js). O bloco 13 (Anexo IV) entra nos dados pelo build; aqui
   só o título do cabeçalho passa a ser o do roteiro. */
(function(){
  'use strict';
  function titulo(){
    var w = document.createTreeWalker(document.querySelector('header') || document.body, NodeFilter.SHOW_TEXT), n;
    while((n = w.nextNode())) if(/farm[áa]cia com manipula[çc][ãa]o/i.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/farm[áa]cia com manipula[çc][ãa]o/i, 'Manipulação de estéreis');
    document.title = 'Manipulação de estéreis';
  }
  function inicia(){ titulo(); setTimeout(titulo, 400); setTimeout(titulo, 1500); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
