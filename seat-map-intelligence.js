const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rgbDist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
function hsv(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h=((h*60)+360)%360;}return[h,d/(mx||1),mx];}
function priceList(event={}){
  const fromRules=[...new Set((event.sectionPriceRules||[]).map(x=>String(x.price||'').match(/[\d,]{3,6}/)?.[0]).filter(Boolean))];
  if(fromRules.length) return fromRules.map(x=>`NT$${x}`);
  return [...new Set(String(event.price||'').match(/(?:NT\$\s*)?[\d,]{3,6}/g)||[])].map(x=>`NT$${x.replace(/[^\d,]/g,'')}`);
}
function dominantPalette(data,w,h){
  const bins=new Map(),y0=Math.floor(h*.68);
  for(let y=y0;y<h*.94;y+=2)for(let x=Math.floor(w*.05);x<w*.95;x+=2){const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];if(a<200)continue;const[,s,v]=hsv(r,g,b);if(s<.24||v<.28||v>.97)continue;const key=`${Math.round(r/32)},${Math.round(g/32)},${Math.round(b/32)}`;const item=bins.get(key)||{n:0,r:0,g:0,b:0,x:0};item.n++;item.r+=r;item.g+=g;item.b+=b;item.x+=x;bins.set(key,item);}
  return [...bins.values()].filter(x=>x.n>10).sort((a,b)=>b.n-a.n).slice(0,10).map(x=>({rgb:[x.r/x.n,x.g/x.n,x.b/x.n],x:x.x/x.n,n:x.n})).sort((a,b)=>a.x-b.x);
}
function componentsForPalette(data,w,h,palette){
  const labels=new Int16Array(w*h);labels.fill(-1);const y0=Math.floor(h*.20),y1=Math.floor(h*.90),x0=Math.floor(w*.04),x1=Math.floor(w*.96);
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];if(a<180)continue;const[,s,v]=hsv(r,g,b);if(s<.2||v<.22||v>.98)continue;let best=-1,bd=78;for(let p=0;p<palette.length;p++){const d=rgbDist([r,g,b],palette[p].rgb);if(d<bd){bd=d;best=p;}}if(best>=0)labels[y*w+x]=best;}
  const seen=new Uint8Array(w*h),out=[];const qx=new Int32Array(w*h),qy=new Int32Array(w*h);const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let y=y0;y<y1;y+=2)for(let x=x0;x<x1;x+=2){const idx=y*w+x,p=labels[idx];if(p<0||seen[idx])continue;let head=0,tail=0;qx[tail]=x;qy[tail++]=y;seen[idx]=1;let n=0,minX=x,maxX=x,minY=y,maxY=y,sumX=0,sumY=0;while(head<tail&&tail<w*h){const cx=qx[head],cy=qy[head++],ci=cy*w+cx;if(labels[ci]!==p)continue;n++;sumX+=cx;sumY+=cy;minX=Math.min(minX,cx);maxX=Math.max(maxX,cx);minY=Math.min(minY,cy);maxY=Math.max(maxY,cy);for(const[dX,dY]of dirs){const nx=cx+dX,ny=cy+dY;if(nx<x0||nx>=x1||ny<y0||ny>=y1)continue;const ni=ny*w+nx;if(!seen[ni]&&labels[ni]===p){seen[ni]=1;qx[tail]=nx;qy[tail++]=ny;}}}
    if(n>Math.max(70,w*h*.00022)&&(maxX-minX)>5&&(maxY-minY)>5)out.push({palette:p,n,minX,maxX,minY,maxY,cx:sumX/n,cy:sumY/n});
  }
  return out.sort((a,b)=>b.n-a.n).slice(0,80);
}
function darkStage(data,w,h){
  const x0=Math.floor(w*.16),x1=Math.floor(w*.84),y0=Math.floor(h*.22),y1=Math.floor(h*.78),mask=new Uint8Array(w*h);
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2];const[,s,v]=hsv(r,g,b);if(v>.10&&v<.62&&s<.22)mask[y*w+x]=1;}
  const seen=new Uint8Array(w*h),comps=[],stack=[];for(let y=y0;y<y1;y+=2)for(let x=x0;x<x1;x+=2){let idx=y*w+x;if(!mask[idx]||seen[idx])continue;stack.length=0;stack.push(idx);seen[idx]=1;let n=0,minX=x,maxX=x,minY=y,maxY=y,sumX=0,sumY=0;while(stack.length){idx=stack.pop();const cy=Math.floor(idx/w),cx=idx-cy*w;n++;sumX+=cx;sumY+=cy;minX=Math.min(minX,cx);maxX=Math.max(maxX,cx);minY=Math.min(minY,cy);maxY=Math.max(maxY,cy);for(const ni of [idx-1,idx+1,idx-w,idx+w])if(ni>=0&&ni<w*h&&!seen[ni]&&mask[ni]){seen[ni]=1;stack.push(ni);}}if(n>w*h*.001)comps.push({n,minX,maxX,minY,maxY,cx:sumX/n,cy:sumY/n});}
  return comps.sort((a,b)=>b.n-a.n)[0]||null;
}
function mapRect(comp,w,h,field){const sx=field.x*1.45,sz=field.z*1.55;return{x:(comp.cx/w-.5)*sx,z:(comp.cy/h-.54)*sz,width:clamp((comp.maxX-comp.minX)/w*sx,10,field.x*.55),depth:clamp((comp.maxY-comp.minY)/h*sz,10,field.z*.55)};}
export async function analyzeSeatMap(event,venueModel){
  if(!event?.seatLayoutSourceUrl||!venueModel?.field||typeof createImageBitmap!=='function')return null;
  const r=await fetch(`/api/seat-map-image?url=${encodeURIComponent(event.seatLayoutSourceUrl)}`,{headers:{Accept:'image/*'}});if(!r.ok)return null;const hash=r.headers.get('X-NEUL-SeatMap-Hash')||'';const blob=await r.blob();const bmp=await createImageBitmap(blob);const scale=Math.min(1,720/Math.max(bmp.width,bmp.height)),w=Math.max(160,Math.round(bmp.width*scale)),h=Math.max(160,Math.round(bmp.height*scale));const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(bmp,0,0,w,h);bmp.close?.();const data=ctx.getImageData(0,0,w,h).data;const palette=dominantPalette(data,w,h);const comps=componentsForPalette(data,w,h,palette);const prices=priceList(event);const field=venueModel.field;
  const legend=palette.slice(0,Math.min(prices.length,palette.length)).map((p,i)=>({...p,price:prices[i]||null}));
  const central=comps.filter(q=>Math.abs(q.cx/w-.5)<.34&&q.cy/h>.26&&q.cy/h<.82).slice(0,32);
  const sections=central.map((q,i)=>{const rect=mapRect(q,w,h,field),pal=palette[q.palette],match=legend.reduce((best,l)=>!best||rgbDist(pal.rgb,l.rgb)<rgbDist(pal.rgb,best.rgb)?l:best,null);return{id:`AUTO-${i+1}`,label:match?.price?`官方圖 ${match.price} 區 ${i+1}`:`官方圖票區 ${i+1}`,tier:'AUTO-MAP',shape:'block',x:rect.x,z:rect.z,y:-19,width:rect.width,depth:rect.depth,rowMin:1,rowMax:18,seatEstimateMax:24,group:`auto-${q.palette}`,autoDerived:true,autoPrice:match?.price||null};});
  const st=darkStage(data,w,h),stageRect=st?mapRect(st,w,h,field):null;let stage=null,extraStageRects=[];let profile='unknown';if(stageRect){const cx=st.cx/w,cy=st.cy/h,aspect=stageRect.width/stageRect.depth;if(Math.abs(cx-.5)<.16&&Math.abs(cy-.53)<.20&&aspect>.55&&aspect<1.8&&stageRect.width>field.x*.18&&stageRect.depth>field.z*.16){profile='central-radial';stage={main:{x:stageRect.x,y:-16,z:stageRect.z,width:clamp(stageRect.width*.38,32,70),depth:clamp(stageRect.depth*.38,28,64)},runway:null,bStage:null,centerStage:true};const len=Math.max(stageRect.width,stageRect.depth)*.58,wid=Math.max(10,Math.min(18,len*.12));for(const a of [Math.PI/4,-Math.PI/4,3*Math.PI/4,-3*Math.PI/4])extraStageRects.push({x:stageRect.x+Math.sin(a)*len*.22,y:-15,z:stageRect.z+Math.cos(a)*len*.22,width:wid,depth:len,ry:a});}else{profile='end-stage';stage={main:{x:stageRect.x,y:-16,z:stageRect.z,width:clamp(stageRect.width,40,field.x*.82),depth:clamp(stageRect.depth,18,field.z*.35)},runway:null,bStage:null};}}
  return{hash,profile,stage,extraStageRects,sections,tiers:sections.length?[{id:'AUTO-MAP',label:'官方座位圖自動票區',short:'官方圖',sections:sections.map(s=>s.id)}]:[],legend,confidence:stage&&sections.length>=3?'map-pixel-derived':'partial-map-derived',width:bmp?.width||w,height:bmp?.height||h};
}
