/* Variante de um módulo herdado — entra no início do <head> quando o roteiro é
   aberto por um card que reaproveita o módulo de outro (build/montar.cjs):
   Transportadora (módulo da distribuidora) e Manipulação de estéreis (módulo
   da manipulação). Dá à variante rascunho e fotos próprios, sem tocar no código:
   - as chaves de localStorage do módulo ganham um prefixo (V.prefixo);
   - os escopos de foto do RoteiroEvidence que começam por V.escopo ganham o
     mesmo prefixo, sem os dois-pontos (ex.: “dist-card-2” → “transp-dist-card-2”);
   - as Salvas da casca tratam o roteiro pelo nome da variante (V.app).
   window.__uvisVariante = {app, prefixo, chaves: [...], escopo} vem antes deste script. */
(function(){
  'use strict';
  var V = window.__uvisVariante, CH = {};
  if(!V) return;
  window.__uvisAppSalvas = V.app;
  V.chaves.forEach(function(c){ CH[c] = 1; });
  var P = V.prefixo, PF = P.replace(/:$/, '') + '-';
  var S = Storage.prototype, get = S.getItem, set = S.setItem, rem = S.removeItem;
  function k(x){ x = String(x); return (this === window.localStorage && CH[x]) ? P + x : x; }
  S.getItem = function(x){ return get.call(this, k.call(this, x)); };
  S.setItem = function(x, v){ return set.call(this, k.call(this, x), v); };
  S.removeItem = function(x){ return rem.call(this, k.call(this, x)); };
  function embrulha(R){
    if(!R || R.__variante) return R;
    ['read', 'save', 'remove', 'clear'].forEach(function(m){
      if(typeof R[m] !== 'function') return;
      var o = R[m];
      R[m] = function(scope){ var a = [].slice.call(arguments); if(typeof scope === 'string' && scope.indexOf(V.escopo) === 0) a[0] = PF + scope; return o.apply(this, a); };
    });
    R.__variante = true; return R;
  }
  var real = window.RoteiroEvidence;
  Object.defineProperty(window, 'RoteiroEvidence', {configurable: true, get: function(){ return real; }, set: function(v){ real = embrulha(v); }});
  if(real) embrulha(real);
})();
