const fs=require('node:fs'),path=require('node:path'),E=require('./docs/engine.js');
function close(a,b,label){
 if(typeof a==='number'&&typeof b==='number'){if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>1e-10*Math.max(1,Math.abs(a),Math.abs(b)))throw new Error('Numeric mismatch: '+label);return;}
 if(a!==null&&b!==null&&typeof a==='object'&&typeof b==='object'){if(JSON.stringify(Object.keys(a))!==JSON.stringify(Object.keys(b)))throw new Error('Shape mismatch: '+label);for(const k of Object.keys(a))close(a[k],b[k],label+'.'+k);return;}
 if(a!==b)throw new Error('Value mismatch: '+label);
}
function traceCheck(saved,current){const a=saved.trim().split(/\r?\n/),b=current.trim().split(/\r?\n/);if(a.length!==b.length||a[0]!==b[0]||a[1]!==b[1])throw new Error('Trace metadata/shape differs');for(let i=2;i<a.length;i++){const aa=a[i].split(','),bb=b[i].split(',');if(aa.length!==bb.length)throw new Error('Trace width differs');aa.forEach((v,j)=>close(j===1?v:Number(v),j===1?bb[j]:Number(bb[j]),'trace '+i+':'+j));}}
const arm=Boolean(E.detect),scenes=arm?['static','distractor','moving','occlusion','missing']:Object.keys(E.presets),entries=[];
for(const scene of scenes)for(const delay of arm?[0,.5]:[0,.1,.2]){
 const settings=arm?{scene,color:'red',delay}:{scene,...E.presets[scene],delay},run=new E.Experiment(settings);const metrics=run.finish();entries.push({settings,dt:run.dt,metrics});
 if(scene===(arm?'distractor':'wind')&&delay===0){const text=E.csv(run),dest=path.join(__dirname,'trace.csv');if(process.argv.includes('--check')){traceCheck(fs.readFileSync(dest,'utf8'),text);}else fs.writeFileSync(dest,text);}
}
const output=JSON.stringify({schema:1,duration:E.DURATION,entries},null,2)+'\n',dest=path.join(__dirname,'benchmarks.json');
if(process.argv.includes('--check')){const saved=JSON.parse(fs.readFileSync(dest,'utf8'));close(saved,JSON.parse(output),'benchmark');}else fs.writeFileSync(dest,output);
console.log(`${entries.length} configurations / ${entries.length*2} trajectories reproduced`);
