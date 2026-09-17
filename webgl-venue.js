// NEUL lightweight native WebGL2 venue renderer.
// No external runtime dependency: everything is shipped with the Vercel project.

const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
uniform mat4 uModel;
uniform mat4 uViewProj;
out vec3 vNormal;
out vec3 vWorld;
void main(){
  vec4 world=uModel*vec4(aPosition,1.0);
  vWorld=world.xyz;
  vNormal=mat3(uModel)*aNormal;
  gl_Position=uViewProj*world;
}`;

const FRAG = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
uniform vec3 uColor;
uniform vec3 uEmissive;
uniform vec3 uCamera;
uniform vec3 uLightDir;
out vec4 outColor;
void main(){
  vec3 n=normalize(vNormal);
  float lam=max(dot(n,normalize(uLightDir)),0.0);
  float rim=pow(1.0-max(dot(n,normalize(uCamera-vWorld)),0.0),2.0)*0.16;
  vec3 col=uColor*(0.34+0.72*lam+rim)+uEmissive;
  float dist=length(uCamera-vWorld);
  float fog=1.0-exp(-dist*0.0018);
  outColor=vec4(mix(col,vec3(0.025,0.035,0.05),clamp(fog,0.0,0.82)),1.0);
}`;

const INST_VERT = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec4 iM0;
layout(location=3) in vec4 iM1;
layout(location=4) in vec4 iM2;
layout(location=5) in vec4 iM3;
layout(location=6) in vec3 iColor;
uniform mat4 uViewProj;
out vec3 vNormal;
out vec3 vWorld;
out vec3 vColor;
void main(){
  mat4 model=mat4(iM0,iM1,iM2,iM3);
  vec4 world=model*vec4(aPosition,1.0);
  vWorld=world.xyz;
  vNormal=mat3(model)*aNormal;
  vColor=iColor;
  gl_Position=uViewProj*world;
}`;

const INST_FRAG = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
in vec3 vColor;
uniform vec3 uCamera;
uniform vec3 uLightDir;
out vec4 outColor;
void main(){
  vec3 n=normalize(vNormal);
  float lam=max(dot(n,normalize(uLightDir)),0.0);
  float dist=length(uCamera-vWorld);
  float fog=1.0-exp(-dist*0.0018);
  vec3 col=vColor*(0.38+0.7*lam);
  outColor=vec4(mix(col,vec3(0.025,0.035,0.05),clamp(fog,0.0,0.82)),1.0);
}`;

const LINE_VERT = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
uniform mat4 uViewProj;
void main(){ gl_Position=uViewProj*vec4(aPosition,1.0); }`;
const LINE_FRAG = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 outColor;
void main(){ outColor=uColor; }`;

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function rad(v){return v*Math.PI/180;}
function color3(hex){const h=hex.replace('#','');const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}

function mat4Identity(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);}
function mat4Multiply(a,b){
  const o=new Float32Array(16);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  return o;
}
function mat4Perspective(fovy,aspect,near,far){
  const f=1/Math.tan(fovy/2),nf=1/(near-far),o=new Float32Array(16);
  o[0]=f/aspect;o[5]=f;o[10]=(far+near)*nf;o[11]=-1;o[14]=2*far*near*nf;return o;
}
function vNorm(v){const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];}
function vCross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function mat4LookAt(eye,target,up=[0,1,0]){
  const z=vNorm([eye[0]-target[0],eye[1]-target[1],eye[2]-target[2]]),x=vNorm(vCross(up,z)),y=vCross(z,x);
  return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]),-(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]),-(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]),1]);
}
function mat4TRS(x,y,z,ry=0,sx=1,sy=1,sz=1){
  const c=Math.cos(ry),s=Math.sin(ry);
  return new Float32Array([c*sx,0,-s*sx,0,0,sy,0,0,s*sz,0,c*sz,0,x,y,z,1]);
}

function compile(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'shader compile failed');return s;}
function program(gl,vs,fs){const p=gl.createProgram();gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p)||'program link failed');return p;}

function faceNormal(a,b,c){const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];return vNorm(vCross(u,v));}
function meshFromFaces(faces){
  const pos=[],nor=[];
  for(const f of faces){const n=faceNormal(f[0],f[1],f[2]);for(const p of f){pos.push(...p);nor.push(...n);}}
  return {positions:new Float32Array(pos),normals:new Float32Array(nor),count:pos.length/3};
}
function cubeMesh(){
  const p=[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]];
  return meshFromFaces([[p[0],p[1],p[2]],[p[0],p[2],p[3]],[p[5],p[4],p[7]],[p[5],p[7],p[6]],[p[4],p[0],p[3]],[p[4],p[3],p[7]],[p[1],p[5],p[6]],[p[1],p[6],p[2]],[p[3],p[2],p[6]],[p[3],p[6],p[7]],[p[4],p[5],p[1]],[p[4],p[1],p[0]]]);
}
const CUBE=cubeMesh();

function sectionColor(layout,section,selected,theme='dark'){
  const light=theme==='light';
  if(selected)return light?'#d94ee8':'#d98cff';
  if(layout.restrictedViewSections?.includes(String(section.id)))return light?'#c27b2d':'#8d6745';
  if(layout.id==='plave-keep-it-manic-2026')return (light?{vip6300:'#cf5b76','5300':'#2f8b75','3800':'#9a8e2d','2900':'#41865d'}:{vip6300:'#7d3d4d','5300':'#315d54','3800':'#77733b','2900':'#365846'})[section.group]||(light?'#657888':'#39434d');
  if(layout.id==='ive-show-what-i-am-2026')return (light?{vip7800:'#e05ca8','5800':'#55a2d1','4800':'#d77d88','3800':'#44aaa5',side2f:'#7797bd','3fRange':'#9277b3',box4800:'#aa7381'}:{vip7800:'#c45190','5800':'#5687a6','4800':'#aa6971','3800':'#4e908c',side2f:'#657991','3fRange':'#735e8b',box4800:'#825f68'})[section.group]||(light?'#657888':'#39434d');
  const dark={FLOOR:'#333640',LOWER:'#37434d',MIDDLE:'#303b47',VIP:'#473b49',UPPER4:'#333e48',UPPER5:'#2c3741','2F':'#36434f','3F':'#423b51',UPPER:'#303a45','4F':'#3d3b47','5F':'#303943',BOX:'#4d4048',BOWL:'#38444d',REAR:'#3f4248'};
  const bright={FLOOR:'#68727f',LOWER:'#627d90',MIDDLE:'#587189',VIP:'#9a708f',UPPER4:'#60788d',UPPER5:'#526c82','2F':'#5f8098','3F':'#7f6f9b',UPPER:'#5c748b','4F':'#766c83','5F':'#596f84',BOX:'#8f6f83',BOWL:'#657f91',REAR:'#747b86'};
  return (light?bright:dark)[section.tier]||(light?'#667d8d':'#37414a');
}
function sectionTop(section){
  if(section.tier==='FLOOR'||section.shape==='block'||Number.isFinite(section.x)){
    const w=section.width||38,d=section.depth||32,y=section.y??-20;return[[section.x-w/2,y,section.z-d/2],[section.x+w/2,y,section.z-d/2],[section.x+w/2,y,section.z+d/2],[section.x-w/2,y,section.z+d/2]];
  }
  const half=section.span||.11,ox=section.radiusX+22,oz=section.radiusZ+17,ix=section.radiusX-5,iz=section.radiusZ-4,y0=section.y,y1=section.y+11;
  return[[Math.cos(section.angle-half)*ix,y0,Math.sin(section.angle-half)*iz],[Math.cos(section.angle+half)*ix,y0,Math.sin(section.angle+half)*iz],[Math.cos(section.angle+half)*ox,y1,Math.sin(section.angle+half)*oz],[Math.cos(section.angle-half)*ox,y1,Math.sin(section.angle-half)*oz]];
}
function prism(top,thickness=7){
  const b=top.map(([x,y,z])=>[x,y-thickness,z]);
  return meshFromFaces([[top[0],top[1],top[2]],[top[0],top[2],top[3]],[b[0],b[2],b[1]],[b[0],b[3],b[2]],[top[0],b[0],b[1]],[top[0],b[1],top[1]],[top[1],b[1],b[2]],[top[1],b[2],top[2]],[top[2],b[2],b[3]],[top[2],b[3],top[3]],[top[3],b[3],b[0]],[top[3],b[0],top[0]]]);
}
function seatSamples(section,selected,quality){
  const out=[],rows=selected?(quality==='high'?8:6):(quality==='high'?3:2),cols=selected?(quality==='high'?12:9):(quality==='high'?5:3);
  if(section.shape==='block'||section.tier==='FLOOR'||Number.isFinite(section.x)){
    const w=section.width||38,d=section.depth||32;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const u=(c+.5)/cols,v=(r+.5)/rows;out.push({x:section.x-w/2+u*w,y:(section.y??-20)+2.4,z:section.z-d/2+v*d,rot:Math.atan2(-section.x,-section.z)});}return out;
  }
  const span=section.span||.11;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const v=(r+.5)/rows,u=(c+.5)/cols,a=section.angle-span*.78+u*span*1.56,rx=section.radiusX-1+v*24,rz=section.radiusZ-1+v*18;out.push({x:Math.cos(a)*rx,y:section.y+3+v*10,z:Math.sin(a)*rz,rot:Math.atan2(-Math.cos(a),-Math.sin(a))});}return out;
}
function boxItem(cfg,color,emissive='#090a0d',height=5){const h=cfg.height||height;return{mesh:CUBE,model:mat4TRS(cfg.x||0,(cfg.y??-16)+h/2,cfg.z||0,cfg.ry||0,cfg.width||40,h,cfg.depth||20),color,emissive};}
function ringLine(rx,rz,y,n=96){const a=[];for(let i=0;i<=n;i++){const t=i/n*Math.PI*2;a.push(Math.cos(t)*rx,y,Math.sin(t)*rz);}return new Float32Array(a);}
function rectLine(top,yOffset=.6){const a=[];for(let i=0;i<=top.length;i++){const p=top[i%top.length];a.push(p[0],p[1]+yOffset,p[2]);}return new Float32Array(a);}

function buildCPUScene(config,quality){
  const {model,layout,sections,selectedId}=config,solids=[],lines=[],seatMats=[],seatColors=[],theme=config.theme||'dark';
  const lightTheme=theme==='light';
  solids.push(boxItem({x:0,y:-27,z:0,width:model.field.x*2.15,depth:model.field.z*2.2},lightTheme?'#26303a':'#151b20','#000000',3));
  for(const sec of sections){const selected=String(sec.id)===selectedId,top=sectionTop(sec);solids.push({mesh:prism(top,selected?9:6.5),model:mat4Identity(),color:sectionColor(layout,sec,selected,theme),emissive:selected?(lightTheme?'#7c237f':'#5e1f75'):'#06080b'});if(selected)lines.push({vertices:rectLine(top),color:lightTheme?[1,.88,1,1]:[.96,.83,1,1]});for(const s of seatSamples(sec,selected,quality)){seatMats.push(mat4TRS(s.x,s.y,s.z,s.rot,2.15,1.8,1.8));seatColors.push(...color3(selected?(lightTheme?'#ffd0ff':'#f2b7ff'):sectionColor(layout,sec,false,theme)));}}
  const stage=layout.stage||model.stage;solids.push(boxItem(stage.main,'#090a0e','#251427',7));
  if(stage.runway){const r=stage.runway;solids.push(boxItem({x:r.x,y:r.y,z:(r.z1+r.z2)/2,width:r.width,depth:Math.abs(r.z2-r.z1)},'#15131a','#29152d',4.4));}
  if(stage.bStage){const r=stage.bStage.radius;const pts=[];const n=40;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;const y=stage.bStage.y;pts.push([[stage.bStage.x,y+4,stage.bStage.z],[stage.bStage.x+Math.cos(a)*r,y+4,stage.bStage.z+Math.sin(a)*r],[stage.bStage.x+Math.cos(b)*r,y+4,stage.bStage.z+Math.sin(b)*r]]);}solids.push({mesh:meshFromFaces(pts),model:mat4Identity(),color:'#18131c',emissive:'#28142f'});}
  for(const r of layout.extraStageRects||[])solids.push(boxItem(r,'#14131a','#24172a',4.2));
  if(layout.foh)solids.push(boxItem(layout.foh,'#373d43','#101214',3.2));
  const m=stage.main;
  const screenH=Math.max(26,m.width*.22),screenZ=m.z-m.depth/2+2,screenY=m.y+Math.max(16,m.width*.13);
  // Main LED wall + side IMAG screens. These are original geometry, not copied venue assets.
  solids.push(boxItem({x:m.x,y:screenY,z:screenZ,width:m.width*.72,depth:1.8},'#d8d4ff','#8068ff',screenH));
  solids.push(boxItem({x:m.x-m.width*.60,y:screenY-1,z:screenZ+1,width:m.width*.18,depth:1.6},'#d9d5ff','#5d7dff',screenH*.78));
  solids.push(boxItem({x:m.x+m.width*.60,y:screenY-1,z:screenZ+1,width:m.width*.18,depth:1.6},'#f1d9ff','#8b58c9',screenH*.78));
  // Truss and hanging speaker arrays make the venue feel more like a live concert without pretending to be an exact rig.
  const trussY=m.y+screenH+18;
  solids.push(boxItem({x:m.x,y:trussY,z:m.z,width:m.width*1.24,depth:2.4},'#29313a','#111923',2.4));
  solids.push(boxItem({x:m.x-m.width*.62,y:m.y+screenH*.55,z:m.z,width:2.2,depth:2.2},'#252d35','#090c12',screenH+28));
  solids.push(boxItem({x:m.x+m.width*.62,y:m.y+screenH*.55,z:m.z,width:2.2,depth:2.2},'#252d35','#090c12',screenH+28));
  solids.push(boxItem({x:m.x-m.width*.76,y:m.y+screenH*.48,z:m.z+3,width:4.8,depth:5.5},'#10151b','#050608',screenH*.72));
  solids.push(boxItem({x:m.x+m.width*.76,y:m.y+screenH*.48,z:m.z+3,width:4.8,depth:5.5},'#10151b','#050608',screenH*.72));
  for(let i=0;i<9;i++){const u=i/8,px=m.x-m.width*.42+u*m.width*.84;solids.push(boxItem({x:px,y:m.y+5,z:m.z+m.depth*.42,width:1.1,depth:1.1},'#fff1ff',i%2?'#7c63ff':'#d85bff',1.4));}
  // Deterministic audience light points. Kept sparse so low-end phones remain smooth.
  const glowCount=quality==='high'?42:20;
  for(let i=0;i<glowCount;i++){const a=(i*2.3999632297)% (Math.PI*2), ring=.22+(i%11)/13, gx=Math.cos(a)*model.field.x*1.45*ring, gz=Math.sin(a)*model.field.z*1.5*ring;if(Math.abs(gx-m.x)<m.width*.7 && Math.abs(gz-m.z)<m.depth*1.8)continue;const gy=-18+(i%4)*.35;solids.push(boxItem({x:gx,y:gy,z:gz,width:.42,depth:.42},'#f5e8ff',i%3===0?'#6c76ff':i%3===1?'#d158e7':'#53a6ff',1.7));}
  // Soft spotlight beams are rendered as translucent lines to suggest concert atmosphere.
  const beamOrigins=[m.x-m.width*.35,m.x-m.width*.12,m.x+m.width*.12,m.x+m.width*.35];
  beamOrigins.forEach((bx,i)=>{const tx=(i-1.5)*model.field.x*.32,tz=model.field.z*(.35+(i%2)*.25);lines.push({vertices:new Float32Array([bx,trussY,m.z+2,tx,6,tz]),color:i%2?[.58,.48,1,.20]:[1,.48,.88,.18]});});
  const maxY=Math.max(...sections.map(s=>(s.y||0)+18),85),rx=model.field.x*2.05,rz=model.field.z*2.05;
  for(let i=0;i<3;i++)lines.push({vertices:ringLine(rx+i*14,rz+i*11,maxY+20+i*12),color:[.45,.52,.6,.38]});
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;solids.push(boxItem({x:Math.cos(a)*rx*.99,y:-18,z:Math.sin(a)*rz*.99,width:2.5,depth:2.5},'#26303a','#05070a',maxY+65));}
  for(const o of config.occluders||[]){solids.push(boxItem(o,o.color||'#343b42',o.kind==='overhang'?'#080a0c':'#101318',o.height||4));}
  const sp=config.seatPosition;solids.push(boxItem({x:sp[0],y:sp[1]-3,z:sp[2],width:4,depth:4,height:6},'#ffe2ff','#c45de4',6));
  const maxSeats=quality==='high'?1900:950,seatCount=Math.min(maxSeats,seatMats.length);
  return{solids,lines:lines.filter(x=>x.vertices),seatMats:seatMats.slice(0,seatCount),seatColors:new Float32Array(seatColors.slice(0,seatCount*3)),seatCount};
}

class Renderer{
  constructor(canvas,quality){
    this.canvas=canvas;this.quality=quality;this.gl=canvas.getContext('webgl2',{antialias:quality==='high',alpha:false,powerPreference:'high-performance',depth:true,stencil:false});
    if(!this.gl)throw new Error('WebGL2 unavailable');const gl=this.gl;
    this.prog=program(gl,VERT,FRAG);this.instProg=program(gl,INST_VERT,INST_FRAG);this.lineProg=program(gl,LINE_VERT,LINE_FRAG);this.key='';this.cpu=null;this.gpu=[];this.lineGpu=[];this.seatGpu=null;
    gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(.012,.018,.03,1);
  }
  disposeScene(){const gl=this.gl;for(const x of this.gpu){gl.deleteBuffer(x.p);gl.deleteBuffer(x.n);gl.deleteVertexArray(x.vao);}for(const x of this.lineGpu){gl.deleteBuffer(x.b);gl.deleteVertexArray(x.vao);}if(this.seatGpu){for(const b of Object.values(this.seatGpu.buffers))gl.deleteBuffer(b);gl.deleteVertexArray(this.seatGpu.vao);}this.gpu=[];this.lineGpu=[];this.seatGpu=null;}
  uploadMesh(mesh){const gl=this.gl,vao=gl.createVertexArray();gl.bindVertexArray(vao);const p=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.bufferData(gl.ARRAY_BUFFER,mesh.positions,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);const n=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,mesh.normals,gl.STATIC_DRAW);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);gl.bindVertexArray(null);return{vao,p,n,count:mesh.count};}
  uploadLine(vertices){const gl=this.gl,vao=gl.createVertexArray();gl.bindVertexArray(vao);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);gl.bindVertexArray(null);return{vao,b,count:vertices.length/3};}
  uploadSeats(cpu){const gl=this.gl,vao=gl.createVertexArray();gl.bindVertexArray(vao);const p=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.bufferData(gl.ARRAY_BUFFER,CUBE.positions,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);const n=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,CUBE.normals,gl.STATIC_DRAW);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);const mats=new Float32Array(cpu.seatCount*16);cpu.seatMats.forEach((m,i)=>mats.set(m,i*16));const mb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,mb);gl.bufferData(gl.ARRAY_BUFFER,mats,gl.STATIC_DRAW);for(let i=0;i<4;i++){gl.enableVertexAttribArray(2+i);gl.vertexAttribPointer(2+i,4,gl.FLOAT,false,64,i*16);gl.vertexAttribDivisor(2+i,1);}const cb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,cb);gl.bufferData(gl.ARRAY_BUFFER,cpu.seatColors,gl.STATIC_DRAW);gl.enableVertexAttribArray(6);gl.vertexAttribPointer(6,3,gl.FLOAT,false,0,0);gl.vertexAttribDivisor(6,1);gl.bindVertexArray(null);return{vao,count:CUBE.count,instances:cpu.seatCount,buffers:{p,n,mb,cb}};}
  sync(config){const key=[config.venueId,config.layoutId,config.selectedId,config.row,config.seatNumber,config.viewerHeight,config.posture,config.viewFov,config.theme,(config.occluders||[]).map(o=>o.kind).join(','),config.sections.length].join('|');if(key===this.key)return;this.key=key;this.disposeScene();this.cpu=buildCPUScene(config,this.quality);this.gpu=this.cpu.solids.map(x=>({...this.uploadMesh(x.mesh),model:x.model,color:color3(x.color),emissive:color3(x.emissive)}));this.lineGpu=this.cpu.lines.map(x=>({...this.uploadLine(x.vertices),color:x.color}));if(this.cpu.seatCount)this.seatGpu=this.uploadSeats(this.cpu);}
  resize(){const gl=this.gl,rect=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,this.quality==='high'?1.6:1.15),w=Math.max(2,Math.floor(rect.width*dpr)),h=Math.max(2,Math.floor(rect.height*dpr));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}gl.viewport(0,0,w,h);return{w,h};}
  render(config,{seatMode=false,yaw=-.45,pitch=.72,zoom=1}={}){this.sync(config);const gl=this.gl,{w,h}=this.resize();if(config.theme==='light')gl.clearColor(.035,.047,.061,1);else gl.clearColor(.012,.018,.03,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);let eye,target,fov;
    if(seatMode){const p=config.seatPosition,t=config.target,base=vNorm([t[0]-p[0],t[1]-p[1],t[2]-p[2]]),by=Math.atan2(base[0],base[2]),bp=Math.asin(clamp(base[1],-1,1)),ay=by+yaw,ap=bp+pitch,forward=[Math.sin(ay)*Math.cos(ap),Math.sin(ap),Math.cos(ay)*Math.cos(ap)];eye=[p[0],p[1],p[2]];target=[eye[0]+forward[0]*160,eye[1]+forward[1]*160,eye[2]+forward[2]*160];fov=rad(clamp((config.viewFov||58)/Math.max(.55,zoom),12,82));}
    else{const model=config.model,r=Math.max(model.field.x*3.2,model.field.z*4.1)/clamp(zoom,.55,1.9),el=clamp(pitch,.12,1.34);eye=[Math.sin(yaw)*Math.cos(el)*r,Math.sin(el)*r+28,Math.cos(yaw)*Math.cos(el)*r];target=[0,18,0];fov=rad(42);}
    const vp=mat4Multiply(mat4Perspective(fov,w/h,.5,2600),mat4LookAt(eye,target)),light=vNorm([-.35,.85,.25]);
    gl.useProgram(this.prog);gl.uniformMatrix4fv(gl.getUniformLocation(this.prog,'uViewProj'),false,vp);gl.uniform3fv(gl.getUniformLocation(this.prog,'uCamera'),eye);gl.uniform3fv(gl.getUniformLocation(this.prog,'uLightDir'),light);
    for(const x of this.gpu){gl.bindVertexArray(x.vao);gl.uniformMatrix4fv(gl.getUniformLocation(this.prog,'uModel'),false,x.model);gl.uniform3fv(gl.getUniformLocation(this.prog,'uColor'),x.color);gl.uniform3fv(gl.getUniformLocation(this.prog,'uEmissive'),x.emissive);gl.drawArrays(gl.TRIANGLES,0,x.count);}
    if(this.seatGpu){gl.useProgram(this.instProg);gl.uniformMatrix4fv(gl.getUniformLocation(this.instProg,'uViewProj'),false,vp);gl.uniform3fv(gl.getUniformLocation(this.instProg,'uCamera'),eye);gl.uniform3fv(gl.getUniformLocation(this.instProg,'uLightDir'),light);gl.bindVertexArray(this.seatGpu.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,this.seatGpu.count,this.seatGpu.instances);}
    gl.disable(gl.CULL_FACE);gl.useProgram(this.lineProg);gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProg,'uViewProj'),false,vp);for(const x of this.lineGpu){gl.bindVertexArray(x.vao);gl.uniform4fv(gl.getUniformLocation(this.lineProg,'uColor'),x.color);gl.drawArrays(gl.LINE_STRIP,0,x.count);}gl.enable(gl.CULL_FACE);gl.bindVertexArray(null);
  }
  dispose(){this.disposeScene();this.gl.deleteProgram(this.prog);this.gl.deleteProgram(this.instProg);this.gl.deleteProgram(this.lineProg);}
}

export async function createVenueWebGL({overviewCanvas,previewCanvas,viewerCanvas,getConfig,onStatus=()=>{}}){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches; const coarse=matchMedia('(pointer: coarse)').matches; const memory=navigator.deviceMemory||8; const cores=navigator.hardwareConcurrency||8; const quality=(reduced||memory<=4||cores<=4||(coarse&&matchMedia('(max-width: 760px)').matches))?'low':'high';
  let overview,preview,viewer;
  try{const probe=document.createElement('canvas').getContext('webgl2');if(!probe)throw new Error('WebGL2 unavailable');overview=new Renderer(overviewCanvas,quality);preview=new Renderer(previewCanvas,quality);viewer=new Renderer(viewerCanvas,quality);}catch(e){onStatus('fallback');return null;}
  const config=()=>getConfig();onStatus(`webgl2-${quality}`);
  return{
    renderOverview:()=>overview.render(config(),{seatMode:false,yaw:-.48,pitch:.72,zoom:1.04}),
    renderPreview:()=>preview.render(config(),{seatMode:true,yaw:0,pitch:0,zoom:1.03}),
    renderViewer:opts=>viewer.render(config(),opts),
    sync:()=>{const c=config();overview.sync(c);preview.sync(c);viewer.sync(c);},
    dispose:()=>{overview.dispose();preview.dispose();viewer.dispose();},quality
  };
}
