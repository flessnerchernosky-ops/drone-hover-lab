/* Planar two-rotor teaching model, not flight firmware. MIT licensed. */
(function(root){
'use strict';
const DT=.005,DURATION=20,G=9.81,ARM=.2,INERTIA=.025,MAX=9;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const presets={calm:{wind:0,delay:0,mass:1},wind:{wind:2,delay:0,mass:1},gust:{wind:2,delay:0,mass:1},delay:{wind:2,delay:.2,mass:1},payload:{wind:0,delay:0,mass:1.35}};
function windAt(t,s){return s.scene==='gust'?s.wind*(Math.sin(1.2*t)+.4*Math.sin(3.1*t)):s.wind;}
function derivative(y,motors,wind,mass){const [x,z,vx,vz,theta,omega]=y,T=motors[0]+motors[1];return [vx,vz,(-T*Math.sin(theta)+wind-.15*vx)/mass,T*Math.cos(theta)/mass-G-.15*vz/mass,omega,ARM*(motors[1]-motors[0])/INERTIA-.1*omega];}
function advance(y,motors,wind,mass,dt){const k1=derivative(y,motors,wind,mass),k2=derivative(y.map((v,i)=>v+k1[i]*dt/2),motors,wind,mass),k3=derivative(y.map((v,i)=>v+k2[i]*dt/2),motors,wind,mass),k4=derivative(y.map((v,i)=>v+k3[i]*dt),motors,wind,mass);return y.map((v,i)=>v+dt/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]));}
class Drone{
 constructor(kind,s,dt){this.kind=kind;this.state=[-.6,1.25,0,0,0,0];this.integral=[0,0];this.queue=Array.from({length:Math.round(s.delay/dt)},()=>[G/2,G/2]);this.head=0;this.motors=[G/2,G/2];this.command=[G/2,G/2];this.sum=0;this.late=0;this.lateN=0;this.near=0;this.saturated=0;this.crashed=false;this.energy=0;this.trace=[];}
 control(dt){const [x,z,vx,vz,theta,omega]=this.state,ex=-x,ez=1.5-z,ki=this.kind==='pid'?1:0;
  const ix=clamp(this.integral[0]+ex*dt,-3,3),iz=clamp(this.integral[1]+ez*dt,-3,3);
  const ax=1.8*ex-2.6*vx+ki*.7*ix,az=4*ez-3*vz+ki*1.8*iz;
  const rawTheta=Math.atan2(-ax,G+az),desired=clamp(rawTheta,-.45,.45),rawT=(G+az)/Math.max(.5,Math.cos(theta));
  const tau=INERTIA*(36*(desired-theta)-12*omega),raw=[(rawT-tau/ARM)/2,(rawT+tau/ARM)/2],u=raw.map(v=>clamp(v,0,MAX));
  const sat=raw.some(v=>v<0||v>MAX)||Math.abs(rawTheta)>.45;
  // Conditional integration: freeze both integrators when allocation or tilt saturates.
  if(!sat)this.integral=[ix,iz];this.saturated+=Number(sat);return u;}
 step(s,time,dt){
  if(!this.crashed){this.command=this.control(dt);if(this.queue.length){this.motors=this.queue[this.head];this.queue[this.head]=[...this.command];this.head=(this.head+1)%this.queue.length;}else this.motors=[...this.command];this.state=advance(this.state,this.motors,windAt(time-dt,s),s.mass,dt);if(this.state[1]<=0){this.state[1]=0;this.state[2]=this.state[3]=this.state[5]=0;this.crashed=true;}}
  else{this.command=[0,0];this.motors=[0,0];}
  const [x,z,vx,vz,theta,omega]=this.state,error=Math.hypot(x,z-1.5);this.sum+=error*error;if(time>15+1e-9){this.late+=error*error;this.lateN++;}this.near+=Number(!this.crashed&&error<.1)*dt;this.energy+=this.motors.reduce((a,v)=>a+v*v,0)*dt;this.trace.push({x,y:z});if(this.trace.length>220)this.trace.shift();
  return {time,kind:this.kind,x,z,vx,vz,theta,omega,command_left:this.command[0],command_right:this.command[1],applied_left:this.motors[0],applied_right:this.motors[1],wind:windAt(time-dt,s),error,crashed:Number(this.crashed)};
 }
 metrics(n){return {kind:this.kind,rmse:n?Math.sqrt(this.sum/n):null,late_rmse:this.lateN?Math.sqrt(this.late/this.lateN):null,hover_seconds:this.near,saturation_fraction:n?this.saturated/n:0,thrust_squared_integral:this.energy,crashed:this.crashed};}
}
class Experiment{
 constructor(input={},dt=DT){this.settings={scene:'wind',...presets.wind,...input};if(!presets[this.settings.scene]||!Number.isFinite(this.settings.wind)||Math.abs(this.settings.wind)>5||!Number.isFinite(this.settings.mass)||this.settings.mass<.6||this.settings.mass>1.8||!Number.isFinite(this.settings.delay)||this.settings.delay<0||this.settings.delay>.5)throw new Error('Invalid settings');if(!Number.isFinite(dt)||dt<=0||Math.abs(DURATION/dt-Math.round(DURATION/dt))>1e-6)throw new Error('Invalid dt');this.dt=dt;this.count=0;this.drones=['pd','pid'].map(kind=>new Drone(kind,this.settings,dt));this.rows=[];}
 get time(){return this.count*this.dt;}get done(){return this.count>=Math.round(DURATION/this.dt);}
 step(){if(this.done)return false;const t=this.time+this.dt;for(const a of this.drones)this.rows.push(a.step(this.settings,t,this.dt));this.count++;return true;}
 metrics(){return this.drones.map(d=>d.metrics(this.count));}finish(){while(this.step());return this.metrics();}
}
function csv(run){const keys=Object.keys(run.rows[0]||{});return '# drone-hover-v1 '+JSON.stringify({settings:run.settings,dt:run.dt,complete:run.done})+'\n'+keys.join(',')+'\n'+run.rows.map(r=>keys.map(k=>r[k]).join(',')).join('\n')+'\n';}
const api={DT,DURATION,G,ARM,INERTIA,MAX,presets,windAt,derivative,advance,Drone,Experiment,csv};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Lab=api;
})(typeof window==='undefined'?globalThis:window);
