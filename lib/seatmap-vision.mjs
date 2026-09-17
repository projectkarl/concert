
const COLOR_HUES={red:0,orange:30,yellow:58,green:125,blue:220,purple:285};
const COLOR_TOKENS={
  red:/紅|red/i, orange:/橘|橙|orange/i, yellow:/黃|yellow/i,
  green:/綠|green/i, blue:/藍|blue/i, purple:/紫|purple/i
};
function hueDistance(a,b){const d=Math.abs(a-b)%360;return Math.min(d,360-d)}
function rgbToHsl(r,g,b){
  r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
  let h=0,s=0,l=(mx+mn)/2;
  if(d){
    s=d/(1-Math.abs(2*l-1));
    if(mx===r)h=60*(((g-b)/d)%6);
    else if(mx===g)h=60*((b-r)/d+2);
    else h=60*((r-g)/d+4);
    if(h<0)h+=360;
  }
  return [h,s,l];
}
function semanticColor(h,s,l){
  if(s<.34||l<.18||l>.91)return null;
  let best=null,dist=999;
  for(const [name,target] of Object.entries(COLOR_HUES)){
    const d=hueDistance(h,target);if(d<dist){dist=d;best=name}
  }
  return dist<=42?best:null;
}
export function sectionColorToken(name=''){
  for(const [color,rx] of Object.entries(COLOR_TOKENS))if(rx.test(String(name)))return color;
  return null;
}
export function analyzeSeatMapPixels(data,width,height){
  if(!data||!width||!height)throw new Error('invalid image data');
  const total=width*height, labels=new Int8Array(total);
  const names=['red','orange','yellow','green','blue','purple'];
  const idOf=new Map(names.map((n,i)=>[n,i+1]));
  let colored=0,dark=0,edge=0;
  const lum=new Float32Array(total);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=y*width+x,i=p*4,r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
    const L=(.2126*r+.7152*g+.0722*b)/255;lum[p]=L;
    if(a<160)continue;if(L<.25)dark++;
    const [h,s,l]=rgbToHsl(r,g,b),c=semanticColor(h,s,l);
    if(c){labels[p]=idOf.get(c);colored++}
  }
  for(let y=1;y<height-1;y+=2)for(let x=1;x<width-1;x+=2){
    const p=y*width+x;
    if(Math.abs(lum[p]-lum[p+1])+Math.abs(lum[p]-lum[p+width])>.32)edge++;
  }
  const seen=new Uint8Array(total),regions=[];
  const minComponent=Math.max(10,Math.round(total*.0012));
  for(let p0=0;p0<total;p0++){
    const label=labels[p0];if(!label||seen[p0])continue;
    const q=[p0];seen[p0]=1;let qi=0,count=0,sumX=0,sumY=0,minX=width,minY=height,maxX=0,maxY=0;
    while(qi<q.length){
      const p=q[qi++],y=Math.floor(p/width),x=p-y*width;
      count++;sumX+=x;sumY+=y;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;
        const np=ny*width+nx;if(!seen[np]&&labels[np]===label){seen[np]=1;q.push(np)}
      }
    }
    if(count>=minComponent){
      regions.push({
        color:names[label-1],pixels:count,share:+(count/total).toFixed(4),
        cx:+((sumX/count)/(width-1||1)).toFixed(4),cy:+((sumY/count)/(height-1||1)).toFixed(4),
        bbox:{x:+(minX/(width-1||1)).toFixed(4),y:+(minY/(height-1||1)).toFixed(4),
          w:+((maxX-minX+1)/width).toFixed(4),h:+((maxY-minY+1)/height).toFixed(4)}
      });
    }
  }
  regions.sort((a,b)=>b.pixels-a.pixels);
  const colorCentroids={};
  for(const name of names){
    const rs=regions.filter(r=>r.color===name);
    const sum=rs.reduce((n,r)=>n+r.pixels,0);
    if(sum)colorCentroids[name]={
      color:name,pixels:sum,
      cx:+(rs.reduce((n,r)=>n+r.cx*r.pixels,0)/sum).toFixed(4),
      cy:+(rs.reduce((n,r)=>n+r.cy*r.pixels,0)/sum).toFixed(4),
      components:rs.length
    };
  }
  const edgeSamples=Math.max(1,Math.ceil((height-2)/2)*Math.ceil((width-2)/2));
  const colorRatio=colored/total,edgeDensity=edge/edgeSamples;
  const confidence=Math.max(0,Math.min(.92,.24+Math.min(.32,colorRatio*1.8)+Math.min(.22,edgeDensity*.7)+Math.min(.14,regions.length*.025)));
  return {
    schema:'neul.seatmap.vision.v2',width,height,
    colorRegionRatio:+colorRatio.toFixed(4),darkRatio:+(dark/total).toFixed(4),edgeDensity:+edgeDensity.toFixed(4),
    regionCount:regions.length,regions:regions.slice(0,24),colorCentroids,
    confidence:+confidence.toFixed(2),method:'semantic-color-components'
  };
}
export function applyVisionToSectionMapping(sections,vision,stageType='end'){
  const src=(sections||[]).map(s=>({...s}));
  if(!src.length||!vision?.colorCentroids)return {applied:false,sections:src,matches:[],confidence:0,reason:'no-sections-or-vision'};
  const byColor={};
  src.forEach((s,i)=>{const c=sectionColorToken(s.name);if(c)(byColor[c]??=[]).push(i)});
  const matches=[];
  const maxArc=String(stageType).startsWith('center')?150:118;
  for(const [color,idxs] of Object.entries(byColor)){
    const centroid=vision.colorCentroids[color];
    // Conservative: duplicate same-color section names are ambiguous without OCR/shape labels.
    if(!centroid||idxs.length!==1)continue;
    const i=idxs[0],old=src[i],angle=Math.max(-maxArc,Math.min(maxArc,(centroid.cx-.5)*maxArc*2));
    src[i]={
      ...old,angle:+angle.toFixed(1),
      mappingConfidence:'vision-assisted',
      mappingSource:'seatmap-color+ticket-text',
      visualAnchor:{color,cx:centroid.cx,cy:centroid.cy,components:centroid.components}
    };
    matches.push({index:i,name:old.name,color,cx:centroid.cx,cy:centroid.cy,angle:+angle.toFixed(1)});
  }
  const coverage=matches.length/src.length;
  const confidence=+(vision.confidence*(.55+.45*coverage)).toFixed(2);
  const applied=matches.length>=2&&coverage>=.30&&vision.confidence>=.45;
  return {applied,sections:applied?src:sections.map(s=>({...s})),matches,coverage:+coverage.toFixed(2),confidence,
    reason:applied?'color-anchor-match':'insufficient-unambiguous-color-matches'};
}
