const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rgbDist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const priceDigits=v=>String(v||'').replace(/[^0-9]/g,'');

function hsv(r,g,b){
  r/=255;g/=255;b/=255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
  let h=0;
  if(d){
    if(mx===r)h=((g-b)/d)%6; else if(mx===g)h=(b-r)/d+2; else h=(r-g)/d+4;
    h=((h*60)+360)%360;
  }
  return[h,d/(mx||1),mx];
}

function eventPriceRules(event={}){
  return (Array.isArray(event.sectionPriceRules)?event.sectionPriceRules:[])
    .map(rule=>({label:String(rule?.label||''),price:String(rule?.price||'')}))
    .filter(rule=>rule.label||rule.price);
}
function priceList(event={}){
  const fromRules=[...new Set(eventPriceRules(event).map(x=>String(x.price).match(/[\d,]{3,6}/)?.[0]).filter(Boolean))];
  if(fromRules.length) return fromRules.map(x=>`NT$${x}`);
  return [...new Set(String(event.price||'').match(/(?:NT\$\s*)?[\d,]{3,6}/g)||[])].map(x=>`NT$${x.replace(/[^\d,]/g,'')}`);
}
function standingPriceKeys(event={}){
  const keys=new Set();
  for(const rule of eventPriceRules(event)) if(/站席|standing|搖滾|rock\s*zone/i.test(rule.label)){
    const k=priceDigits(rule.price); if(k) keys.add(k);
  }
  return keys;
}

function dominantPalette(data,w,h){
  // Ticket-map legends are commonly placed in the lower portion of the image. Sampling this
  // band keeps artist photos/header art from becoming fake ticket-zone colors.
  const bins=new Map(),y0=Math.floor(h*.64);
  for(let y=y0;y<h*.96;y+=2)for(let x=Math.floor(w*.04);x<w*.96;x+=2){
    const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2],a=data[i+3]; if(a<200)continue;
    const[,s,v]=hsv(r,g,b); if(s<.24||v<.28||v>.97)continue;
    const key=`${Math.round(r/32)},${Math.round(g/32)},${Math.round(b/32)}`;
    const item=bins.get(key)||{n:0,r:0,g:0,b:0,x:0,y:0};
    item.n++;item.r+=r;item.g+=g;item.b+=b;item.x+=x;item.y+=y;bins.set(key,item);
  }
  return [...bins.values()].filter(x=>x.n>10).sort((a,b)=>b.n-a.n).slice(0,12)
    .map(x=>({rgb:[x.r/x.n,x.g/x.n,x.b/x.n],x:x.x/x.n,y:x.y/x.n,n:x.n}))
    .sort((a,b)=>a.x-b.x||a.y-b.y);
}

function componentsForPalette(data,w,h,palette){
  const labels=new Int16Array(w*h);labels.fill(-1);
  const y0=Math.floor(h*.16),y1=Math.floor(h*.91),x0=Math.floor(w*.03),x1=Math.floor(w*.97);
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];if(a<180)continue;
    const[,s,v]=hsv(r,g,b);if(s<.20||v<.20||v>.985)continue;
    let best=-1,bd=76;
    for(let p=0;p<palette.length;p++){const d=rgbDist([r,g,b],palette[p].rgb);if(d<bd){bd=d;best=p;}}
    if(best>=0)labels[y*w+x]=best;
  }
  const seen=new Uint8Array(w*h),out=[];const qx=new Int32Array(w*h),qy=new Int32Array(w*h),dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let y=y0;y<y1;y+=2)for(let x=x0;x<x1;x+=2){
    const idx=y*w+x,p=labels[idx]; if(p<0||seen[idx])continue;
    let head=0,tail=0;qx[tail]=x;qy[tail++]=y;seen[idx]=1;
    let n=0,minX=x,maxX=x,minY=y,maxY=y,sumX=0,sumY=0;
    while(head<tail&&tail<w*h){
      const cx=qx[head],cy=qy[head++],ci=cy*w+cx;if(labels[ci]!==p)continue;
      n++;sumX+=cx;sumY+=cy;minX=Math.min(minX,cx);maxX=Math.max(maxX,cx);minY=Math.min(minY,cy);maxY=Math.max(maxY,cy);
      for(const[dX,dY]of dirs){const nx=cx+dX,ny=cy+dY;if(nx<x0||nx>=x1||ny<y0||ny>=y1)continue;const ni=ny*w+nx;if(!seen[ni]&&labels[ni]===p){seen[ni]=1;qx[tail]=nx;qy[tail++]=ny;}}
    }
    const bw=maxX-minX,bh=maxY-minY;
    if(n>Math.max(65,w*h*.00020)&&bw>5&&bh>5)out.push({palette:p,n,minX,maxX,minY,maxY,cx:sumX/n,cy:sumY/n,bw,bh});
  }
  return out.sort((a,b)=>b.n-a.n).slice(0,100);
}

function darkStage(data,w,h){
  const x0=Math.floor(w*.12),x1=Math.floor(w*.88),y0=Math.floor(h*.16),y1=Math.floor(h*.84),mask=new Uint8Array(w*h);
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2];const[,s,v]=hsv(r,g,b);
    if(v>.08&&v<.58&&s<.25)mask[y*w+x]=1;
  }
  const seen=new Uint8Array(w*h),comps=[],stack=[];
  for(let y=y0;y<y1;y+=2)for(let x=x0;x<x1;x+=2){
    let idx=y*w+x;if(!mask[idx]||seen[idx])continue;stack.length=0;stack.push(idx);seen[idx]=1;
    let n=0,minX=x,maxX=x,minY=y,maxY=y,sumX=0,sumY=0;
    while(stack.length){
      idx=stack.pop();const cy=Math.floor(idx/w),cx=idx-cy*w;n++;sumX+=cx;sumY+=cy;minX=Math.min(minX,cx);maxX=Math.max(maxX,cx);minY=Math.min(minY,cy);maxY=Math.max(maxY,cy);
      for(const ni of [idx-1,idx+1,idx-w,idx+w])if(ni>=0&&ni<w*h&&!seen[ni]&&mask[ni]){seen[ni]=1;stack.push(ni);}
    }
    if(n>w*h*.0008){
      const bw=maxX-minX,bh=maxY-minY,cx=sumX/n,cy=sumY/n,area=Math.max(1,bw*bh),fill=n/area;
      const nx=cx/w,ny=cy/h,centerBias=1-Math.min(.85,Math.hypot(nx-.5,(ny-.52)*.75));
      const sizeOk=bw>w*.035&&bh>h*.025&&bw<w*.68&&bh<h*.48;
      if(sizeOk)comps.push({n,minX,maxX,minY,maxY,cx,cy,bw,bh,score:n*(.45+centerBias)*(.5+Math.min(1,fill))});
    }
  }
  return comps.sort((a,b)=>b.score-a.score)[0]||null;
}

function mapRect(comp,w,h,field){
  const sx=field.x*1.45,sz=field.z*1.55;
  return{
    x:(comp.cx/w-.5)*sx,
    z:(comp.cy/h-.54)*sz,
    width:clamp((comp.maxX-comp.minX)/w*sx,8,field.x*.55),
    depth:clamp((comp.maxY-comp.minY)/h*sz,8,field.z*.55)
  };
}
function rectOverlapRatio(a,b,margin=0){
  if(!a||!b)return 0;
  const ax1=a.x-a.width/2,ax2=a.x+a.width/2,az1=a.z-a.depth/2,az2=a.z+a.depth/2;
  const bx1=b.x-b.width/2-margin,bx2=b.x+b.width/2+margin,bz1=b.z-b.depth/2-margin,bz2=b.z+b.depth/2+margin;
  const iw=Math.max(0,Math.min(ax2,bx2)-Math.max(ax1,bx1)),id=Math.max(0,Math.min(az2,bz2)-Math.max(az1,bz1));
  return iw*id/Math.max(1,a.width*a.depth);
}
function floorCandidate(comp,w,h){
  const nx=comp.cx/w,ny=comp.cy/h,bw=comp.bw/w,bh=comp.bh/h;
  // Event-specific floor blocks live in the central field. Outer/ring colors are fixed-bowl
  // pricing and should color existing physical sections instead of creating duplicate blocks.
  return nx>.18&&nx<.82&&ny>.24&&ny<.84&&bw<.48&&bh<.46;
}
function matchLegend(pal,legend){
  return legend.reduce((best,l)=>!best||rgbDist(pal.rgb,l.rgb)<rgbDist(pal.rgb,best.rgb)?l:best,null);
}

export async function analyzeSeatMap(event,venueModel){
  if(!event?.seatLayoutSourceUrl||!venueModel?.field||typeof createImageBitmap!=='function')return null;
  const r=await fetch(`/api/seat-map-image?url=${encodeURIComponent(event.seatLayoutSourceUrl)}`,{headers:{Accept:'image/*'}});
  if(!r.ok)return null;
  const hash=r.headers.get('X-NEUL-SeatMap-Hash')||'';
  const blob=await r.blob(),bmp=await createImageBitmap(blob);
  const originalWidth=bmp.width,originalHeight=bmp.height;
  const scale=Math.min(1,900/Math.max(bmp.width,bmp.height)),w=Math.max(180,Math.round(bmp.width*scale)),h=Math.max(180,Math.round(bmp.height*scale));
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(bmp,0,0,w,h);bmp.close?.();
  const data=ctx.getImageData(0,0,w,h).data,field=venueModel.field;
  const palette=dominantPalette(data,w,h),comps=componentsForPalette(data,w,h,palette),prices=priceList(event);
  const legend=palette.slice(0,Math.min(prices.length,palette.length)).map((p,i)=>({...p,price:prices[i]||null}));

  const st=darkStage(data,w,h),stageRect=st?mapRect(st,w,h,field):null;
  let stage=null,extraStageRects=[],profile='unknown';
  if(stageRect){
    const cx=st.cx/w,cy=st.cy/h,aspect=stageRect.width/stageRect.depth;
    if(Math.abs(cx-.5)<.18&&Math.abs(cy-.53)<.22&&aspect>.52&&aspect<1.95&&stageRect.width>field.x*.16&&stageRect.depth>field.z*.14){
      profile='central-radial';
      stage={main:{x:stageRect.x,y:-16,z:stageRect.z,width:clamp(stageRect.width*.38,30,72),depth:clamp(stageRect.depth*.38,26,66)},runway:null,bStage:null,centerStage:true};
      const len=Math.max(stageRect.width,stageRect.depth)*.62,wid=Math.max(9,Math.min(18,len*.12));
      for(const a of [Math.PI/4,-Math.PI/4,3*Math.PI/4,-3*Math.PI/4]) extraStageRects.push({x:stageRect.x+Math.sin(a)*len*.22,y:-15,z:stageRect.z+Math.cos(a)*len*.22,width:wid,depth:len,ry:a});
    }else{
      profile='end-stage';
      stage={main:{x:stageRect.x,y:-16,z:stageRect.z,width:clamp(stageRect.width,38,field.x*.84),depth:clamp(stageRect.depth,16,field.z*.36)},runway:null,bStage:null};
    }
  }

  const productionRects=[];
  if(stage?.main)productionRects.push(stage.main);
  productionRects.push(...extraStageRects);
  const standingPrices=standingPriceKeys(event);
  const sections=[];
  for(const q of comps){
    if(!floorCandidate(q,w,h))continue;
    const rect=mapRect(q,w,h,field);
    if(productionRects.some(prod=>rectOverlapRatio(rect,prod,4)>.26))continue;
    const pal=palette[q.palette],match=pal?matchLegend(pal,legend):null,autoPrice=match?.price||null;
    const standingOnly=autoPrice&&standingPrices.has(priceDigits(autoPrice));
    const rowMax=standingOnly?1:clamp(Math.round(rect.depth/2.3),4,24);
    const seatEstimateMax=standingOnly?null:clamp(Math.round(rect.width/2.15),6,38);
    sections.push({
      id:`AUTO-${sections.length+1}`,
      label:autoPrice?`官方圖 ${autoPrice} 區 ${sections.length+1}`:`官方圖票區 ${sections.length+1}`,
      tier:'AUTO-FLOOR',shape:'block',x:rect.x,z:rect.z,y:-19,width:rect.width,depth:rect.depth,
      rowMin:1,rowMax,seatEstimateMax,group:`auto-${q.palette}`,autoDerived:true,autoPrice,
      standingOnly:Boolean(standingOnly),eventActive:true,sourceSeatMapHash:hash
    });
    if(sections.length>=36)break;
  }
  const tiers=sections.length?[{id:'AUTO-FLOOR',label:'官方座位圖活動平面',short:'活動1F',sections:sections.map(s=>s.id)}]:[];
  const confidence=stage&&sections.length>=3?'map-pixel-derived':sections.length>=2?'floor-map-derived':'partial-map-derived';
  return{
    hash,profile,stage,extraStageRects,sections,tiers,legend,confidence,
    width:originalWidth||w,height:originalHeight||h,sourceUrl:event.seatLayoutSourceUrl,
    analysisVersion:'0.41'
  };
}
