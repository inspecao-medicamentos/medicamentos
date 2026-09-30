/* Ferramentas de campo — entram no fim de cada roteiro do site Medicamentos
   (build/montar.cjs). Botão “Campo” com cinco abas:
   - Resumo: estabelecimento, início, respostas (C/NC/NA), pendências, achados,
     fotos; controle de completude, não é pontuação sanitária.
   - Pendências: perguntas marcadas “Pendente de verificação” (botão em cada
     pergunta; some ao responder) e lembretes livres, que não vão ao relatório.
   - Achados: o que foi visto antes de chegar à pergunta (local, texto, foto),
     vinculado depois ao item; o texto pode ir para o campo em edição.
   - Redação: construtor de constatação (fatos → uma frase, sem IA) e
     biblioteca de frases.
   - Reinspeção: NCs de uma inspeção salva do mesmo roteiro, com a situação
     atual de cada uma, e o texto para o relatório.
   Ao baixar o relatório (Word, PDF, prévia .docx) com pendências em aberto,
   mostra a lista e pede confirmação.
   Dados: localStorage med-campo-<roteiro> (vai nas Salvas: a casca inclui a
   chave na lista de cada roteiro); fotos dos achados no mesmo banco das
   evidências (roteiro-evidencias-v1), com o prefixo de fotos do roteiro.
   Biblioteca de frases: localStorage da casca (med-frases-v1), comum a todos. */
(function(){
 'use strict';
 if(window.__medCampo)return;window.__medCampo=true;
 var APP=document.documentElement.dataset.uvisApp||'',APPS=window.__uvisAppSalvas||APP;
 /* o nome do roteiro já distingue a variante (Transportadora): a chave não leva prefixo */
 var CH='med-campo-'+APPS,CH_SALVAS=CH;
 var PAI=(function(){try{return window.parent&&window.parent!==window&&window.parent.localStorage?window.parent:null}catch(e){return null}})();
 function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function limpa(t){return String(t==null?'':t).replace(/\s+/g,' ').trim()}
 function agora(){return new Date().toISOString()}
 function dataHora(iso){if(!iso)return '—';try{var d=new Date(iso);return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}catch(e){return iso}}
 function novoId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}

 /* ---------------- estado ---------------- */
 var C;
 function carrega(){try{C=JSON.parse(localStorage.getItem(CH)||'{}')||{}}catch(e){C={}}
  C.pend=C.pend||{};C.lemb=C.lemb||[];C.achados=C.achados||[];C.ncs=C.ncs||[];C.cons=C.cons||{local:'',itens:'',verbo:'verificou-se'}}
 function grava(){C.alterado=agora();try{localStorage.setItem(CH,JSON.stringify(C))}catch(e){aviso('Não foi possível gravar no aparelho (espaço cheio?).')}}
 function temConteudo(){return Object.keys(C.pend).length||C.lemb.length||C.achados.length||C.reinsp}
 /* inspeção apagada por Salvas / Nova inspeção: a chave some e o estado recomeça */
 function confereReinicio(){if(localStorage.getItem(CH)===null&&C&&(C.inicio||temConteudo())){carrega();C={pend:{},lemb:[],achados:[],ncs:[],cons:{local:'',itens:'',verbo:'verificou-se'}};pintaFab()}}

 /* ---------------- adaptadores dos motores ---------------- */
 function motor(){
  if(window.ROTEIRO&&window.UvisPadrao)return 'rs';
  if(window.DrogariaAPI)return 'drogaria';
  try{if(typeof renderPreview==='function'&&typeof APP_DATA!=='undefined')return 'manip'}catch(e){}
  try{if(typeof reportText==='function'&&typeof state!=='undefined'&&state.answers)return 'dist'}catch(e){}
  return '';
 }
 function stRs(){try{return JSON.parse(localStorage.getItem(ROTEIRO.store)||'{}')||{}}catch(e){return {}}}
 function perguntasRs(){var out=[];ROTEIRO.secoes.forEach(function(s){s.itens.forEach(function(i){(i.perguntas||[]).forEach(function(q){out.push({q:q,item:i})})})});return out}
 /* {c, nc, na, resp} — resp = total respondido */
 function contagem(){var m=motor(),c=0,nc=0,na=0,resp=0;
  var soma=function(v){v=String(v&&typeof v==='object'?(v.status||v.value||v.v||''):v||'').toLowerCase();if(!v)return;resp++;if(v==='c'||v==='sim')c++;else if(v==='nc'||v==='nao')nc++;else if(v==='na'||v==='nsa')na++};
  try{
   if(m==='rs'){var r=stRs().r||{};Object.keys(r).forEach(function(k){soma(r[k])})}
   else if(m==='manip'){var rr=state.responses||{};Object.keys(rr).forEach(function(k){soma(rr[k])})}
   else if(m==='dist'){var a=state.answers||{};Object.keys(a).forEach(function(k){if(a[k]&&a[k].status)soma(a[k].status)})}
   else if(m==='drogaria'){var vis=function(o,d){if(!o||typeof o!=='object'||d>6)return;Object.keys(o).forEach(function(k){if(k==='answers'&&o[k]&&typeof o[k]==='object')Object.keys(o[k]).forEach(function(q){soma(o[k][q])});else vis(o[k],d+1)})};vis(DrogariaAPI.getState(),0);
    /* na drogaria há perguntas descritivas (Sim/Não); a contagem de NC vem das irregularidades do relatório */
    nc=irregularidades().length;c=Math.max(0,resp-nc-na)}
  }catch(e){}
  return {c:c,nc:nc,na:na,resp:resp,m:m};
 }
 /* textos das irregularidades, na ordem do relatório */
 function irregularidades(){var m=motor(),out=[];
  try{
   if(m==='rs'){var r=stRs().r||{};perguntasRs().forEach(function(x){if(r[x.q.id]==='nc')out.push(x.q.nc)})}
   else if(m==='drogaria'){(DrogariaAPI.report().irregularities||[]).forEach(function(x){if(x.frase_relatorio)out.push(limpa(x.frase_relatorio))})}
   else if(m==='dist'){String(reportText()).split(/\n+/).forEach(function(l){var k=l.match(/^\s*Não conformidade nº\s*\d+\s*:\s*(.+)$/i);if(k)out.push(limpa(k[1]))})}
   else if(m==='manip'){var raiz=document.getElementById('reportPreview'),tmp=null;
    if(!raiz){tmp=document.createElement('div');tmp.id='reportPreview';tmp.hidden=true;document.body.appendChild(tmp);raiz=tmp}
    try{renderPreview();[].forEach.call(raiz.querySelectorAll('h3'),function(h){if(/Irregularidades observadas/i.test(h.textContent)){var ol=h.nextElementSibling;if(ol&&ol.tagName==='OL')[].forEach.call(ol.children,function(li){out.push(limpa(li.textContent))})}})}finally{if(tmp)tmp.remove()}}
  }catch(e){}
  return out;
 }
 function nomeEstab(){var m=motor();
  try{
   if(m==='rs'){var mt=stRs().meta||{};return mt.fantasia||mt.razao||''}
   if(m==='manip'){var i=state.identity||{};return i.fantasia||i.razao||''}
  }catch(e){}
  var alvo=null;try{alvo=m==='drogaria'?DrogariaAPI.getState():(typeof state!=='undefined'?state:null)}catch(e){}
  var pri=['fantasia','nomeFantasia','nome_fantasia','razao','razaoSocial','razao_social','empresa','estabelecimento','establishment','company'],ach='';
  (function vis(o,d){if(ach||!o||typeof o!=='object'||d>5)return;for(var k=0;k<pri.length&&!ach;k++){var v=o[pri[k]];if(typeof v==='string'&&v.trim())ach=v.trim()}Object.keys(o).forEach(function(x){vis(o[x],d+1)})})(alvo,0);
  return ach;
 }
 /* item aberto na tela: {titulo} ou null */
 function itemAtual(){
  try{if(window.UvsPrevia){var l=UvsPrevia.itens();if(l&&l[0]&&l[0].titulo)return {titulo:limpa(l[0].titulo)}}}catch(e){}
  try{if(motor()==='rs'){var n=UvisPadrao.estado();if(n.item){var s=ROTEIRO.secoes.filter(function(x){return x.id===n.secao})[0],it=s&&s.itens.filter(function(x){return x.id===n.item})[0];if(it)return {titulo:it.titulo}}}}catch(e){}
  var chip=document.querySelector('[data-man-item][aria-current="step"],[data-man-item].on,[data-man-item].active,[data-man-item][aria-pressed="true"]');
  if(chip&&chip.offsetParent)return {titulo:limpa(chip.textContent).replace(/\s*\d+\/\d+ respondidas?.*$/i,'').replace(/Abrir item.*$/i,'')};
  var h=document.querySelector('.pu-cab-item,.drg-item-screen h2,.dist-section-screen h2');if(h&&h.offsetParent)return {titulo:limpa(h.textContent)};
  return null;
 }

 /* ---------------- fotos ---------------- */
 var EVI='roteiro-evidencias-v1';
 function cfgSalvas(){try{return PAI&&PAI.UvisSalvas&&PAI.UvisSalvas.CFG[APPS]||null}catch(e){return null}}
 function escopoFotos(){var c=cfgSalvas(),p=c&&c.fotos&&c.fotos[0];return (p||APPS+'-campo-')+'campo-achados'}
 function idb(modo,fn){return new Promise(function(ok,no){var r=indexedDB.open(EVI,1);r.onupgradeneeded=function(){if(!r.result.objectStoreNames.contains('photos'))r.result.createObjectStore('photos',{keyPath:'key'})};
  r.onerror=function(){no(r.error)};r.onsuccess=function(){var db=r.result,t=db.transaction('photos',modo),s=t.objectStore('photos'),res,q=fn(s);if(q)q.onsuccess=function(){res=q.result};t.oncomplete=function(){db.close();ok(res)};t.onerror=function(){db.close();no(t.error)}}})}
 function contaFotos(){var c=cfgSalvas();if(!c)return Promise.resolve(null);var pre=c.fotos||[];
  var p1=pre.length?idb('readonly',function(s){return s.getAll()}).then(function(a){return (a||[]).filter(function(x){return pre.some(function(p){return String(x.scope||'').indexOf(p)===0})}).length}):Promise.resolve(0);
  /* só lê: se o banco da drogaria ainda não existe, a abertura é abortada para não criá-lo vazio (sem a tabela de fotos) */
  var p2=c.fotosDb?new Promise(function(ok){var r=indexedDB.open(c.fotosDb.db);r.onupgradeneeded=function(){r.transaction.abort()};r.onerror=function(){ok(0)};r.onsuccess=function(){var db=r.result;if(!db.objectStoreNames.contains(c.fotosDb.store)){db.close();return ok(0)}var q=db.transaction(c.fotosDb.store).objectStore(c.fotosDb.store).count();q.onsuccess=function(){db.close();ok(q.result)};q.onerror=function(){db.close();ok(0)}}}):Promise.resolve(0);
  return Promise.all([p1,p2]).then(function(v){return v[0]+v[1]}).catch(function(){return null})}
 function reduz(file){return new Promise(function(ok,no){var u=URL.createObjectURL(file),im=new Image();im.onload=function(){var k=Math.min(1,1600/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.82))};im.onerror=function(){URL.revokeObjectURL(u);no(Error('Não foi possível abrir a imagem.'))};im.src=u})}
 function gravaFoto(id,dataUrl){var sc=escopoFotos();return idb('readwrite',function(s){return s.put({key:sc+'|'+id,scope:sc,id:id,dataUrl:dataUrl})})}
 function leFoto(id){var sc=escopoFotos();return idb('readonly',function(s){return s.get(sc+'|'+id)}).then(function(r){return r&&r.dataUrl})}
 function apagaFoto(id){var sc=escopoFotos();return idb('readwrite',function(s){return s.delete(sc+'|'+id)})}

 /* ---------------- pendente por pergunta ---------------- */
 var RESP=/^(Cumpre|Não cumpre|Não se aplica|Sim|Não|Registrado|Recomendar|Parcial|C|NC|NA)$/;
 function grupos(){var g=[];[].forEach.call(document.querySelectorAll('button'),function(b){if(b.closest('#cmp-painel,#cmp-modal'))return;if(!RESP.test(b.textContent.trim()))return;var p=b.parentElement;if(p&&g.indexOf(p)<0)g.push(p)});
  return g.filter(function(p){return [].filter.call(p.children,function(x){return x.tagName==='BUTTON'&&RESP.test(x.textContent.trim())}).length>=2})}
 function chaveGrupo(p){var bs=[].filter.call(p.children,function(x){return x.tagName==='BUTTON'&&RESP.test(x.textContent.trim())});
  var pares=function(b,corta){return Object.keys(b.dataset).map(function(k){var v=b.dataset[k];if(corta&&v.indexOf('|')>=0)v=v.slice(0,v.lastIndexOf('|'));return k+'='+v})};
  for(var corta=0;corta<2;corta++){var com=pares(bs[0],corta);bs.slice(1).forEach(function(b){var o=pares(b,corta);com=com.filter(function(x){return o.indexOf(x)>=0})});if(com.length)return com.sort().join('&')}
  return 't:'+rotuloGrupo(p).slice(0,120)}
 function caixaGrupo(p){return p.closest('.q,.req,.rs-q,.qmain,.pu-q')||p.parentElement}
 function rotuloGrupo(p){var cx=caixaGrupo(p),cl=cx.cloneNode(true);[].forEach.call(cl.querySelectorAll('button,textarea,input,select,details,.cmp-pbtn,.uvs-previa'),function(e){e.remove()});return limpa(cl.textContent).slice(0,220)}
 var CSSP='.cmp-pbtn{display:inline-flex;align-items:center;gap:6px;margin:8px 0 2px;padding:6px 10px;border-radius:8px;border:1px dashed #b7791f;background:#fffaf0;color:#8a5a14;font:600 12px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;cursor:pointer}.cmp-pbtn.on{border-style:solid;background:#fdf0d5;color:#6b4410}.cmp-pend{box-shadow:inset 4px 0 0 #d69e2e!important;background-image:linear-gradient(#fffaf0,#fffaf0)!important}';
 function varre(){if(varre.ocupado)return;varre.ocupado=true;
  try{grupos().forEach(function(p){var k=chaveGrupo(p),nx=p.nextElementSibling,on=!!C.pend[k];
   var btn=nx&&nx.classList&&nx.classList.contains('cmp-pbtn')?nx:null;
   if(!btn){btn=document.createElement('button');btn.type='button';btn.className='cmp-pbtn';p.insertAdjacentElement('afterend',btn)}
   if(btn.dataset.k!==k)btn.dataset.k=k;
   var txt=on?'⏳ Pendente de verificação — tocar para retirar':'⏳ Marcar como pendente';if(btn.textContent!==txt)btn.textContent=txt;
   if(btn.classList.contains('on')!==on)btn.classList.toggle('on',on);
   var cx=caixaGrupo(p);if(cx.classList.contains('cmp-pend')!==on)cx.classList.toggle('cmp-pend',on)})}
  finally{setTimeout(function(){varre.ocupado=false},0)}}
 function alternaPend(btn){var k=btn.dataset.k,p=btn.previousElementSibling;if(!k)return;
  if(C.pend[k])delete C.pend[k];else{var it=itemAtual();C.pend[k]={rotulo:p?rotuloGrupo(p):'',item:it?it.titulo:'',ts:agora()}}
  marcaInicio();grava();varre();pintaFab()}
 function respondeu(b){var p=b.parentElement;if(!p||!RESP.test(b.textContent.trim()))return;var nx=p.nextElementSibling;
  if(nx&&nx.classList&&nx.classList.contains('cmp-pbtn')&&C.pend[nx.dataset.k]){delete C.pend[nx.dataset.k];grava();pintaFab()}
  marcaInicio()}
 function marcaInicio(){if(!C.inicio){C.inicio=agora();grava()}}

 /* ---------------- campo de texto em edição ---------------- */
 var ultimo=null,ultimoDesc=null;
 function descritor(e){var a={tag:e.tagName,id:e.id,name:e.getAttribute('name'),data:{}};[].forEach.call(e.attributes,function(x){if(x.name.indexOf('data-')===0)a.data[x.name]=x.value});return a}
 function reencontra(d){if(!d)return null;if(d.id){var e=document.getElementById(d.id);if(e)return e}
  var sel=d.tag.toLowerCase()+Object.keys(d.data).map(function(k){return '['+k+'="'+(window.CSS&&CSS.escape?CSS.escape(d.data[k]):d.data[k])+'"]'}).join('')+(d.name?'[name="'+d.name+'"]':'');
  try{var l=document.querySelectorAll(sel);return l.length===1?l[0]:null}catch(e){return null}}
 function campoAlvo(){if(ultimo&&ultimo.isConnected)return ultimo;var e=reencontra(ultimoDesc);if(e)ultimo=e;return e}
 function rotuloCampo(e){if(!e)return '';var l=e.closest('label');var t=l?limpa(l.textContent).replace(limpa(e.value),''):'';if(!t&&e.id){var lb=document.querySelector('label[for="'+e.id+'"]');if(lb)t=limpa(lb.textContent)}return (t||e.getAttribute('placeholder')||e.getAttribute('aria-label')||'campo de texto').slice(0,80)}
 function insere(texto){var e=campoAlvo();if(!e){aviso('Toque primeiro no campo onde o texto deve entrar (situação encontrada, observações, NCs anteriores…) e volte aqui. Ou use Copiar.');return false}
  var v=e.value||'',sep=e.tagName==='TEXTAREA'?'\n':' ';e.value=(v.trim()?v.replace(/\s+$/,'')+sep:'')+texto;
  e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));fechaPainel();
  setTimeout(function(){var x=campoAlvo();if(x){x.scrollIntoView({block:'center'});try{x.focus()}catch(er){}}},60);aviso('Texto inserido em: '+rotuloCampo(e)+'.');return true}
 function copia(texto){var ok=function(){aviso('Texto copiado.')};
  try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(texto).then(ok,function(){copia2(texto);ok()})}catch(e){}
  copia2(texto);ok()}
 function copia2(texto){var t=document.createElement('textarea');t.value=texto;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch(e){}t.remove()}

 /* ---------------- redação ---------------- */
 var FRASES0=['Área em adequadas condições de higiene, conservação e organização.','Foi verificado que …','Não foi constatada a realização de …','Não foi apresentado(a) …','Foi apresentado(a) …, datado(a) de …','Os registros apresentados referem-se ao período de … a ….','No momento da inspeção, …','A equipe orientou quanto a …','O estabelecimento foi orientado a …','Não foram observadas irregularidades neste item.'];
 function lsCasca(){return PAI?PAI.localStorage:localStorage}
 function frases(){var f;try{f=JSON.parse(lsCasca().getItem('med-frases-v1')||'null')}catch(e){}return Array.isArray(f)?f:FRASES0.slice()}
 function gravaFrases(f){try{lsCasca().setItem('med-frases-v1',JSON.stringify(f))}catch(e){}}
 function minuscula(t){return /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}/.test(t)?t:t.charAt(0).toLowerCase()+t.slice(1)}
 function juntaLista(a){return a.length<2?a.join(''):a.slice(0,-1).join(', ')+' e '+a[a.length-1]}
 function constroi(cons){var itens=String(cons.itens||'').split(/\n+/).map(function(x){return limpa(x).replace(/[.;]+$/,'')}).filter(Boolean).map(minuscula);if(!itens.length)return '';
  var v=cons.verbo||'verificou-se',l=limpa(cons.local).replace(/[,.]+$/,'');
  var f=l?l+', '+v+' '+juntaLista(itens)+'.':v.charAt(0).toUpperCase()+v.slice(1)+' '+juntaLista(itens)+'.';return f.charAt(0).toUpperCase()+f.slice(1)}

 /* ---------------- reinspeção ---------------- */
 var SIT=[['','Selecione'],['corrigida','Corrigida'],['parcial','Parcialmente corrigida'],['nao','Não corrigida'],['nv','Não verificada']];
 var SIT_TXT={corrigida:'corrigida',parcial:'parcialmente corrigida',nao:'não corrigida',nv:'não verificada nesta inspeção'};
 function salvasAnteriores(){try{if(!PAI||!PAI.UvisSalvas)return Promise.resolve([]);return PAI.UvisSalvas.salvas().then(function(a){return (a||[]).filter(function(x){return x.app===APPS}).map(function(x){var c={};try{c=JSON.parse((x.ls||{})[CH_SALVAS]||'{}')||{}}catch(e){}return {id:x.id,nome:x.nome,criado:x.criado,ncs:c.ncs||[],data:c.inicio||x.criado}})})}catch(e){return Promise.resolve([])}}
 function textoReinsp(){var r=C.reinsp;if(!r)return '';var cab='Verificação das não conformidades apontadas na inspeção anterior'+(r.data?' ('+new Date(r.data).toLocaleDateString('pt-BR')+')':'')+':';
  return cab+'\n'+r.itens.map(function(x,i){return (i+1)+'. '+x.texto.replace(/\.$/,'')+' — '+(SIT_TXT[x.sit]||'situação não registrada')+(limpa(x.obs)?' ('+limpa(x.obs).replace(/\.$/,'')+')':'')+'.'}).join('\n')}

 /* ---------------- pendências (para o resumo e o aviso ao emitir) ---------------- */
 function pendencias(){var out=[];
  Object.keys(C.pend).forEach(function(k){var p=C.pend[k];out.push({tipo:'Pergunta pendente',txt:(p.item?p.item+' › ':'')+p.rotulo})});
  C.lemb.forEach(function(l){if(!l.feito)out.push({tipo:'Lembrete',txt:l.txt})});
  C.achados.forEach(function(a){if(!a.item)out.push({tipo:'Achado sem item',txt:(a.local?a.local+': ':'')+a.txt})});
  if(C.reinsp)C.reinsp.itens.forEach(function(x){if(!x.sit)out.push({tipo:'Reinspeção sem situação',txt:x.texto})});
  return out}

 /* ---------------- interface ---------------- */
 var CSS='#cmp-fab{position:fixed;right:12px;bottom:84px;z-index:2147482000;display:inline-flex;align-items:center;gap:6px;min-height:42px;padding:8px 14px;border-radius:21px;border:0;background:var(--uvis-tone,#365B73);color:#fff;font:700 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 4px 14px #0003;cursor:pointer}#cmp-fab .n{min-width:20px;padding:3px 6px;border-radius:10px;background:#d69e2e;color:#1a1a1a;font-size:12px}#cmp-fab .n[hidden]{display:none}'
  +'#cmp-painel{position:fixed;inset:0;z-index:2147483100;background:#0006;display:flex;justify-content:center;align-items:flex-end}#cmp-painel .cx{background:#fff;color:#1f2a33;width:min(760px,100%);max-height:92vh;display:flex;flex-direction:column;border-radius:16px 16px 0 0;font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}'
  +'#cmp-painel header,#cmp-painel nav{flex:0 0 auto}#cmp-painel header{display:flex;align-items:center;gap:8px;padding:12px 14px 6px}#cmp-painel header b{flex:1;font-size:16px}#cmp-painel .x{border:0;background:#eef2f5;border-radius:8px;min-width:40px;min-height:36px;font-size:18px;cursor:pointer}'
  +'#cmp-painel nav{display:flex;gap:6px;padding:4px 12px 10px;overflow-x:auto;border-bottom:1px solid #e3e8ec}#cmp-painel nav button{flex:0 0 auto;border:1px solid #cfd8df;background:#fff;border-radius:18px;padding:7px 12px;font:600 13px/1 inherit;cursor:pointer;color:#34495a}#cmp-painel nav button.on{background:var(--uvis-tone,#365B73);border-color:transparent;color:#fff}'
  +'#cmp-painel .corpo{overflow:auto;padding:12px 14px 22px}#cmp-painel h4{margin:14px 0 6px;font-size:14px}#cmp-painel .grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}#cmp-painel .k{border:1px solid #e3e8ec;border-radius:10px;padding:8px 10px}#cmp-painel .k b{display:block;font-size:20px}#cmp-painel .k span{font-size:12px;color:#5b6b78}#cmp-painel .k.al{border-color:#d69e2e;background:#fffaf0}'
  +'#cmp-painel .lin{border:1px solid #e3e8ec;border-radius:10px;padding:8px 10px;margin:6px 0}#cmp-painel .lin small{display:block;color:#5b6b78}#cmp-painel .acoes{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}#cmp-painel .b{border:1px solid #cfd8df;background:#fff;border-radius:8px;padding:7px 10px;font:600 13px/1.1 inherit;cursor:pointer;color:#26394a}#cmp-painel .b.pri{background:var(--uvis-tone,#365B73);border-color:transparent;color:#fff}#cmp-painel .b.del{color:#9b2c2c}#cmp-painel .cmp-foto{display:inline-block;margin:6px 0}'
  +'#cmp-painel label.f{display:block;margin:8px 0}#cmp-painel label.f span{display:block;font-size:12px;font-weight:600;color:#3f5263;margin-bottom:3px}#cmp-painel input[type=text],#cmp-painel textarea,#cmp-painel select{width:100%;box-sizing:border-box;border:1px solid #cfd8df;border-radius:8px;padding:8px;font:15px/1.4 inherit}#cmp-painel .prev{background:#f6f8fa;border-radius:8px;padding:10px;white-space:pre-wrap}#cmp-painel .nota{color:#5b6b78;font-size:13px}#cmp-painel img.ft{max-width:120px;max-height:90px;border-radius:6px;display:block;margin-top:6px}'
  +'#cmp-modal{position:fixed;inset:0;z-index:2147483200;background:#0006;display:flex;align-items:center;justify-content:center;padding:16px}#cmp-modal .cx{background:#fff;border-radius:14px;max-width:560px;width:100%;max-height:85vh;overflow:auto;padding:16px;font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1f2a33}#cmp-modal li{margin:4px 0}#cmp-modal .acoes{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#cmp-modal button{border:1px solid #cfd8df;background:#fff;border-radius:8px;padding:9px 12px;font:600 14px/1 inherit;cursor:pointer}#cmp-modal button.pri{background:var(--uvis-tone,#365B73);color:#fff;border-color:transparent}'
  +'#cmp-aviso{position:fixed;left:50%;bottom:140px;transform:translateX(-50%);z-index:2147483300;background:#1f2a33;color:#fff;padding:10px 14px;border-radius:10px;font:14px/1.35 system-ui,sans-serif;max-width:90vw;box-shadow:0 4px 14px #0004}'+CSSP;
 function aviso(t){var a=document.getElementById('cmp-aviso');if(!a){a=document.createElement('div');a.id='cmp-aviso';document.body.appendChild(a)}a.textContent=t;clearTimeout(aviso.t);aviso.t=setTimeout(function(){a.remove()},4200)}
 function pintaFab(){var f=document.getElementById('cmp-fab');if(!f)return;var n=pendencias().length,s=f.querySelector('.n');s.textContent=n;s.hidden=!n;f.title=n?n+' pendência(s)':'Ferramentas de campo'}
 var aba='resumo',itemAoAbrir=null;
 function abrePainel(qual){confereReinicio();itemAoAbrir=itemAtual();if(qual)aba=qual;var p=document.getElementById('cmp-painel');if(!p){p=document.createElement('div');p.id='cmp-painel';document.body.appendChild(p);p.addEventListener('click',cliquePainel);
   /* os eventos do painel não seguem para os roteiros (que escutam input/change no document) */
   p.addEventListener('input',function(e){e.stopPropagation();entradaPainel(e)});p.addEventListener('change',function(e){e.stopPropagation();mudaPainel(e)})}pinta()}
 function fechaPainel(){var p=document.getElementById('cmp-painel');if(p)p.remove();pintaFab()}
 var ABAS=[['resumo','Resumo'],['pend','Pendências'],['achados','Achados'],['redacao','Redação'],['reinsp','Reinspeção']];
 function pinta(){var p=document.getElementById('cmp-painel');if(!p)return;var np=pendencias().length;
  p.innerHTML='<div class="cx" role="dialog" aria-label="Ferramentas de campo"><header><b>Ferramentas de campo</b><button type="button" class="x" data-c="fecha" aria-label="Fechar">✕</button></header><nav>'
   +ABAS.map(function(a){return '<button type="button" data-aba="'+a[0]+'" class="'+(a[0]===aba?'on':'')+'">'+a[1]+(a[0]==='pend'&&np?' ('+np+')':'')+'</button>'}).join('')+'</nav><div class="corpo">'+corpo()+'</div></div>';
  if(aba==='resumo')contaFotos().then(function(n){var e=p.querySelector('[data-fotos]');if(e)e.textContent=n==null?'—':n});
  if(aba==='achados')[].forEach.call(p.querySelectorAll('img[data-foto]'),function(im){leFoto(im.dataset.foto).then(function(u){if(u)im.src=u})});
  if(aba==='reinsp'&&!C.reinsp)salvasAnteriores().then(function(l){var e=p.querySelector('[data-lista-salvas]');if(!e)return;var com=l.filter(function(x){return x.ncs.length});
   e.innerHTML=com.length?com.map(function(x){return '<div class="lin"><b>'+esc(x.nome)+'</b><small>'+esc(dataHora(x.data))+' · '+x.ncs.length+' não conformidade(s)</small><div class="acoes"><button type="button" class="b pri" data-c="usa-salva" data-id="'+esc(x.id)+'">Usar esta inspeção</button></div></div>'}).join('')
    :'<p class="nota">Nenhuma inspeção salva deste roteiro com não conformidades registradas. A lista de NCs passa a ser guardada nas inspeções salvas a partir desta versão; salvas anteriores a ela não trazem essa lista.</p>'})}
 function k(v,r,al){return '<div class="k'+(al?' al':'')+'"><b>'+v+'</b><span>'+r+'</span></div>'}
 function corpo(){
  if(aba==='resumo'){var n=contagem(),pend=pendencias(),ach=C.achados,vinc=ach.filter(function(a){return a.item}).length,nome=nomeEstab();
   var sec='';try{if(n.m==='rs'){var ss=UvisPadrao.secoes(),tot=0,ok=0;ss.forEach(function(s){s.itens.forEach(function(i){if(i.total){tot++;if(i.feitos>=i.total)ok++}})});sec=k(ok+'/'+tot,'itens concluídos')}}catch(e){}
   return '<div class="lin"><b>'+esc(nome||'Estabelecimento não identificado')+'</b><small>'+esc(document.title||'')+' · início '+esc(dataHora(C.inicio))+' · última alteração '+esc(dataHora(C.alterado))+'</small></div>'
    +'<h4>Respostas</h4><div class="grade">'+k(n.resp,'respondidas')+(n.m==='drogaria'?'':k(n.c,'conformes'))+k(n.nc,'não conformes'+(n.m==='drogaria'?' (irregularidades)':''),n.nc)+k(n.na,'não se aplica')+sec+'</div>'
    +'<h4>Controle</h4><div class="grade">'+k(Object.keys(C.pend).length,'perguntas pendentes',Object.keys(C.pend).length)+k(C.lemb.filter(function(l){return !l.feito}).length,'lembretes abertos',C.lemb.some(function(l){return !l.feito}))+k(vinc+'/'+ach.length,'achados vinculados',vinc<ach.length)+'<div class="k"><b data-fotos>…</b><span>fotos</span></div>'+(C.reinsp?k(C.reinsp.itens.filter(function(x){return x.sit}).length+'/'+C.reinsp.itens.length,'NCs anteriores avaliadas',C.reinsp.itens.some(function(x){return !x.sit})):'')+'</div>'
    +(pend.length?'<h4>A resolver antes de encerrar ('+pend.length+')</h4>'+pend.slice(0,8).map(function(x){return '<div class="lin"><small>'+esc(x.tipo)+'</small>'+esc(x.txt)+'</div>'}).join('')+(pend.length>8?'<p class="nota">… e mais '+(pend.length-8)+' na aba Pendências.</p>':''):'<p class="nota">Nada pendente.</p>')
    +'<p class="nota">'+(n.m==='drogaria'?'Na drogaria há perguntas descritivas (Sim/Não); por isso o número de não conformes é o de irregularidades do relatório. ':'')+'Controle de completude da inspeção; não é pontuação sanitária.</p>'}
  if(aba==='pend'){var ks=Object.keys(C.pend);
   return '<h4>Perguntas pendentes de verificação ('+ks.length+')</h4>'+(ks.length?ks.map(function(key){var p=C.pend[key];return '<div class="lin">'+(p.item?'<small>'+esc(p.item)+'</small>':'')+esc(p.rotulo)+'<div class="acoes"><button type="button" class="b" data-c="tira-pend" data-k="'+esc(key)+'">Retirar</button></div></div>'}).join(''):'<p class="nota">Nenhuma. Em cada pergunta há o botão “⏳ Marcar como pendente”; a marcação sai sozinha quando a pergunta é respondida.</p>')
    +'<h4>Lembretes (não vão ao relatório)</h4><label class="f"><input type="text" data-novo-lemb placeholder="Ex.: voltar à geladeira; pedir certificado da balança; fotografar o DML"></label><div class="acoes"><button type="button" class="b pri" data-c="add-lemb">Adicionar lembrete</button></div>'
    +C.lemb.map(function(l,i){return '<div class="lin"><label><input type="checkbox" data-lemb="'+i+'"'+(l.feito?' checked':'')+'> '+(l.feito?'<s>'+esc(l.txt)+'</s>':esc(l.txt))+'</label><div class="acoes"><button type="button" class="b del" data-c="del-lemb" data-i="'+i+'">Excluir</button></div></div>'}).join('')}
  if(aba==='achados'){var it=itemAoAbrir;
   return '<p class="nota">O que foi visto antes de chegar à pergunta correspondente. Depois, vincule ao item e use o texto na situação encontrada ou nas observações. Achado sem item conta como pendência.</p>'
    +'<h4>Novo achado</h4><label class="f"><span>Local</span><input type="text" data-a="local" placeholder="Ex.: sanitário do mezanino" value="'+esc(C.rasc&&C.rasc.local||'')+'"></label><label class="f"><span>O que foi encontrado</span><textarea rows="3" data-a="txt" placeholder="Ex.: ralo danificado">'+esc(C.rasc&&C.rasc.txt||'')+'</textarea></label>'
    +'<label class="b cmp-foto"><input type="file" accept="image/*" capture="environment" data-a="foto" hidden><span data-foto-nome>📷 Tirar ou escolher foto (opcional)</span></label><div class="acoes"><button type="button" class="b pri" data-c="add-achado">Registrar achado</button></div>'
    +'<h4>Achados ('+C.achados.length+')</h4>'+(C.achados.length?C.achados.map(function(a,i){return '<div class="lin"><small>'+esc(dataHora(a.ts))+(a.item?' · item: '+esc(a.item):' · sem item')+'</small>'+(a.local?'<b>'+esc(a.local)+':</b> ':'')+esc(a.txt)+(a.foto?'<img class="ft" data-foto="'+esc(a.foto)+'" alt="Foto do achado">':'')
     +'<div class="acoes">'+(it?'<button type="button" class="b" data-c="vinc" data-i="'+i+'">Vincular a: '+esc(it.titulo.slice(0,40))+'</button>':'<span class="nota">Para vincular, abra o item no roteiro e volte aqui.</span>')+(a.item?'<button type="button" class="b" data-c="desvinc" data-i="'+i+'">Desvincular</button>':'')
     +'<button type="button" class="b" data-c="usa-achado" data-i="'+i+'">Inserir no campo</button><button type="button" class="b" data-c="cons-achado" data-i="'+i+'">Levar ao construtor</button><button type="button" class="b del" data-c="del-achado" data-i="'+i+'">Excluir</button></div></div>'}).join(''):'<p class="nota">Nenhum achado registrado.</p>')}
  if(aba==='redacao'){var c=C.cons,fr=frases(),alvo=campoAlvo(),res=constroi(c);
   return '<p class="nota">Campo de destino: <b>'+esc(alvo?rotuloCampo(alvo):'nenhum — toque no campo de texto do roteiro antes de abrir aqui')+'</b>.</p>'
    +'<h4>Construtor de constatação</h4><p class="nota">Informe os fatos; o texto é montado só com eles, sem IA.</p>'
    +'<label class="f"><span>Local (como deve sair no texto)</span><input type="text" data-cons="local" placeholder="Ex.: No sanitário localizado no mezanino" value="'+esc(c.local)+'"></label>'
    +'<label class="f"><span>Achados (um por linha)</span><textarea rows="4" data-cons="itens" placeholder="ralo danificado&#10;fiação exposta no chuveiro&#10;ausência de papel-toalha para secagem das mãos">'+esc(c.itens)+'</textarea></label>'
    +'<label class="f"><span>Verbo</span><select data-cons="verbo">'+['verificou-se','constatou-se','observou-se'].map(function(v){return '<option'+(c.verbo===v?' selected':'')+'>'+v+'</option>'}).join('')+'</select></label>'
    +'<div class="prev" data-cons-prev>'+esc(res||'O texto aparece aqui.')+'</div><div class="acoes"><button type="button" class="b pri" data-c="ins-cons">Inserir no campo</button><button type="button" class="b" data-c="cop-cons">Copiar</button><button type="button" class="b" data-c="limpa-cons">Limpar</button></div>'
    +'<h4>Frases</h4><p class="nota">Toque para inserir no campo e adapte o trecho “…”. A lista é comum a todos os roteiros deste aparelho.</p>'
    +fr.map(function(f,i){return '<div class="lin">'+esc(f)+'<div class="acoes"><button type="button" class="b pri" data-c="ins-frase" data-i="'+i+'">Inserir</button><button type="button" class="b" data-c="cop-frase" data-i="'+i+'">Copiar</button><button type="button" class="b del" data-c="del-frase" data-i="'+i+'">Excluir</button></div></div>'}).join('')
    +'<label class="f"><span>Nova frase</span><input type="text" data-nova-frase placeholder="Frase que você usa com frequência"></label><div class="acoes"><button type="button" class="b" data-c="add-frase">Adicionar frase</button><button type="button" class="b" data-c="frases-padrao">Restaurar frases padrão</button></div>'}
  if(aba==='reinsp'){var r=C.reinsp;
   if(!r)return '<p class="nota">Escolha a inspeção anterior deste estabelecimento entre as inspeções salvas deste roteiro. As não conformidades dela aparecem aqui para registrar a situação atual de cada uma.</p><div data-lista-salvas><p class="nota">Lendo as inspeções salvas…</p></div>';
   var t=textoReinsp();
   return '<div class="lin"><b>'+esc(r.nome)+'</b><small>Inspeção anterior de '+esc(dataHora(r.data))+' · '+r.itens.length+' não conformidade(s)</small><div class="acoes"><button type="button" class="b del" data-c="tira-reinsp">Trocar ou retirar a inspeção anterior</button></div></div>'
    +r.itens.map(function(x,i){return '<div class="lin">'+(i+1)+'. '+esc(x.texto)+'<label class="f"><span>Situação atual</span><select data-cmp-sit="'+i+'">'+SIT.map(function(s){return '<option value="'+s[0]+'"'+(x.sit===s[0]?' selected':'')+'>'+s[1]+'</option>'}).join('')+'</select></label><label class="f"><span>Observação (opcional)</span><input type="text" data-cmp-obs="'+i+'" value="'+esc(x.obs||'')+'"></label></div>'}).join('')
    +'<h4>Texto para o relatório</h4><div class="prev" data-reinsp-prev>'+esc(t)+'</div><div class="acoes"><button type="button" class="b pri" data-c="ins-reinsp">Inserir no campo</button><button type="button" class="b" data-c="cop-reinsp">Copiar</button></div>'
    +'<p class="nota">Destino no modelo: Manipulação — “Não conformidades anteriores” (1.1, identificação); Atacadista/Transportadora — item 6 do Anexo I. Toque nesse campo no roteiro antes de inserir.</p>'}
  return ''}
 function cliquePainel(e){var b=e.target.closest('[data-aba],[data-c]');if(!b)return;if(e.target===e.currentTarget)return fechaPainel();
  if(b.dataset.aba){aba=b.dataset.aba;return pinta()}
  var c=b.dataset.c,i=+b.dataset.i,p=document.getElementById('cmp-painel');
  if(c==='fecha')return fechaPainel();
  if(c==='tira-pend'){delete C.pend[b.dataset.k];grava();varre();return pinta()}
  if(c==='add-lemb'){var inp=p.querySelector('[data-novo-lemb]'),t=limpa(inp.value);if(!t)return;C.lemb.push({txt:t,ts:agora()});marcaInicio();grava();return pinta()}
  if(c==='del-lemb'){C.lemb.splice(i,1);grava();return pinta()}
  if(c==='add-achado'){var lo=limpa(p.querySelector('[data-a="local"]').value),tx=limpa(p.querySelector('[data-a="txt"]').value),fi=p.querySelector('[data-a="foto"]').files[0];
   if(!tx&&!fi)return aviso('Descreva o achado ou tire uma foto.');var a={id:novoId(),local:lo,txt:tx,ts:agora(),item:''};
   var fim=function(){C.achados.unshift(a);C.rasc=null;marcaInicio();grava();pinta();aviso('Achado registrado.')};
   if(!fi)return fim();b.disabled=true;return reduz(fi).then(function(u){return gravaFoto(a.id,u)}).then(function(){a.foto=a.id;fim()}).catch(function(er){b.disabled=false;aviso('Foto não gravada: '+(er&&er.message||er))})}
  if(c==='vinc'&&itemAoAbrir){C.achados[i].item=itemAoAbrir.titulo;grava();return pinta()}
  if(c==='desvinc'){C.achados[i].item='';grava();return pinta()}
  if(c==='usa-achado'){var ac=C.achados[i];return insere((ac.local?ac.local+': ':'')+ac.txt)}
  if(c==='cons-achado'){var ax=C.achados[i];if(ax.local&&!C.cons.local)C.cons.local=ax.local;C.cons.itens=(C.cons.itens?C.cons.itens.replace(/\s+$/,'')+'\n':'')+ax.txt;grava();aba='redacao';return pinta()}
  if(c==='del-achado'){if(!confirm('Excluir este achado?'))return;var d=C.achados.splice(i,1)[0];if(d&&d.foto)apagaFoto(d.foto).catch(function(){});grava();return pinta()}
  if(c==='ins-cons'){var tc=constroi(C.cons);return tc?insere(tc):aviso('Informe ao menos um achado.')}
  if(c==='cop-cons'){var tc2=constroi(C.cons);return tc2?copia(tc2):aviso('Informe ao menos um achado.')}
  if(c==='limpa-cons'){C.cons={local:'',itens:'',verbo:C.cons.verbo};grava();return pinta()}
  if(c==='ins-frase')return insere(frases()[i]);
  if(c==='cop-frase')return copia(frases()[i]);
  if(c==='del-frase'){var f=frases();f.splice(i,1);gravaFrases(f);return pinta()}
  if(c==='add-frase'){var nf=limpa(p.querySelector('[data-nova-frase]').value);if(!nf)return;var f2=frases();f2.push(nf);gravaFrases(f2);return pinta()}
  if(c==='frases-padrao'){if(confirm('Restaurar as frases padrão? As frases que você incluiu serão apagadas.')){gravaFrases(FRASES0.slice());pinta()}return}
  if(c==='usa-salva'){return salvasAnteriores().then(function(l){var s=l.filter(function(x){return x.id===b.dataset.id})[0];if(!s)return;C.reinsp={nome:s.nome,data:s.data,itens:s.ncs.map(function(t){return {texto:t,sit:'',obs:''}})};marcaInicio();grava();pinta()})}
  if(c==='tira-reinsp'){if(confirm('Retirar a inspeção anterior e as situações registradas?')){C.reinsp=null;grava();pinta()}return}
  if(c==='ins-reinsp')return insere(textoReinsp());
  if(c==='cop-reinsp')return copia(textoReinsp());
 }
 function entradaPainel(e){var t=e.target;
  if(t.dataset.cons){C.cons[t.dataset.cons]=t.value;grava();var pv=document.querySelector('[data-cons-prev]');if(pv)pv.textContent=constroi(C.cons)||'O texto aparece aqui.';return}
  if(t.dataset.a==='local'||t.dataset.a==='txt'){C.rasc=C.rasc||{};C.rasc[t.dataset.a]=t.value;grava();return}
  if(t.dataset.cmpObs!==undefined){C.reinsp.itens[+t.dataset.cmpObs].obs=t.value;grava();var rp=document.querySelector('[data-reinsp-prev]');if(rp)rp.textContent=textoReinsp()}}
 function mudaPainel(e){var t=e.target;
  if(t.dataset.a==='foto'){var nm=document.querySelector('[data-foto-nome]');if(nm)nm.textContent=t.files[0]?'📷 Foto escolhida: '+t.files[0].name:'📷 Tirar ou escolher foto (opcional)';return}
  if(t.dataset.lemb!==undefined){C.lemb[+t.dataset.lemb].feito=t.checked;grava();return pinta()}
  if(t.dataset.cmpSit!==undefined){C.reinsp.itens[+t.dataset.cmpSit].sit=t.value;grava();var rp=document.querySelector('[data-reinsp-prev]');if(rp)rp.textContent=textoReinsp();pintaFab()}}

 /* ---------------- aviso ao emitir o relatório ---------------- */
 var EMITE=/^(Baixar (o )?(Word|relatório|prévia|Anexo)|Baixar relatório para Word|Imprimir( \/ PDF)?|Gerar (Word|relatório))/i,liberado=0;
 function emissao(e){var b=e.target.closest&&e.target.closest('button,a');if(!b||b.closest('#cmp-painel,#cmp-modal'))return;
  if(!(b.matches('[data-rs-word]')||EMITE.test(limpa(b.textContent))))return;
  if(Date.now()<liberado)return;var pd=pendencias();if(!pd.length)return;
  e.preventDefault();e.stopImmediatePropagation();
  var m=document.createElement('div');m.id='cmp-modal';m.innerHTML='<div class="cx" role="alertdialog"><b>Há '+pd.length+' pendência(s) nesta inspeção</b><ul>'+pd.slice(0,12).map(function(x){return '<li><small>'+esc(x.tipo)+':</small> '+esc(x.txt)+'</li>'}).join('')+'</ul>'+(pd.length>12?'<p>… e mais '+(pd.length-12)+'.</p>':'')
   +'<div class="acoes"><button type="button" class="pri" data-m="ver">Ver pendências</button><button type="button" data-m="emite">Emitir mesmo assim</button><button type="button" data-m="volta">Voltar</button></div></div>';
  document.body.appendChild(m);m.addEventListener('click',function(ev){var x=ev.target.closest('[data-m]');if(!x&&ev.target!==m)return;m.remove();if(!x)return;
   if(x.dataset.m==='ver')abrePainel('pend');else if(x.dataset.m==='emite'){liberado=Date.now()+1500;b.click()}})}

 /* ---------------- lista de NCs guardada (para a reinspeção futura) ---------------- */
 var tNcs=0;
 function atualizaNcs(){clearTimeout(tNcs);tNcs=setTimeout(function(){confereReinicio();var l=irregularidades(),nome=nomeEstab();if(JSON.stringify(l)!==JSON.stringify(C.ncs)||nome!==C.nome){C.ncs=l;C.nome=nome;if(l.length||temConteudo())grava()}pintaFab()},1500)}

 /* ---------------- início ---------------- */
 function inicia(){if(!motor()){if((inicia.n=(inicia.n||0)+1)<40)return setTimeout(inicia,250);return}
  carrega();var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  var f=document.createElement('button');f.id='cmp-fab';f.type='button';f.setAttribute('aria-label','Ferramentas de campo');f.innerHTML='<span>Campo</span><span class="n" hidden></span>';f.addEventListener('click',function(){abrePainel()});document.body.appendChild(f);pintaFab();
  window.addEventListener('focusin',function(e){var t0=e.target;if(!t0||!t0.closest)return;var t=e.target;if(t.closest('#cmp-painel,#cmp-modal'))return;if(t.tagName==='TEXTAREA'||(t.tagName==='INPUT'&&/^(text|search|)$/i.test(t.type||''))){ultimo=t;ultimoDesc=descritor(t)}},true);
  window.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button');if(!b||b.closest('#cmp-painel,#cmp-modal'))return;
   if(b.classList.contains('cmp-pbtn')){e.preventDefault();e.stopImmediatePropagation();return alternaPend(b)}
   emissao(e);if(!e.defaultPrevented)respondeu(b);atualizaNcs()},true);
  window.addEventListener('input',function(e){if(!e.target.closest||!e.target.closest('#cmp-painel'))atualizaNcs()},true);
  var tm=0;new MutationObserver(function(ms){if(varre.ocupado)return;if(ms.every(function(m){return m.target.closest&&m.target.closest('#cmp-painel,#cmp-modal,#cmp-aviso,#cmp-fab')}))return;clearTimeout(tm);tm=setTimeout(varre,120)}).observe(document.body,{childList:true,subtree:true});
  varre();atualizaNcs()}
 window.MedCampo={pendencias:pendencias,contagem:contagem,irregularidades:irregularidades,abre:abrePainel,estado:function(){return C}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inicia);else inicia();
})();
