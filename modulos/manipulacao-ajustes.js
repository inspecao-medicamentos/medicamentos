/* Manipulação — ajustes do site Medicamentos (build/montar.cjs coloca no fim
   do módulo).
   “Outra irregularidade — descrever” / “Outra falha — descrever”: o texto só
   entra no relatório com o botão “Irregular” da mesma linha marcado. Ao
   preencher o texto, o botão é marcado sozinho (desmarcar continua possível). */
(function(){
  'use strict';
  window.addEventListener('change', function(e){
    var t = e.target;
    if(!t || t.tagName !== 'INPUT' || !/^Outra (irregularidade|falha) — descrever$/.test(t.placeholder || '') || !t.value.trim()) return;
    var linha = t.closest('.v2-row'), b = linha && linha.querySelector('button[data-v2t$="|I"]');
    if(b && b.getAttribute('aria-pressed') !== 'true') setTimeout(function(){
      /* o módulo pode redesenhar a linha ao salvar o texto: busca o botão de novo */
      var x = document.querySelector('button[data-v2t="' + b.dataset.v2t + '"]') || b;
      if(x.getAttribute('aria-pressed') !== 'true') x.click();
    }, 60);
  }, true);
})();
