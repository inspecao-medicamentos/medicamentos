/* Ditado por voz nos campos de texto de todos os roteiros (build/montar.cjs coloca
   no fim de cada roteiro, junto com campo.js): textos longos e campos de uma linha,
   exceto os de número, data, CNPJ/CPF, telefone, e-mail e similares.
   - Ao entrar num campo, aparece o botão 🎤 no canto; um toque começa a ouvir,
     outro toque para. Sair do campo também para.
   - O texto entra onde está o cursor, com espaço e maiúscula ajustados.
   - Comandos falados: “vírgula”, “ponto final”, “ponto e vírgula”,
     “dois pontos”, “nova linha” / “novo parágrafo”.
   - Usa o reconhecimento de voz do navegador (Chrome no Android, Safari no
     iPad/iPhone). No Chrome, o reconhecimento depende de internet; sem rede,
     o botão avisa. Navegador sem reconhecimento de voz: o botão aparece e, ao
     toque, explica como usar o microfone do teclado. */
(function(){
 'use strict';
 if(window.__medDitado)return;window.__medDitado=true;
 function SR_(){return window.SpeechRecognition||window.webkitSpeechRecognition}
 var tocando=0,bt=null,alvo=null,rec=null,ouvindo=false,bolha=null,ultimoErro='';

 var st=document.createElement('style');
 st.textContent='.med-dit{position:absolute;z-index:2147483400;width:40px;height:40px;border-radius:50%;border:1px solid #b9c3cc;background:#fff;color:#123;font-size:19px;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.18);cursor:pointer;padding:0}'
  +'.med-dit.curto{width:34px;height:34px;font-size:16px}'
  +'.med-dit[aria-pressed="true"]{background:#c0182b;border-color:#c0182b;color:#fff;animation:medDit 1.2s infinite}'
  +'@keyframes medDit{50%{box-shadow:0 0 0 7px rgba(192,24,43,.18)}}'
  +'.med-dit-b{position:absolute;z-index:2147483400;max-width:min(80vw,420px);background:#123;color:#fff;font:13px/1.35 system-ui,sans-serif;padding:6px 10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.25);pointer-events:none}'
  +'@media (prefers-reduced-motion:reduce){.med-dit[aria-pressed="true"]{animation:none}}';
 document.head.appendChild(st);

 /* telas que se redesenham a cada digitação (Atacadista): reencontra o mesmo campo pelos atributos */
 function chaveSel(el){var a=[].slice.call(el.attributes).filter(function(x){return /^(data-|name$|id$)/.test(x.name)&&x.name!=='data-alvo'&&x.name!=='data-med-dit-pr'});return a.length?el.tagName.toLowerCase()+a.map(function(x){return '['+x.name+'="'+String(x.value).replace(/"/g,'\\"')+'"]'}).join(''):''}
 function reancora(){if(!alvo||alvo.isConnected)return !!alvo;var k=alvo.__medChave,n=null;try{n=k&&document.querySelector(k)}catch(e){}if(!n)return false;alvo=n;alvo.__medChave=k;folga(alvo,true);try{alvo.focus({preventScroll:true});var L=alvo.value.length;alvo.setSelectionRange(L,L)}catch(e){}setTimeout(posiciona,0);return true}
 var NAO=/cnpj|cpf|\bcep\b|telefone|celular|fone|e-?mail|\bdata\b|validade|vencimento|\bn[º°o.]\s|n[º°]$|n[uú]mero|registro|processo|\blote|cnes|autoriza|\bafe\b|\bae\b|\bano\b|hora|quantidade|qtd|temperatura|senha|buscar|pesquis/i;
 function rotulo(el){var l=el.closest('label'),t=l?l.textContent:'';if(!t&&el.id){var x=document.querySelector('label[for="'+el.id+'"]');if(x)t=x.textContent}return [t,el.name,el.id,el.placeholder,el.getAttribute('aria-label'),el.getAttribute('data-path'),el.getAttribute('data-field')].join(' ')}
 function elegivel(el){if(!el||el.readOnly||el.disabled||el.closest('.mfm,#cmp-modal'))return false;if(el.tagName==='TEXTAREA')return true;
  if(el.tagName!=='INPUT'||!/^(text|)$/i.test(el.getAttribute('type')||''))return false;if(/numeric|decimal|tel|email/.test(el.inputMode||''))return false;return !NAO.test(rotulo(el))}
 function posiciona(){if(!bt||!alvo)return;if(!alvo.isConnected&&!reancora()){esconde();return}var r=alvo.getBoundingClientRect();
  if(!r.width||!r.height){esconde();return}
  var curto=r.height<56;bt.classList.toggle('curto',curto);
  bt.style.left=(window.scrollX+r.right-(curto?38:46))+'px';bt.style.top=(window.scrollY+(curto?r.top+(r.height-34)/2:r.bottom-46))+'px';
  if(bolha){bolha.style.left=(window.scrollX+Math.max(8,r.left))+'px';bolha.style.top=(window.scrollY+r.top-bolha.offsetHeight-6)+'px'}}
 function folga(el,on){if(!el)return;if(on){if(el.dataset.medDitPr==null)el.dataset.medDitPr=el.style.paddingRight||'';el.style.paddingRight=(el.tagName==='INPUT'?'42px':'48px')}else if(el.dataset.medDitPr!=null){el.style.paddingRight=el.dataset.medDitPr;delete el.dataset.medDitPr}}
 function mostra(el){if(alvo&&alvo!==el)folga(alvo,false);alvo=el;el.__medChave=chaveSel(el);folga(el,true);if(!bt){bt=document.createElement('button');bt.type='button';bt.className='med-dit';bt.textContent='🎤';
   bt.setAttribute('aria-label','Ditar por voz');bt.setAttribute('aria-pressed','false');bt.title='Ditar por voz';
   bt.addEventListener('pointerdown',function(e){e.preventDefault();tocando=Date.now()});bt.addEventListener('mousedown',function(e){e.preventDefault();tocando=Date.now()});
   bt.addEventListener('click',function(){tocando=Date.now();if(alvo&&(!alvo.isConnected||document.activeElement!==alvo)){if(!alvo.isConnected)reancora();else try{alvo.focus({preventScroll:true})}catch(e){}}ouvindo?para():comeca()})}
  if(!bt.isConnected)document.body.appendChild(bt);posiciona()}
 function esconde(){para();if(bt)bt.remove();folga(alvo,false);alvo=null}
 function aviso(t){if(!bolha){bolha=document.createElement('div');bolha.className='med-dit-b';bolha.setAttribute('role','status')}
  if(!t){bolha.remove();return}bolha.textContent=t;if(!bolha.isConnected)document.body.appendChild(bolha);posiciona()}

 function pontua(t){return t.replace(/\s*\bponto e v[íi]rgula\b\s*/gi,'; ').replace(/\s*\bv[íi]rgula\b\s*/gi,', ').replace(/\s*\bponto final\b\s*/gi,'. ').replace(/\s*\bdois pontos\b\s*/gi,': ')
  .replace(/\s*\bnov[ao] (linha|par[áa]grafo)\b\s*/gi,'\n').replace(/([.:;!?]\s+|\n)([a-zà-ú])/g,function(m,a,b){return a+b.toUpperCase()}).replace(/ +$/,'')}
 function insere(txt){reancora();var el=alvo;if(!el||!txt)return;var s=el.selectionStart==null?el.value.length:el.selectionStart,e=el.selectionEnd==null?s:el.selectionEnd,antes=el.value.slice(0,s);
  txt=pontua(txt.trim());if(!txt)return;
  if(!antes||/[.!?]\s*$|\n\s*$/.test(antes))txt=txt.charAt(0).toUpperCase()+txt.slice(1);
  if(antes&&!/[\s\n]$/.test(antes)&&!/^[,.;:]/.test(txt))txt=' '+txt;
  el.setRangeText(txt,s,e,'end');el.dispatchEvent(new Event('input',{bubbles:true}));setTimeout(reancora,0)}

 function comeca(){if(!alvo)return;ultimoErro='';
  if(!SR_()){aviso('Este navegador não oferece ditado dentro da página. Use o microfone do próprio teclado (ícone 🎤 no teclado do celular ou tablet).');setTimeout(function(){aviso('')},6000);return}
  if(navigator.onLine===false){aviso('O ditado precisa de internet neste aparelho.');setTimeout(function(){aviso('')},3500);return}
  var SR=SR_();rec=new SR();rec.lang='pt-BR';rec.continuous=true;rec.interimResults=true;
  rec.onresult=function(ev){var parcial='';for(var i=ev.resultIndex;i<ev.results.length;i++){var r=ev.results[i];if(r.isFinal)insere(r[0].transcript);else parcial+=r[0].transcript}aviso(parcial?'… '+parcial:'Ouvindo…')};
  rec.onerror=function(ev){ultimoErro=ev.error;if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){aviso('Microfone bloqueado. Libere o microfone para este site nas configurações do navegador.');ouvindo=false}
   else if(ev.error==='network'){aviso('O ditado precisa de internet neste aparelho.');ouvindo=false}};
  rec.onend=function(){if(ouvindo&&alvo){try{rec.start();return}catch(e){}}ouvindo=false;marca();if(!/not-allowed|network/.test(ultimoErro))aviso('');else setTimeout(function(){aviso('')},4000);if(alvo)alvo.dispatchEvent(new Event('change',{bubbles:true}))};
  try{rec.start();ouvindo=true;marca();aviso('Ouvindo…')}catch(e){ouvindo=false;marca()}}
 function para(){ouvindo=false;marca();if(rec){try{rec.stop()}catch(e){}}}
 function marca(){if(bt)bt.setAttribute('aria-pressed',String(ouvindo))}

 document.addEventListener('focusin',function(e){if(elegivel(e.target)){if(alvo!==e.target)para();mostra(e.target)}});
 document.addEventListener('focusout',function(e){if(e.target===alvo)setTimeout(function(){if(!alvo)return;if(Date.now()-tocando<1500)return;if(!alvo.isConnected&&reancora())return;if(document.activeElement!==alvo&&document.activeElement!==bt)esconde()},150)});
 window.addEventListener('scroll',posiciona,true);window.addEventListener('resize',posiciona);
 document.addEventListener('input',function(e){if(e.target===alvo)posiciona()});
})();
