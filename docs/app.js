'use strict';
const $=id=>document.getElementById(id),C=window.CONFIG,E=window.Lab,ctx=$('world').getContext('2d');
let lang=new URLSearchParams(location.search).get('lang')==='en'?'en':'zh',run=null,playing=false,last=null,credit=0;
const colors=['#ffbc6f','#70dbc7'];
const T=key=>C.text[key][lang==='zh'?0:1];
function translate(){document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=T('title');document.querySelectorAll('[data-t]').forEach(el=>el.textContent=T(el.dataset.t));$('lang').textContent=lang==='zh'?'English':'中文';$('repo').href=C.repo;$('guide').href=C.repo+'/blob/main/'+(lang==='zh'?'README.md':'README.en.md');status();draw();}
function config(){const s={scene:$('scene').value,delay:Number($('delay').value)};if(C.type==='arm')s.color=$('color').value;else {s.wind=Number($('wind').value);s.mass=Number($('mass').value);}return s;}
function reset(){playing=false;credit=0;last=null;if(invalid()){status();return;}run=new E.Experiment(config());$('download').disabled=true;status();draw();}
function invalid(){return ['wind','mass'].some(id=>$(id)&&!$(id).checkValidity());}
function status(){if(!run)return;const bad=invalid();$('status').textContent=T(bad?'invalid':run.done?'complete':playing?'playing':'ready');$('play').textContent=T(playing?'pause':'play');$('play').disabled=bad;$('finish').disabled=bad;$('time').textContent=run.time.toFixed(1)+' / '+E.DURATION+' s';$('download').disabled=!run.done||bad;}
function point(x,y){if(C.type==='arm')return [420+x*205,366-y*205];return [420+x*105,426-y*115];}
function line(points,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>{const a=point(p.x,p.y);i?ctx.lineTo(...a):ctx.moveTo(...a);});ctx.stroke();}
function circle(x,y,r,color){const p=point(x,y);ctx.fillStyle=color;ctx.beginPath();ctx.arc(...p,r,0,Math.PI*2);ctx.fill();}
function draw(){if(!run)return;ctx.clearRect(0,0,840,460);ctx.fillStyle='#0b1322';ctx.fillRect(0,0,840,460);ctx.strokeStyle='#22324a';ctx.lineWidth=1;
 for(let x=-4;x<=4;x+=.5)line([{x,y:0},{x,y:C.type==='arm'?1.65:3.5}],'#1c2b41',1);
 for(let y=0;y<=3.5;y+=.5)line([{x:-4,y},{x:4,y}],'#1c2b41',1);
 const agents=C.type==='arm'?run.agents:run.drones;
 if(C.type==='arm'){
  for(const o of E.objects(run.time,run.settings.scene))circle(o.x,o.y,12,'rgb('+E.COLORS[o.color].join(',')+')');
  if(run.settings.scene==='distractor')circle(-1.25,.4,7,'rgb('+E.COLORS.red.join(',')+')');
  if(run.settings.scene==='missing'){const o=E.objects(run.time,run.settings.scene)[0];const p=point(o.x,o.y);ctx.strokeStyle='#8895ac';ctx.strokeRect(p[0]-16,p[1]-16,32,32);ctx.fillStyle='#0b1322';ctx.fillRect(p[0]-12,p[1]-12,24,24);}
  agents.forEach((a,i)=>{line(a.trace,colors[i]+'60',2);const elbow={x:Math.cos(a.q[0]),y:Math.sin(a.q[0])},end=E.fk(a.q);line([{x:0,y:0},elbow,end],colors[i],7);circle(elbow.x,elbow.y,6,colors[i]);circle(end.x,end.y,6,colors[i]);if(a.observation){const p=E.world(a.observation),v=point(p.x,p.y);ctx.strokeStyle=colors[i];ctx.strokeRect(v[0]-10,v[1]-10,20,20);}});
  circle(0,0,12,'#d5dfec');const frame=run.frame||run.displayFrame;$('camera').getContext('2d').putImageData(new ImageData(frame.data,frame.width,frame.height),0,0);$('observation').textContent=agents.map((a,i)=>T('method'+i)+': '+T(a.observation?'seen':'lost')).join(' · ');
 }else{
  line([{x:-4,y:0},{x:4,y:0}],'#8895ac',2);const h=point(0,1.5);ctx.strokeStyle='#7991ae';ctx.setLineDash([6,5]);ctx.strokeRect(h[0]-10.5,h[1]-11.5,21,23);ctx.setLineDash([]);
  agents.forEach((a,i)=>{line(a.trace,colors[i]+'60',2);const [x,z,,,theta]=a.state,p=point(x,z);ctx.save();ctx.translate(...p);ctx.rotate(-theta);ctx.strokeStyle=colors[i];ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-22,0);ctx.lineTo(22,0);ctx.stroke();ctx.fillStyle=colors[i];ctx.fillRect(-28,-5,16,4);ctx.fillRect(12,-5,16,4);ctx.fillRect(-6,-5,12,12);ctx.restore();});
  ctx.fillStyle='#97b6d4';ctx.font='15px system-ui';ctx.fillText(T('windValue')+' '+E.windAt(run.time,run.settings).toFixed(2)+' N',22,30);
 }
 const metrics=run.metrics();metrics.forEach((m,i)=>{$('score'+i).textContent=m.rmse===null?'—':m.rmse.toFixed(3)+' m';$('detail'+i).textContent=(m.late_rmse===null?'—':m.late_rmse.toFixed(3)+' m')+' · '+(C.type==='arm'?m.near_seconds:m.hover_seconds).toFixed(1)+' s';$('condition'+i).textContent=C.type==='arm'?T('visibility')+' '+(100*m.seen_fraction).toFixed(0)+'%':T(m.crashed?'crashed':'airborne');});status();
}
function tick(now){if(playing&&!run.done){if(last!==null){credit+=Math.min(.1,(now-last)/1000)*Number($('speed').value);while(credit>=run.dt&&!run.done){run.step();credit-=run.dt;}}if(run.done)playing=false;draw();}last=now;requestAnimationFrame(tick);}
$('lang').onclick=()=>{lang=lang==='zh'?'en':'zh';const u=new URL(location.href);u.searchParams.set('lang',lang);history.replaceState(null,'',u);translate();};
$('play').onclick=()=>{if(run.done)reset();playing=!playing;last=null;status();};$('reset').onclick=reset;
$('finish').onclick=()=>{playing=false;run.finish();draw();};
$('scene').onchange=()=>{if(C.type==='drone'){const p=E.presets[$('scene').value];$('wind').value=p.wind;$('mass').value=p.mass;$('delay').value=p.delay;}reset();};
['delay','color','wind','mass'].forEach(id=>{if($(id))$(id).onchange=reset;});
['wind','mass'].forEach(id=>{if($(id))$(id).oninput=reset;});
$('download').onclick=()=>{if(!run.done)return;const blob=new Blob([E.csv(run)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=C.type+'-experiment.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
translate();reset();requestAnimationFrame(tick);
