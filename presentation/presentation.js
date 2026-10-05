(()=>{'use strict';
const $=id=>document.getElementById(id),root=$('presentation'),stage=$('stage'),slides=[...document.querySelectorAll('.slide')],count=slides.length,reduced=matchMedia('(prefers-reduced-motion: reduce)');
let current=0,ready=false,animated=!reduced.matches,animations=[],idleTimer,toastTimer,touch=null,generation=0;
const getIndex=()=>{const m=location.hash.match(/^#slide-(\d+)$/);return m?Math.max(0,Math.min(count-1,Number(m[1])-1)):0;};
function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4000);}
function wake(){root.classList.remove('idle');clearTimeout(idleTimer);if(document.fullscreenElement===root)idleTimer=setTimeout(()=>{if(!document.querySelector('dialog[open]')&&!root.querySelector('.chrome:hover'))root.classList.add('idle');},2600);}
function ui(){
 $('counter').textContent=`${current+1} / ${count}`;$('previous').disabled=current===0;$('next').disabled=current===count-1;
 document.querySelectorAll('[data-go]').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.go)===current)));
 slides.forEach((s,i)=>s.setAttribute('aria-hidden',String(i!==current)));
 document.title=`HEATSCAPE — ${current+1} / ${count}`;
}
function show(index,{hash=true,motion=true}={}){
 index=Math.max(0,Math.min(count-1,index));if(!ready||index===current)return;
 const old=current,token=++generation;animations.forEach(a=>a.cancel());animations=[];
 slides.forEach(s=>{s.hidden=true;s.style.zIndex='';});current=index;const from=slides[old],to=slides[current];to.hidden=false;to.style.zIndex='2';
 if(animated&&motion){const dir=current>old?1:-1;from.hidden=false;from.style.zIndex='1';
  animations=[from.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${-dir*2}%)`}],{duration:440,easing:'ease-in',fill:'both'}),to.animate([{opacity:0,transform:`translateX(${dir*3}%) scale(1.012)`},{opacity:1,transform:'translateX(0) scale(1)'}],{duration:650,easing:'cubic-bezier(.18,.7,.2,1)',fill:'both'})];
  Promise.allSettled(animations.map(a=>a.finished)).then(()=>{if(token!==generation)return;from.hidden=true;animations.forEach(a=>a.cancel());animations=[];});
 }
 if(hash){try{history.replaceState(null,'',`#slide-${current+1}`);}catch{location.hash=`slide-${current+1}`;}}
 ui();wake();
}
function toggleAnimation(){animated=!animated;$('animationButton').setAttribute('aria-pressed',String(animated));$('animationState').textContent=animated?'On':'Off';if(!animated){++generation;animations.forEach(a=>a.cancel());animations=[];slides.forEach((s,i)=>s.hidden=i!==current);}wake();}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(root.requestFullscreen)await root.requestFullscreen();else notify('Use your browser’s full-screen command on this device.');}catch{notify('Full screen is unavailable here. Open this page in a browser tab and try again.');}}
function openDialog(id){wake();$(id).showModal();if(id==='overview')$('overview').querySelector(`[data-go="${current}"]`).focus();}
function closeDialog(id){$(id).close();$(id==='overview'?'overviewButton':'helpButton').focus();wake();}
$('previous').addEventListener('click',()=>show(current-1));$('next').addEventListener('click',()=>show(current+1));$('fullscreenButton').addEventListener('click',fullscreen);$('animationButton').addEventListener('click',toggleAnimation);$('overviewButton').addEventListener('click',()=>openDialog('overview'));$('helpButton').addEventListener('click',()=>openDialog('help'));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{show(Number(b.dataset.go));if($('overview').open)closeDialog('overview');}));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(b.dataset.close)));
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(d.id);}});d.addEventListener('close',wake);});
document.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
 if((e.key===' '||e.key==='Enter')&&e.target.closest('button'))return;
 const k=e.key.toLowerCase();if(['arrowright','arrowdown','pagedown',' '].includes(k)){e.preventDefault();show(current+1);}else if(['arrowleft','arrowup','pageup'].includes(k)){e.preventDefault();show(current-1);}else if(k==='home'){e.preventDefault();show(0);}else if(k==='end'){e.preventDefault();show(count-1);}else if(k==='f'){e.preventDefault();fullscreen();}else if(k==='g'){e.preventDefault();openDialog('overview');}else if(k==='a'){e.preventDefault();toggleAnimation();}else if(k==='?'){e.preventDefault();openDialog('help');}wake();
});
stage.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touch={x:e.clientX,y:e.clientY,id:e.pointerId};});
stage.addEventListener('pointerup',e=>{if(!touch||e.pointerId!==touch.id)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)show(current+(dx<0?1:-1));touch=null;wake();});stage.addEventListener('pointercancel',()=>touch=null);
root.addEventListener('pointermove',wake,{passive:true});root.addEventListener('pointerdown',wake,{passive:true});root.addEventListener('focusin',wake);
document.addEventListener('fullscreenchange',()=>{$('fullscreenLabel').textContent=document.fullscreenElement?'Exit full screen':'Full screen';$('fullscreenButton').setAttribute('aria-label',document.fullscreenElement?'Exit full screen':'Full screen');wake();});
window.addEventListener('hashchange',()=>show(getIndex(),{hash:false}));reduced.addEventListener('change',e=>{if(e.matches&&animated)toggleAnimation();});
// Original pictures retain the PowerPoint's own sizing and offsets, including its crop.
current=getIndex();slides[current].hidden=false;ui();$('animationButton').setAttribute('aria-pressed',String(animated));$('animationState').textContent=animated?'On':'Off';
const imageReady=img=>new Promise(resolve=>{if(img.complete){resolve(img.naturalWidth>0);return;}img.addEventListener('load',()=>resolve(true),{once:true});img.addEventListener('error',()=>resolve(false),{once:true});});
imageReady(slides[current].querySelector('img')).then(ok=>{ready=true;$('loading').hidden=true;if(!ok)notify('A slide image could not load. Check your connection and refresh.');wake();});
slides.forEach(s=>s.querySelector('img').addEventListener('error',()=>notify('A slide image could not load. Check your connection and refresh.')));

})();
