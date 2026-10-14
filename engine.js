(function(root){
'use strict';
const locations={spawn:{x:0,z:3.5},egg:{x:6,z:-3},shop:{x:-4,z:-.5},berries:{x:6,z:3}};
const defaults={skin:'#cf936b',hair:'#493128',shirt:'#e68555',age:'child',type:'pige'};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function walkable(p){return p.x*p.x/121+p.z*p.z/64<1 && !(p.x>-7.9&&p.x<-2.1&&p.z>-6.4&&p.z<-1.7)}
function route(from,to){
 const step=.5,key=(x,z)=>`${x},${z}`,start={x:Math.round(from.x/step),z:Math.round(from.z/step)},end={x:Math.round(to.x/step),z:Math.round(to.z/step)};
 if(!walkable({x:end.x*step,z:end.z*step})){const candidates=[];for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const n={x:end.x+dx,z:end.z+dz},p={x:n.x*step,z:n.z*step};if(walkable(p)&&[.25,.5,.75].every(t=>walkable({x:p.x+(to.x-p.x)*t,z:p.z+(to.z-p.z)*t})))candidates.push(n)}candidates.sort((a,b)=>Math.hypot(a.x*step-to.x,a.z*step-to.z)-Math.hypot(b.x*step-to.x,b.z*step-to.z));if(!candidates.length)return [];Object.assign(end,candidates[0]);}
 const open=[start],came=new Map(),seen=new Set([key(start.x,start.z)]);let found=null;
 for(let i=0;i<open.length&&i<4000;i++){const cur=open[i];if(cur.x===end.x&&cur.z===end.z){found=cur;break}
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const n={x:cur.x+dx,z:cur.z+dz},k=key(n.x,n.z);if(seen.has(k)||!walkable({x:n.x*step,z:n.z*step}))continue;if(dx&&dz&&(!walkable({x:cur.x*step+dx*step,z:cur.z*step})||!walkable({x:cur.x*step,z:cur.z*step+dz*step})))continue;seen.add(k);came.set(k,cur);open.push(n)}}
 if(!found)return [];
 const path=[{...to}];while(found.x!==start.x||found.z!==start.z){path.unshift({x:found.x*step,z:found.z*step});found=came.get(key(found.x,found.z));}return path;
}
class GameEngine{
 constructor(){this.reset()}
 reset(avatar){this.state={player:{...locations.spawn,angle:0},pet:{x:-1,z:4},avatar:{...defaults,...avatar},stage:'find',eggFound:false,petHatched:false,hatchProgress:0,food:0,coins:0,walking:false,target:null,route:[],elapsed:0,started:false};this.events=[]}
 start(avatar){this.state.avatar={...defaults,...avatar};this.state.started=true;this.emit('Velkommen! Find det lysende æg i lunden.','welcome')}
 emit(text,kind='info'){this.events.push({text,kind})}
 move(p){if(!this.state.started)return false;if(!walkable(p)){this.emit('Tryk på land eller brug knappen til dit næste mål.');return false}const r=route(this.state.player,p);if(!r.length)return false;this.state.route=r;this.state.target={...p};return true}
 goal(){const s=this.state;return s.stage==='find'?locations.egg:s.stage==='return'||s.stage==='hatch'?locations.shop:s.stage==='feed'&&s.food===0?locations.berries:s.player}
 near(p,r=1.5){return distance(this.state.player,p)<r}
 primary(){const s=this.state;if(!s.started)return;
 if(s.stage==='find'){if(!this.near(locations.egg)){this.move(locations.egg);return} s.eggFound=true;s.stage='return';this.emit('Du fandt et stjerneæg! Tag det hjem til æggevarmeren.','collect')}
 else if(s.stage==='return'){if(!this.near(locations.shop)){this.move(locations.shop);return}s.stage='hatch';this.emit('Ægget er i varmeren. Giv det varme 3 gange.','collect')}
 else if(s.stage==='hatch'){if(!this.near(locations.shop)){this.move(locations.shop);return}s.hatchProgress++;if(s.hatchProgress>=3){s.stage='feed';s.petHatched=true;s.pet={x:s.player.x+.85,z:s.player.z+.5};this.emit('En lille solspir er klækket! Find bær til din nye ven.','hatch')}else this.emit(`Ægget vugger … ${s.hatchProgress} af 3 varmeglimt.`,'warm')}
 else if(s.stage==='feed'){if(!s.food){if(!this.near(locations.berries)){this.move(locations.berries);return}s.food=3;this.emit('Du plukkede 3 søde bær. Nu kan du fodre din solspir.','collect')}else{s.food--;s.stage='complete';s.coins+=30;this.emit('Bedste venner! Din solspir er glad. Du fik 30 mønter.','reward')}}
 else this.emit('I er klar til flere eventyr! Udforsk øen eller prøv den anden stil.','info');
 }
 label(){const s=this.state;if(s.stage==='find')return this.near(locations.egg)?'Saml ægget':'Gå til ægget';if(s.stage==='return')return this.near(locations.shop)?'Læg æg i varmeren':'Tilbage til butikken';if(s.stage==='hatch')return this.near(locations.shop)?`Giv varme · ${s.hatchProgress}/3`:'Til æggevarmeren';if(s.stage==='feed'&&!s.food)return this.near(locations.berries)?'Pluk bær':'Find bær i lunden';if(s.stage==='feed')return 'Fodr din solspir';return 'Kæl med din solspir'}
 update(dt){const s=this.state;s.elapsed+=dt;const wp=s.route[0];s.walking=!!wp;if(wp){const d=distance(s.player,wp),speed=3.8*dt;s.player.angle=Math.atan2(wp.x-s.player.x,wp.z-s.player.z);if(d<=speed){s.player.x=wp.x;s.player.z=wp.z;s.route.shift()}else{s.player.x+=(wp.x-s.player.x)/d*speed;s.player.z+=(wp.z-s.player.z)/d*speed}if(!s.route.length)s.target=null}if(s.petHatched){const d=distance(s.pet,s.player);if(d>1.15){const q=Math.min((d-1)*.9,4)*dt;s.pet.x+=(s.player.x-s.pet.x)/d*q;s.pet.z+=(s.player.z-s.pet.z)/d*q}}}
}
root.GameEngine=GameEngine;root.GameWorld={locations,walkable,route,distance,defaults};if(typeof module!=='undefined')module.exports={GameEngine,GameWorld:root.GameWorld};
})(typeof window!=='undefined'?window:globalThis);
