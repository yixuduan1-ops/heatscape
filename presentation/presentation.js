(()=>{'use strict';
const $=id=>document.getElementById(id),root=$('presentation'),stage=$('stage'),slides=[...document.querySelectorAll('.slide')],sequences=window.HEATSCAPE_SEQUENCES,count=slides.length,reduced=matchMedia('(prefers-reduced-motion: reduce)');
let current=0,step=1,ready=false,animated=!reduced.matches,playing=false,playTimer,idleTimer,toastTimer,touch=null,ignoreClick=false,transitionGeneration=0;
const running=new Set();
const maxSteps=(index=current)=>sequences[index].length;
function readPosition(){const m=location.hash.match(/^#slide-(\d+)(?:-step-(\d+))?$/);const index=m?Math.max(0,Math.min(count-1,+m[1]-1)):0;return{index,step:Math.max(1,Math.min(maxSteps(index),m&&m[2]?+m[2]:1))};}
function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3800);}
function wake(){root.classList.remove('idle');clearTimeout(idleTimer);if(document.fullscreenElement===root)idleTimer=setTimeout(()=>{if(!document.querySelector('dialog[open]')&&!root.querySelector('.chrome:hover'))root.classList.add('idle');},2600);}
function animate(element,keyframes,options){if(!animated)return;const a=element.animate(keyframes,options);running.add(a);a.finished.catch(()=>{}).finally(()=>running.delete(a));return a;}
function stopMotion(){running.forEach(a=>a.cancel());running.clear();}
function setupScenes(){slides.forEach((slide,index)=>{
 if(slide.dataset.native){slide.querySelectorAll('.piece').forEach((piece,j)=>{piece.dataset.element=sequences[index][j].name;piece.setAttribute('aria-label',sequences[index][j].name);});window.HEATSCAPE_LIVING?.(slide,Number(slide.dataset.art));return;}
 const original=slide.querySelector('img'),source=original.getAttribute('src'),board=document.createElement('div');board.className='artboard scene-ink-'+(index+1);board.style.cssText=original.style.cssText;
 const wash=document.createElement('div');wash.className='scene-wash';board.append(wash);
 const background=new Image();background.src=(window.HEATSCAPE_BACKGROUNDS||[])[Number(slide.dataset.art)]||`assets/background-${String(Number(slide.dataset.art)+1).padStart(2,'0')}.png`;background.className='scene-background';background.alt='';background.setAttribute('aria-hidden','true');board.append(background);
 sequences[index].flatMap((g,j)=>(g.parts||[g]).map(e=>({...e,revealStep:j+1}))).forEach((element,j)=>{const [x,y,w,h]=element.box,piece=document.createElement('div');piece.className='piece';piece.dataset.step=element.revealStep;piece.dataset.element=element.name;piece.dataset.kind=element.kind;piece.setAttribute('role','img');piece.setAttribute('aria-label',element.name);piece.style.cssText=`left:${x/1376*100}%;top:${y/768*100}%;width:${w/1376*100}%;height:${h/768*100}%`;
 const img=new Image();img.src=source;img.alt='';img.draggable=false;img.style.cssText=`left:${-x/w*100}%;top:${-y/h*100}%;width:${1376/w*100}%;height:${768/h*100}%`;if(element.polygon)piece.style.clipPath='polygon('+element.polygon.map(([px,py])=>`${(px-x)/w*100}% ${(py-y)/h*100}%`).join(',')+')';
 if(element.cutouts){const holes=element.cutouts.map(([cx,cy,cw,ch])=>`<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="black"/>`).join('');const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1376" height="768"><defs><mask id="cut"><rect width="1376" height="768" fill="white"/>${holes}</mask></defs><rect width="1376" height="768" fill="white" mask="url(#cut)"/></svg>`;img.style.maskImage=`url("data:image/svg+xml,${encodeURIComponent(svg)}")`;img.style.maskSize='100% 100%';}
 piece.append(img);board.append(piece);});
 const final=original.cloneNode();final.removeAttribute('style');final.className='final-scene';final.setAttribute('aria-hidden','true');board.append(final);slide.replaceChildren(board);window.HEATSCAPE_LIVING?.(slide,Number(slide.dataset.art));
 });}
function savePosition(){try{history.replaceState(null,'',`#slide-${current+1}-step-${step}`);}catch{}}
function ui(){
 $('counter').textContent=`${current+1} / ${count}`;$('stepCounter').textContent=`Step ${step} / ${maxSteps()}`;$('stepCounter').title=sequences[current][step-1].name;
 $('previous').disabled=current===0&&step===1;$('next').disabled=current===count-1&&step===maxSteps();
 $('next').setAttribute('aria-label',step<maxSteps()?'Reveal next element':'Next slide');$('next').title=step<maxSteps()?`Next: ${sequences[current][step].name}`:'Next slide';
 document.querySelectorAll('[data-go]').forEach(b=>b.setAttribute('aria-current',String(+b.dataset.go===current)));
 slides.forEach((s,i)=>s.setAttribute('aria-hidden',String(i!==current)));
 $('playSequence').setAttribute('aria-pressed',String(playing));$('playIcon').textContent=playing?'Ⅱ':'▶';$('playLabel').textContent=playing?'Pause':'Play';$('playSequence').setAttribute('aria-label',playing?'Pause this slide’s sequence':'Play this slide’s sequence');
 document.title=`HEATSCAPE — ${current+1} / ${count}`;
}
function settle(){root.classList.toggle("video-mode",slides[current].dataset.native==="video");if(slides[current].dataset.native!=="video")$("demoVideo")?.pause();slides.forEach((s,i)=>{s.hidden=i!==current;s.classList.toggle('complete',i===current&&step===maxSteps(i));s.querySelectorAll('.piece').forEach((p,j)=>{const visible=i===current&&Number(p.dataset.step||j+1)<=step;p.classList.toggle('visible',visible);p.setAttribute('aria-hidden',String(!visible));});s.querySelectorAll('[data-after]').forEach(effect=>{const active=i===current&&step>=Number(effect.dataset.after);effect.classList.toggle('effect-active',active);if(typeof effect.pauseAnimations==='function'){if(active&&animated&&!document.hidden)effect.unpauseAnimations();else effect.pauseAnimations();}});});ui();}
function revealMotion(piece){if(!piece)return;const kind=piece.dataset.kind;const frames=kind==='draw'?[{opacity:0,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}]:kind==='rise'?[{opacity:0,transform:'translateY(22px) scale(.96)'},{opacity:1,transform:'translateY(0) scale(1)'}]:[{opacity:0,transform:'scale(.92)'},{opacity:1,transform:'scale(1.018)',offset:.72},{opacity:1,transform:'scale(1)'}];animate(piece,frames,{duration:kind==='draw'?680:560,easing:'cubic-bezier(.2,.7,.25,1)'});}
function stopPlay(){clearTimeout(playTimer);playing=false;ui();}
function schedule(){clearTimeout(playTimer);if(!playing)return;if(step===maxSteps()){stopPlay();return;}playTimer=setTimeout(()=>{if(!playing)return;setStep(step+1);schedule();},1450);}
function setStep(value,{motion=true,hash=true}={}){
 const old=step;step=Math.max(1,Math.min(maxSteps(),value));stopMotion();settle();
 if(step>old&&motion){slides[current].querySelectorAll('.piece').forEach((p,j)=>{if(Number(p.dataset.step||j+1)===step)revealMotion(p);});if(step===maxSteps()&&slides[current].querySelector('.final-scene'))animate(slides[current].querySelector('.final-scene'),[{opacity:0},{opacity:0,offset:.76},{opacity:1}],{duration:1000,easing:'ease-out'});}
 if(hash)savePosition();wake();
}
function show(index,{at=1,motion=true,hash=true}={}){
 if(!ready)return;index=Math.max(0,Math.min(count-1,index));stopPlay();stopMotion();++transitionGeneration;current=index;step=Math.max(1,Math.min(maxSteps(),at));settle();if(motion){animate(slides[current],[{opacity:0},{opacity:1}],{duration:320,easing:'ease-out'});if(step===1)revealMotion(slides[current].querySelector('.piece'));}if(hash)savePosition();wake();
}
function next(){if(!ready)return;stopPlay();if(step<maxSteps())setStep(step+1);else if(current<count-1)show(current+1);}
function previous(){if(!ready)return;stopPlay();if(step>1)setStep(step-1);else if(current>0)show(current-1,{at:maxSteps(current-1)});}
function play(){if(!ready)return;if(playing){stopPlay();return;}if(step===maxSteps())setStep(1,{motion:false});playing=true;ui();schedule();wake();}
function restart(){if(!ready)return;stopPlay();show(current,{at:1});}
function all(){if(!ready)return;stopPlay();setStep(maxSteps(),{motion:false});}
function toggleAnimation(){animated=!animated;root.classList.toggle('no-motion',!animated);$('animationButton').setAttribute('aria-pressed',String(animated));$('animationState').textContent=animated?'On':'Off';if(!animated)stopMotion();settle();wake();}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(root.requestFullscreen)await root.requestFullscreen();else notify('Use your browser’s full-screen command on this device.');}catch{notify('Full screen is unavailable here. Open this page in a browser tab and try again.');}}
function openDialog(id){stopPlay();wake();$(id).showModal();if(id==='overview')$('overview').querySelector(`[data-go="${current}"]`).focus();}
function closeDialog(id){$(id).close();$(id==='overview'?'overviewButton':'helpButton').focus();wake();}
$('playVideoFullscreen').addEventListener('click',async e=>{e.stopPropagation();const v=$('demoVideo');if(v.ended)v.currentTime=0;const playback=v.play();try{if(v.requestFullscreen)await v.requestFullscreen();else if(v.webkitEnterFullscreen)v.webkitEnterFullscreen();else notify('Use the video player’s full-screen control.');}catch{notify('Use the video player’s full-screen control.');}try{await playback;}catch{notify('Press Play on the video to start.');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.fullscreenElement===$('demoVideo')){e.preventDefault();e.stopImmediatePropagation();document.exitFullscreen().catch(()=>{});} },true);
let videoWasFullscreen=false;
document.addEventListener('fullscreenchange',()=>{const videoActive=document.fullscreenElement===$('demoVideo');if(videoWasFullscreen&&!videoActive){$('demoVideo').pause();$('playVideoFullscreen').focus({preventScroll:true});}videoWasFullscreen=videoActive;});

$('previous').addEventListener('click',previous);$('next').addEventListener('click',next);$('playSequence').addEventListener('click',play);$('replaySlide').addEventListener('click',restart);$('fullscreenButton').addEventListener('click',fullscreen);$('animationButton').addEventListener('click',toggleAnimation);$('overviewButton').addEventListener('click',()=>openDialog('overview'));$('helpButton').addEventListener('click',()=>openDialog('help'));
// A slide click reveals content, while toolbar buttons never bubble into the stage.
stage.addEventListener('click',e=>{if(e.target.closest('.video-placeholder'))return;if(ignoreClick){ignoreClick=false;return;}next();});
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{show(+b.dataset.go);if($('overview').open)closeDialog('overview');}));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(b.dataset.close)));
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(d.id);}});d.addEventListener('close',wake);});
document.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
 if((e.key===' '||e.key==='Enter')&&e.target.closest('button'))return;
 const k=e.key.toLowerCase();if(slides[current].dataset.native==='video'&&k===' '){e.preventDefault();const v=$('demoVideo');v.paused?v.play().catch(()=>notify('Press Play on the video to start.')):v.pause();return;}if(e.target.closest('video'))return;if(['arrowright','arrowdown',' '].includes(k)){e.preventDefault();next();}else if(['arrowleft','arrowup'].includes(k)){e.preventDefault();previous();}else if(k==='pagedown'){e.preventDefault();show(current+1);}else if(k==='pageup'){e.preventDefault();show(current-1);}else if(k==='home'){e.preventDefault();show(0);}else if(k==='end'){e.preventDefault();show(count-1,{at:maxSteps(count-1)});}else if(k==='f'){e.preventDefault();fullscreen();}else if(k==='g'){e.preventDefault();openDialog('overview');}else if(k==='a'){e.preventDefault();toggleAnimation();}else if(k==='p'){e.preventDefault();play();}else if(k==='r'){e.preventDefault();restart();}else if(k==='s'){e.preventDefault();all();}else if(k==='?'){e.preventDefault();openDialog('help');}wake();
});
stage.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touch={x:e.clientX,y:e.clientY,id:e.pointerId};});stage.addEventListener('pointerup',e=>{if(!touch||e.pointerId!==touch.id)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4){ignoreClick=true;dx<0?next():previous();}touch=null;wake();});stage.addEventListener('pointercancel',()=>touch=null);
root.addEventListener('pointermove',wake,{passive:true});root.addEventListener('pointerdown',wake,{passive:true});root.addEventListener('focusin',wake);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlay();settle();});
document.addEventListener('fullscreenchange',()=>{$('fullscreenLabel').textContent=document.fullscreenElement?'Exit full screen':'Full screen';$('fullscreenButton').setAttribute('aria-label',document.fullscreenElement?'Exit full screen':'Full screen');if(document.fullscreenElement===root)stage.focus({preventScroll:true});wake();});
window.addEventListener('hashchange',()=>{const p=readPosition();show(p.index,{at:p.step,hash:false});});reduced.addEventListener('change',e=>{if(e.matches&&animated)toggleAnimation();});
root.classList.toggle('no-motion',!animated);setupScenes();const position=readPosition();current=position.index;step=position.step;settle();$('animationButton').setAttribute('aria-pressed',String(animated));$('animationState').textContent=animated?'On':'Off';
const firstImage=slides[current].querySelector('.final-scene')||slides[current].querySelector('.scene-background');function loaded(){ready=true;$('loading').hidden=true;if(!firstImage.naturalWidth)notify('A slide image could not load. Check your connection and refresh.');else if(step===1)revealMotion(slides[current].querySelector('.piece'));wake();}if(firstImage.complete)loaded();else{firstImage.addEventListener('load',loaded,{once:true});firstImage.addEventListener('error',loaded,{once:true});}
})();
