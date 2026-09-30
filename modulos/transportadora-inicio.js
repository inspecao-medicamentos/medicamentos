/* Transportadora de medicamentos — entra no início do <head> do módulo da
   distribuidora quando aberto pelo card Transportadora (build/montar.cjs).
   Dá à transportadora rascunho e fotos próprios, sem tocar no código do módulo:
   - as chaves de localStorage do módulo ganham o prefixo “transp:”;
   - os escopos de foto do RoteiroEvidence (“dist-card-N”) viram “transp-dist-card-N”;
   - as Salvas da casca tratam o roteiro como “transportadora”.
   Assim um atacadista e uma transportadora podem estar em andamento ao mesmo tempo. */
(function(){
  'use strict';
  window.__uvisAppSalvas = 'transportadora';
  var P = 'transp:', CHAVES = {'uvis-dist-bpdiat-v2': 1, 'dist-anexo2-campos-v1': 1, 'distribuidoras-transportadoras-v2': 1, 'uvis-previa-distribuidoras-transportadoras': 1};
  var S = Storage.prototype, get = S.getItem, set = S.setItem, rem = S.removeItem;
  function k(x){ x = String(x); return (this === window.localStorage && CHAVES[x]) ? P + x : x; }
  S.getItem = function(x){ return get.call(this, k.call(this, x)); };
  S.setItem = function(x, v){ return set.call(this, k.call(this, x), v); };
  S.removeItem = function(x){ return rem.call(this, k.call(this, x)); };
  function embrulha(R){
    if(!R || R.__transp) return R;
    ['read', 'save', 'remove', 'clear'].forEach(function(m){
      if(typeof R[m] !== 'function') return;
      var o = R[m];
      R[m] = function(scope){ var a = [].slice.call(arguments); if(typeof scope === 'string' && scope.indexOf('dist-') === 0) a[0] = 'transp-' + scope; return o.apply(this, a); };
    });
    R.__transp = true; return R;
  }
  var real = window.RoteiroEvidence;
  Object.defineProperty(window, 'RoteiroEvidence', {configurable: true, get: function(){ return real; }, set: function(v){ real = embrulha(v); }});
  if(real) embrulha(real);
})();
