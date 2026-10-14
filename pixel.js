/* Pixelhavn — hand-drawn procedural pixel world. No assets or dependencies. */
(() => {
'use strict';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function noise(n){const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);}
const C={ink:'#18354d',sea:'#155f83',deep:'#124c70',foam:'#8ee3d8',grass:'#638c5b',grassLight:'#83a46b',earth:'#687887',stone:'#92a1a0',path:'#d9bf85',pathLight:'#edcf92',dark:'#1b384b',wood:'#664e46',woodLight:'#bd9466',pink:'#f6a8b8',gold:'#ffd88a'};
class PixelRenderer{
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.buffer=document.createElement('canvas');this.g=this.buffer.getContext('2d',{alpha:false});this.camera={x:0,z:0};this.time=0;this._last=0;this.unit=15;this.width=640;this.height=400;this.pixel=2;
  this.trees=[[-9,-1,1.15],[-8,-4,1.15],[-6,-6.8,1.2],[-2.4,-6.9,1.15],[.4,-6.7,1.3],[2.8,-6.7,1.15],[8,-4.7,1.1],[10.8,.4,.9],[-10.2,2,.92],[-8,4.4,.95],[6.9,6.5,.75],[-5.5,6.4,.8]];
  this.flowers=[];for(let i=0;i<220;i++){const x=(noise(i+80)-.5)*22,z=(noise(i+900)-.5)*16;if(x*x/144+z*z/81<.86&&this.pathDistance(x,z)>1.05&&!(x>-8&&x<-2&&z>-6.5&&z<-1.4))this.flowers.push({x,z,n:i});}
  this.resize(canvas.clientWidth||960,canvas.clientHeight||640);
 }
 resize(w,h){
  this.width=Math.max(1,w);this.height=Math.max(1,h);this.pixel=w>=1150?2.5:2;
  this.buffer.width=Math.ceil(w/this.pixel);this.buffer.height=Math.ceil(h/this.pixel);
  const dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.ctx.imageSmoothingEnabled=false;this.g.imageSmoothingEnabled=false;
  this.unit=clamp(Math.min(this.buffer.width/33,this.buffer.height/25),w<600?7.2:9.5,19);this._cameraOrigin();
 }
 _cameraOrigin(){this.ox=this.buffer.width*.5-(this.camera.x-this.camera.z)*this.unit;this.oy=this.buffer.height*.50-(this.camera.x+this.camera.z)*this.unit*.52;}
 p(x,z,y=0){return {x:Math.round(this.ox+(x-z)*this.unit),y:Math.round(this.oy+(x+z)*this.unit*.52-y)};}
 worldToScreen(x,z){return{x:(this.ox+(x-z)*this.unit)*this.width/this.buffer.width,y:(this.oy+(x+z)*this.unit*.52)*this.height/this.buffer.height};}
 hitGoal(clientX,clientY,goal,state){if(state.stage==='complete'||(state.stage==='feed'&&state.food))return false;const r=this.canvas.getBoundingClientRect(),p=this.worldToScreen(goal.x,goal.z),sx=this.width/this.buffer.width,sy=this.height/this.buffer.height,u=this.unit/15;const x=clientX-r.left,y=clientY-r.top,bodyY=p.y-16*u*sy,markerY=p.y+(state.stage==='feed'?-35:-42)*u*sy;return (Math.pow((x-p.x)/Math.max(22,17*u*sx),2)+Math.pow((y-bodyY)/Math.max(24,20*u*sy),2)<1)||Math.hypot(x-p.x,y-markerY)<Math.max(22,13*sx)}
 screenToWorld(clientX,clientY){const r=this.canvas.getBoundingClientRect(),sx=(clientX-r.left)*this.buffer.width/r.width-this.ox,sy=(clientY-r.top)*this.buffer.height/r.height-this.oy;return{x:(sx/this.unit+sy/(this.unit*.52))/2,z:(sy/(this.unit*.52)-sx/this.unit)/2};}
 rect(x,y,w,h,c){this.g.fillStyle=c;this.g.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
 poly(points,c,outline){const g=this.g;g.beginPath();points.forEach((p,i)=>i?g.lineTo(Math.round(p.x),Math.round(p.y)):g.moveTo(Math.round(p.x),Math.round(p.y)));g.closePath();g.fillStyle=c;g.fill();if(outline){g.strokeStyle=outline;g.lineWidth=1;g.stroke();}}
 ellipse(x,y,rx,ry,c){this.g.fillStyle=c;for(let j=-Math.ceil(ry);j<=ry;j+=2){const q=Math.sqrt(Math.max(0,1-j*j/(ry*ry)));this.g.fillRect(Math.round(x-rx*q),Math.round(y+j),Math.max(1,Math.round(rx*q*2)),2);}}
 line(x1,y1,x2,y2,c,w=1){const g=this.g;g.beginPath();g.strokeStyle=c;g.lineWidth=w;g.moveTo(Math.round(x1),Math.round(y1));g.lineTo(Math.round(x2),Math.round(y2));g.stroke();}
 pathDistance(x,z){let d=999;const paths=[[[0,7],[0,3.5]],[[0,3.5],[-4,-.5]],[[-4,-.5],[-5,-2]],[[0,3.5],[3,0]],[[3,0],[6,-3]],[[3,0],[6,3]]];for(const [a,b]of paths){const vx=b[0]-a[0],vz=b[1]-a[1],t=clamp(((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz),0,1);d=Math.min(d,Math.hypot(x-a[0]-t*vx,z-a[1]-t*vz));}return d;}
 draw(state,dt,time){
  this.time=Number.isFinite(time)?time:performance.now()/1000;if(this.time>1e5)this.time/=1000;const seconds=Number.isFinite(dt)?Math.min(dt>.2?dt/1000:dt,.05):.016;
  const player=state.player||{x:0,z:3.5};const wide=this.buffer.width>430;const follow=wide?.12:.35;this.camera.x+=(player.x*follow-this.camera.x)*Math.min(1,seconds*3);this.camera.z+=((player.z-1)*follow-this.camera.z)*Math.min(1,seconds*3);this._cameraOrigin();
  this.g.imageSmoothingEnabled=false;this.water();this.island();this.dock();this.groundDetails();
  if(state.target){const p=this.p(state.target.x,state.target.z);const blink=.5+.5*Math.sin(this.time*5);this.ellipse(p.x,p.y,7+blink*2,3+blink,'#f5deb0');this.ellipse(p.x,p.y,5+blink*2,2+blink,C.path);}
  const objects=[];const add=(x,z,fn,depth=0)=>objects.push({d:x+z+depth,fn});
  this.trees.forEach(([x,z,s],i)=>add(x,z,()=>this.tree(x,z,s,i)));
  add(5,-5.4,()=>this.tree(5,-5.4,1.26,73,true));
  this.flowers.forEach(o=>add(o.x,o.z,()=>this.flower(o.x,o.z,o.n)));
  add(-5,-2.05,()=>this.shop());
  [[-7,1.3],[3.9,-3.3],[4.7,4.3],[-1.3,6.5]].forEach(([x,z])=>add(x,z,()=>this.lantern(x,z)));
  add(-1.5,2.7,()=>this.signpost(-1.5,2.7));
  add(6,3,()=>this.berryBush(6,3,state.stage==='feed'));
  add(6,-3,()=>this.nest(6,-3,!state.eggFound,state.stage==='find'));
  add(-4,-.5,()=>this.incubator(-4,-.5,state));
  add(0,7.6,()=>this.fence(0,7.6));
  if(state.petHatched&&state.pet)add(state.pet.x,state.pet.z,()=>this.dragon(state.pet.x,state.pet.z,state.walking));
  add(player.x,player.z,()=>this.avatar(player,state.avatar||{},!!state.walking,state.eggFound&&!state.petHatched),.08);
  objects.sort((a,b)=>a.d-b.d).forEach(o=>o.fn());
  this.fireflies();
  if(state.stage==='complete'){for(let i=0;i<26;i++){const p=this.p(player.x,player.z);const y=((this.time*17+i*19)%100);const x=p.x+Math.sin(i*6.7)*50+Math.sin(this.time+i)*6;this.rect(x,p.y-y-20,2,3,['#ffd88a','#99efca','#f8a9c5'][i%3]);}}
  this.ctx.imageSmoothingEnabled=false;this.ctx.drawImage(this.buffer,0,0,this.canvas.width,this.canvas.height);
 }
 water(){
  const w=this.buffer.width,h=this.buffer.height;this.rect(0,0,w,h,C.sea);
  for(let row=0;row<h;row+=13){const col=row%26?C.deep:'#176b8d';for(let x=0;x<w;x+=38){const n=noise(x+row*11);this.rect(x+Math.sin(this.time*.3+n*20)*3,row,22+n*23,3,col);}}
  for(let i=0;i<160;i++){const x=noise(i+404)*w,y=noise(i+554)*h;const n=Math.sin(this.time*1.2+i*3);this.rect(x+n*2,y,2+noise(i+50)*10,1,i%4===0?'#77c9ca':'#318fac');if(i%5===0)this.rect(x+3+n*2,y+2,4,1,'#63b9c2');}
  // A tiny sailboat makes the harbour feel inhabited.
  const x=w*.13+Math.sin(this.time*.17)*3,y=h*.68+Math.sin(this.time)*1;this.poly([{x:x-13,y},{x:x+16,y},{x:x+10,y:y+5},{x:x-7,y:y+5}],'#3b3e45');this.rect(x-1,y-32,2,33,'#ddbb7e');this.poly([{x:x-3,y:y-31},{x:x-3,y:y-4},{x:x-18,y:y-4}],'#fff0cc');this.poly([{x:x+2,y:y-24},{x:x+2,y:y-4},{x:x+14,y:y-4}],'#e4cfa3');this.rect(x-15,y+8,31,1,'#72cdd1');
 }
 island(){
  const pts=[];const N=76;for(let i=0;i<N;i++){const a=i/N*TAU,r=1+(noise(i+94)-.5)*.045;pts.push(this.p(Math.cos(a)*12*r,Math.sin(a)*9*r));}
  const shadow=pts.map(p=>({x:p.x+4,y:p.y+35}));this.poly(shadow,'#12506c');
  // Each visible cliff segment has independently lit stone strata.
  for(let i=0;i<N;i++){const a=pts[i],b=pts[(i+1)%N];if(b.x<a.x){const depth=28+noise(i+20)*10;this.poly([a,b,{x:b.x,y:b.y+depth},{x:a.x,y:a.y+depth}],i%3===0?'#506d7c':i%3===1?'#607d87':'#768a8f');this.line(a.x,a.y+7,a.x,a.y+depth-2,'#39576c',2);this.line(a.x+1,a.y+8,b.x,b.y+8,'#93a2a0');this.line(a.x+2,a.y+18,b.x,b.y+18,'#455e73');this.rect(a.x+3,a.y+12,3,4,'#96a4a1');this.line(a.x,a.y+depth+2,b.x,b.y+depth+2,'#63bac0',2);}}
  this.poly(pts,'#446b57');this.poly(pts.map(p=>({x:(p.x-this.ox)*.985+this.ox,y:(p.y-this.oy)*.985+this.oy-2})),C.grass);
  // A broken bright rim of turf and stone.
  for(let i=0;i<N;i++){const a=pts[i],b=pts[(i+1)%N];this.line(a.x,a.y-2,b.x,b.y-2,i%3?'#90a777':'#adc197',2);if(i%3===0)this.rect(a.x,a.y,4,4,'#aec2a0');}
 }
 groundDetails(){
  for(let i=0;i<2100;i++){const x=(noise(i+190)-.5)*23.8,z=(noise(i+4190)-.5)*17.6;if(x*x/144+z*z/81>.95)continue;const p=this.p(x,z),onPath=this.pathDistance(x,z)<.82;this.rect(p.x,p.y,onPath?3:2,onPath?2:1,onPath?i%3?'#c9ac76':'#edd69c':i%3?'#759b61':'#517d59');}
  // Stone walkways in the sandy paths; each tile is a miniature diamond.
  for(let x=-9;x<10;x+=.5)for(let z=-7;z<8;z+=.5){if(this.pathDistance(x,z)<.69){const p=this.p(x,z),u=this.unit*.27;this.poly([{x:p.x,y:p.y-u*.5},{x:p.x+u,y:p.y},{x:p.x,y:p.y+u*.5},{x:p.x-u,y:p.y}],noise(x*17+z*68)>.42?'#ddc58e':'#d3ba83');}}
  // Low garden borders, embedded flagstones, mossy rocks.
  [[-2,5.5],[2.2,5.7],[7,1],[-9,-.4],[-3.6,4.7],[7.7,-2]].forEach(([x,z],i)=>{const p=this.p(x,z);this.ellipse(p.x,p.y+1,7,3,'#486c58');this.poly([{x:p.x-6,y:p.y},{x:p.x-4,y:p.y-5},{x:p.x+3,y:p.y-7},{x:p.x+7,y:p.y-3},{x:p.x+4,y:p.y+1}],'#8d9b92');this.rect(p.x-3,p.y-5,6,2,'#bac3a4');this.rect(p.x+3,p.y-3,3,3,'#5e7b73');});
 }
 dock(){
  const a=this.p(-1,7.1),b=this.p(1,7.1),c=this.p(1,12.2),d=this.p(-1,12.2);this.poly([{x:a.x,y:a.y+5},{x:b.x,y:b.y+5},{x:c.x,y:c.y+9},{x:d.x,y:d.y+9}],'#4a4548');this.poly([a,b,c,d],'#ad8155',C.ink);
  for(let z=7.1;z<12.2;z+=.34){const p=this.p(-1,z),q=this.p(1,z);this.line(p.x,p.y,q.x,q.y,'#624e43');this.line(p.x,p.y+1,q.x,q.y+1,'#c79c68');}
  for(const x of[-1,1])for(const z of[7.3,9.5,12]){const p=this.p(x,z);this.rect(p.x-2,p.y-6,5,18,'#4e4141');this.rect(p.x-2,p.y-7,5,3,'#d1ad77');this.rect(p.x-1,p.y-2,2,12,'#876d50');}
  const r=this.p(-1,10.7);this.ellipse(r.x-4,r.y-1,5,3,'#3a4144');this.ellipse(r.x-4,r.y-1,3,1,'#bfa274');
 }
 tree(x,z,scale,index,pink=false){
  const p=this.p(x,z),s=scale*this.unit/15;this.g.save();this.g.translate(p.x,p.y);this.g.scale(s,s);this.ellipse(0,1,21,7,'#3e6857');
  this.poly([{x:-3,y:0},{x:4,y:0},{x:5,y:-31},{x:0,y:-39},{x:-5,y:-28}],'#6c5148',C.ink);this.rect(-1,-28,3,27,'#a3825d');this.line(1,-20,-12,-31,'#785744',4);this.line(2,-27,12,-38,'#765647',4);
  const colors=pink?['#813f63','#ae5276','#dc7296','#f4a2b4','#ffc7bd']:['#163f4d','#205853','#32745c','#4b8b61','#72a66c'];
  const blobs=[[-14,-35,14,11],[14,-38,15,12],[0,-49,20,15],[-17,-46,12,10],[11,-55,14,11],[0,-63,13,9],[-2,-35,17,9]];
  blobs.forEach(([bx,by,rx,ry],j)=>{this.ellipse(bx,by,rx+1,ry+1,colors[0]);this.ellipse(bx,by-2,rx,ry,colors[1]);this.ellipse(bx-3,by-4,rx-3,ry-3,colors[2]);this.ellipse(bx-5,by-6,rx-7,Math.max(2,ry-5),colors[3]);});
  for(let i=0;i<37;i++){const xx=(noise(index*99+i)-.5)*48,yy=-32-noise(index*222+i+90)*36;if(xx*xx/650+(yy+49)*(yy+49)/440<1)this.rect(xx,yy,2,2,colors[i%4+1]);}
  if(pink)for(let i=0;i<6;i++){const yy=-10-(this.time*7+i*11)%50,xx=Math.sin(this.time*.6+i*4)*22;this.rect(xx,yy,2,1,'#ffd3d0');}
  this.g.restore();
 }
 flower(x,z,n){const p=this.p(x,z);const size=this.unit/15;this.rect(p.x,p.y-3,1,4,'#3d6a52');const color=['#ef8d9f','#f6d984','#a9cfe4','#f3eac0'][n%4];this.rect(p.x-1,p.y-5,3,2,color);if(n%3===0){this.rect(p.x+3,p.y-3,2,2,color);this.rect(p.x+3,p.y-1,1,2,'#3c7054');}}
 shop(){
  const p=this.p(-5,-2);const s=this.unit/15;this.g.save();this.g.translate(p.x,p.y);this.g.scale(s,s);
  this.ellipse(1,3,49,14,'#436455');
  // Warm stone walls, deep roof planes and wooden beams.
  this.poly([{x:-42,y:-13},{x:14,y:3},{x:48,y:-17},{x:-9,y:-35}],'#536a6b',C.ink);
  this.poly([{x:-42,y:-60},{x:14,y:-44},{x:14,y:0},{x:-42,y:-16}],'#c9ad7d',C.ink);
  this.poly([{x:14,y:-44},{x:48,y:-64},{x:48,y:-18},{x:14,y:0}],'#8b8e79',C.ink);
  for(let y=-53;y<-16;y+=8){this.line(-41,y,13,y+16,'#ac966e');for(let x=-36;x<10;x+=13)this.rect(x,y+(x+41)*.28,1,6,'#967f63');}
  this.poly([{x:-51,y:-61},{x:12,y:-43},{x:52,y:-66},{x:-11,y:-85}],'#382f43',C.ink);
  this.poly([{x:-51,y:-65},{x:-19,y:-91},{x:41,y:-74},{x:12,y:-48}],'#b7554b',C.ink);
  this.poly([{x:12,y:-48},{x:41,y:-74},{x:53,y:-68}],'#7f3c43',C.ink);
  for(let i=0;i<7;i++){const y=-66-i*3.5,x=-49+i*4.3;this.line(x,y,x+60,y+17,'#e58c64',1);for(let j=0;j<5;j++){const xx=x+j*12+(i%2?6:0);this.line(xx,y+j*3.4,xx-3,y+j*3.4+3,'#8d4241');}}
  this.line(-19,-91,41,-74,'#ffc38c',2);this.rect(28,-92,8,19,'#b0a28e');this.rect(27,-94,11,4,'#e6c397');this.rect(31,-90,3,6,'#8a7c75');
  // Main door is at the world-space interaction point.
  this.poly([{x:-3,y:-33},{x:12,y:-29},{x:12,y:-1},{x:-3,y:-5}],'#564b47',C.ink);this.poly([{x:0,y:-29},{x:9,y:-27},{x:9,y:-5},{x:0,y:-8}],'#264d58');this.rect(6,-16,2,2,C.gold);this.poly([{x:-8,y:-3},{x:12,y:3},{x:19,y:-1},{x:-2,y:-8}],'#d9c395',C.ink);
  // Gold shop windows, timber mullions, striped blue canopy.
  const windowPoly=(x,y)=>{this.poly([{x,y},{x:x+16,y:y+5},{x:x+16,y:y+20},{x,y:y+15}],'#453e45',C.ink);this.poly([{x:x+2,y:y+3},{x:x+14,y:y+7},{x:x+14,y:y+17},{x:x+2,y:y+13}],'#ffd986');this.line(x+8,y+4,x+8,y+16,'#6c5449',2);this.line(x+2,y+9,x+14,y+12,'#9e784d');};windowPoly(-35,-44);
  this.poly([{x:-43,y:-46},{x:-11,y:-37},{x:-16,y:-27},{x:-48,y:-36}],'#203f56',C.ink);for(let i=0;i<4;i++)this.poly([{x:-43+i*8,y:-46+i*2.25},{x:-39+i*8,y:-45+i*2.25},{x:-44+i*8,y:-35+i*2.25},{x:-48+i*8,y:-36+i*2.25}],'#6e9baa');
  this.poly([{x:24,y:-44},{x:38,y:-52},{x:38,y:-32},{x:24,y:-24}],'#4a4d48',C.ink);this.poly([{x:26,y:-43},{x:36,y:-49},{x:36,y:-34},{x:26,y:-28}],'#ffd98a');this.line(31,-46,31,-31,'#7a7157',2);this.line(26,-37,36,-43,'#7a7157',2);
  // Hanging paw sign and a flower box.
  this.rect(17,-62,2,24,C.wood);this.rect(17,-62,19,2,C.wood);this.rect(29,-61,1,7,C.gold);this.rect(22,-55,16,20,C.ink);this.rect(24,-53,12,16,'#567c9b');this.ellipse(30,-43,3,3,'#f7dfb0');[[-4,-5],[0,-7],[4,-5]].forEach(([x,y])=>this.ellipse(30+x,-44+y,1.4,2,'#f7dfb0'));
  this.poly([{x:-38,y:-22},{x:-19,y:-16},{x:-19,y:-9},{x:-38,y:-15}],'#7f6551',C.ink);for(let i=0;i<8;i++){this.rect(-37+i*2,-24+i*.6,3,4,'#366955');this.rect(-37+i*2,-26+i*.6,2,2,i%2?'#ee9cb2':'#ffd697');}
  // A few small roof glints and ivy hang over the stonework.
  for(let i=0;i<8;i++){this.rect(-43+noise(i)*6,-25+i*2.5,3,3,i%2?'#4f805a':'#91a46c');}
  this.g.restore();
 }
 lantern(x,z){const p=this.p(x,z),s=this.unit/15;this.g.save();this.g.translate(p.x,p.y);this.g.scale(s,s);this.ellipse(0,1,5,2,'#476758');this.rect(-2,-3,5,4,C.ink);this.rect(-1,-27,2,26,C.ink);this.rect(-4,-28,8,2,'#263f4b');this.rect(-4,-39,8,11,C.ink);this.rect(-3,-37,6,7,'#e9ac57');this.rect(-1,-36,3,6,'#ffe9a6');this.poly([{x:-5,y:-39},{x:0,y:-43},{x:5,y:-39}],C.ink);this.rect(0,-45,1,2,C.gold);this.g.restore();}
 signpost(x,z){const p=this.p(x,z);this.rect(p.x-1,p.y-20,3,21,'#725444');this.poly([{x:p.x-11,y:p.y-23},{x:p.x+8,y:p.y-23},{x:p.x+12,y:p.y-19},{x:p.x+8,y:p.y-15},{x:p.x-11,y:p.y-15}],'#c69e6b',C.ink);this.rect(p.x-7,p.y-20,10,1,'#705445');this.rect(p.x-7,p.y-18,6,1,'#705445');}
 fence(x,z){for(let i=-3;i<=3;i+=2){const p=this.p(x+i,z-.4);this.rect(p.x-2,p.y-10,4,11,'#71614e');this.rect(p.x-2,p.y-11,4,2,'#d6b882');if(i<3){const q=this.p(x+i+1.7,z-.4);this.line(p.x,p.y-7,q.x,q.y-7,'#a98d60',2);}}}
 berryBush(x,z,active){const p=this.p(x,z),s=this.unit/15;this.g.save();this.g.translate(p.x,p.y);this.g.scale(s,s);this.ellipse(0,1,17,6,'#476e51');for(let i=0;i<4;i++){this.ellipse(-11+i*7,-6-(i%2)*6,9,9,'#224f49');this.ellipse(-12+i*7,-9-(i%2)*6,7,6,'#3a7755');this.ellipse(-14+i*7,-11-(i%2)*6,3,3,'#68955f');}for(let i=0;i<12;i++){const xx=(noise(i+1)-.5)*27,yy=-3-noise(i+75)*14;this.rect(xx,yy,3,3,'#7d3d62');this.rect(xx,yy,2,2,'#ee8baa');this.rect(xx,yy,1,1,'#ffc6c8');}this.g.restore();if(active)this.marker(x,z,-35,'berry');}
 nest(x,z,egg,active){const p=this.p(x,z),s=this.unit/15;this.g.save();this.g.translate(p.x,p.y);this.g.scale(s,s);this.ellipse(0,2,19,7,'#3d6b56');this.ellipse(0,1,15,5,'#947652');this.ellipse(0,-1,12,4,'#c6a56c');this.ellipse(0,-2,9,3,'#806342');for(let i=0;i<13;i++){const a=i/13*TAU;this.rect(Math.cos(a)*12,-1+Math.sin(a)*4,4,1,i%2?'#e1c18c':'#a98454');}if(egg)this.egg(0,-5+Math.sin(this.time*2)*1.5,1.12);this.g.restore();if(active)this.marker(x,z,-42,'egg');}
 egg(x,y,s=1){this.g.save();this.g.translate(x,y);this.g.scale(s,s);this.poly([{x:-8,y:0},{x:-9,y:-6},{x:-7,y:-15},{x:-3,y:-20},{x:2,y:-21},{x:7,y:-15},{x:9,y:-6},{x:7,y:0},{x:2,y:3},{x:-4,y:3}],'#365b70');this.poly([{x:-6,y:0},{x:-7,y:-6},{x:-5,y:-15},{x:-2,y:-19},{x:2,y:-19},{x:5,y:-14},{x:7,y:-6},{x:5,y:0},{x:1,y:2},{x:-3,y:2}],'#f2e7cd');this.rect(-5,-12,3,4,'#6ad6cc');this.rect(1,-17,3,4,'#acd6ea');this.rect(2,-5,4,4,'#70c6c6');this.rect(-5,-2,3,3,'#d19bce');this.rect(-3,-16,2,3,'#fff7e4');this.g.restore();}
 incubator(x,z,state){const p=this.p(x,z),s=this.unit/15;this.g.save();this.g.translate(p.x,p.y);this.g.scale(s,s);this.ellipse(0,2,14,5,'#416450');this.ellipse(0,0,12,5,'#777d70');this.rect(-12,-3,24,3,'#b3b19a');this.ellipse(0,-4,12,4,'#d8c997');this.ellipse(0,-5,9,3,'#a49067');if(state.eggFound&&!state.petHatched){this.egg(0,-6+Math.sin(this.time*2),1);if(state.stage==='hatch'){for(let i=0;i<5;i++){const a=this.time*1.2+i*TAU/5;this.spark(Math.cos(a)*18,-18+Math.sin(a)*12,'#ffeca0');}}}else{this.rect(-4,-10,8,5,'#ffe0a3');this.rect(-6,-6,12,2,'#8c7050');}this.g.restore();if(state.stage==='return'||state.stage==='hatch')this.marker(x,z,-42,'star');}
 marker(x,z,height,type){const p=this.p(x,z);const bob=Math.round(Math.sin(this.time*2.8)*2);const y=p.y+height*this.unit/15+bob;this.poly([{x:p.x-9,y:y-9},{x:p.x+9,y:y-9},{x:p.x+9,y:y+5},{x:p.x+3,y:y+5},{x:p.x,y:y+9},{x:p.x-3,y:y+5},{x:p.x-9,y:y+5}],'#fff1c9',C.ink);if(type==='egg'){this.ellipse(p.x,y-2,3,5,'#70bcba');this.rect(p.x-1,y-5,2,2,'#d9f4e4');}else if(type==='berry'){this.rect(p.x-4,y-3,5,5,'#c45a8a');this.rect(p.x,y-5,5,5,'#e77d9f');this.rect(p.x-1,y-7,2,3,'#4a8963');}else this.spark(p.x,y-2,'#d79539');}
 spark(x,y,c){this.rect(x-3,y,7,1,c);this.rect(x,y-3,1,7,c);this.rect(x-1,y-1,3,3,c);}
 avatar(player,avatar,walking,carry){const p=this.p(player.x,player.z),s=this.unit/15;const age=avatar.age==='child'?.9:avatar.age==='adult'?1.08:1;this.g.save();this.g.translate(p.x,p.y);this.g.scale(s*age,s*age);const bob=walking?Math.round(Math.sin(this.time*12)*1):0,step=walking?Math.round(Math.sin(this.time*12)*2):0;this.ellipse(0,1,9,3,'#345e53');this.g.translate(0,bob);const skin=avatar.skin||'#edbb8b',shirt=avatar.shirt||'#e88b76',hair=avatar.hair||'#5a3c36';
  // Boots, cuffed trousers and a small explorer bag.
  this.rect(-6,-6,5,6,C.ink);this.rect(2,-6,5,6,C.ink);this.rect(-5,-7+step,4,6,'#3f5c79');this.rect(2,-7-step,4,6,'#3f5c79');this.rect(-6,-2+step,5,3,'#363c4d');this.rect(2,-2-step,6,3,'#363c4d');this.rect(-6,-20,13,14,C.ink);this.rect(-5,-19,11,12,shirt);this.rect(-4,-18,2,9,'#ffffff30');this.rect(-8,-17,3,8,skin);this.rect(6,-17,3,8,skin);this.rect(-9,-17,3,4,shirt);this.rect(6,-17,3,4,shirt);this.rect(-5,-8,11,2,'#5d5e63');this.rect(-3,-8,2,2,'#e9bd7c');
  this.rect(-5,-30,11,12,C.ink);this.rect(-7,-28,14,8,hair);this.rect(-5,-27,11,9,skin);this.rect(-3,-19,7,2,skin);this.rect(-6,-31,12,5,hair);this.rect(-7,-28,3,7,hair);this.rect(5,-28,2,5,hair);this.rect(-3,-32,7,2,hair);this.rect(-4,-30,6,1,'#c4926633');
  if(avatar.type==='pige'||avatar.type==='kvinde'){this.rect(-8,-25,3,14,hair);this.rect(7,-25,3,14,hair);this.rect(-8,-13,3,2,'#e6bf78');this.rect(7,-13,3,2,'#e6bf78');}
  const facingBack=Math.sin(player.angle||0)+Math.cos(player.angle||0)<-.65;
  if(facingBack){this.rect(-5,-27,11,8,hair);this.rect(-4,-17,9,9,'#9e7753');this.rect(-3,-16,7,6,'#c19a68');this.rect(-1,-13,3,1,'#e2c68e');}else{this.rect(-3,-24,2,2,C.ink);this.rect(3,-24,2,2,C.ink);this.rect(-3,-24,1,1,'#fff1dc');this.rect(3,-24,1,1,'#fff1dc');this.rect(0,-20,2,1,'#ac6c62');this.rect(-5,-21,2,1,'#e6a08a');this.rect(5,-21,1,1,'#e6a08a');}
  if(carry){this.g.save();this.g.translate(5,-10);this.g.scale(.48,.48);this.egg(0,0,1);this.g.restore();this.rect(6,-12,3,2,skin);}this.g.restore();
 }
 dragon(x,z,walking){const p=this.p(x,z),s=this.unit/15;const bob=Math.sin(this.time*(walking?11:3));this.g.save();this.g.translate(p.x,p.y);this.g.scale(s,s);this.ellipse(0,2,11,4,'#3a6256');this.g.translate(0,Math.round(bob));
  this.poly([{x:6,y:-7},{x:14,y:-5},{x:20,y:-11},{x:18,y:-4},{x:14,y:0},{x:5,y:-1}],'#224d59');this.poly([{x:7,y:-5},{x:14,y:-3},{x:19,y:-9},{x:15,y:-1},{x:7,y:0}],'#58bfb0');
  const flap=Math.round(Math.sin(this.time*5)*2);this.poly([{x:-3,y:-12},{x:-14,y:-22-flap},{x:-16,y:-10},{x:-8,y:-6}],'#294b66');this.poly([{x:-4,y:-12},{x:-13,y:-19-flap},{x:-13,y:-11},{x:-7,y:-8}],'#a9c5e0');this.poly([{x:5,y:-12},{x:14,y:-23-flap},{x:17,y:-12},{x:10,y:-7}],'#294b66');this.poly([{x:6,y:-12},{x:13,y:-19-flap},{x:14,y:-12},{x:10,y:-9}],'#9cbce1');
  this.ellipse(0,-6,9,8,'#244f58');this.ellipse(0,-7,7,7,'#5fc8b6');this.ellipse(0,-5,4,5,'#d5e9b7');this.rect(-7,-2,5,3,'#2e6c6d');this.rect(4,-2,5,3,'#2e6c6d');this.rect(-7,-3,4,2,'#80d1bd');this.rect(4,-3,4,2,'#80d1bd');
  this.rect(-7,-22,15,14,'#234b59');this.rect(-9,-19,19,8,'#234b59');this.rect(-7,-21,15,12,'#65d2bf');this.rect(-8,-18,17,6,'#65d2bf');this.rect(-5,-23,4,3,'#65d2bf');this.rect(3,-23,4,3,'#65d2bf');this.rect(-6,-25,2,4,'#f0dc9f');this.rect(5,-25,2,4,'#f0dc9f');this.rect(-5,-18,3,4,C.ink);this.rect(4,-18,3,4,C.ink);this.rect(-5,-18,1,2,'#ffffff');this.rect(4,-18,1,2,'#ffffff');this.rect(-2,-13,5,1,'#307a7c');this.rect(-7,-13,2,2,'#e7b9ac');this.rect(7,-13,2,2,'#e7b9ac');this.rect(-2,-22,4,2,'#9be2c9');this.g.restore();
 }
 fireflies(){for(let i=0;i<15;i++){const x=(noise(i+110)-.5)*19,z=(noise(i+56)-.5)*13;const p=this.p(x,z);const pulse=Math.sin(this.time*2+i*5);if(pulse>.3){const xx=p.x+Math.sin(this.time*.8+i)*4,yy=p.y-15-Math.cos(this.time*.5+i)*7;this.rect(xx,yy,1,2,'#fbe6a2');if(pulse>.8)this.rect(xx-1,yy,3,1,'#fff4c1');}}}
 destroy(){this.buffer.width=1;this.buffer.height=1;}
}
window.PixelRenderer=PixelRenderer;
})();
