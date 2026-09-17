
function norm(s=''){
  return String(s).toUpperCase()
    .replace(/\s+/g,'')
    .replace(/[－–—]/g,'-')
    .replace(/區域|票區|座位區/g,'區')
    .replace(/[（）()]/g,'')
    .trim();
}
function tokensForSection(name=''){
  const n=norm(name);
  const out=new Set([n]);
  out.add(n.replace(/區$/,''));
  // VIP A區 -> VIPA / A區 / A
  const m=n.match(/^(VIP)?([A-Z]{1,3}|\d{1,2}|[紅黃紫藍綠橘橙灰白黑]\d{0,2})(區)?$/);
  if(m){
    if(m[2]) out.add(m[2]);
    if(m[2]) out.add(m[2]+'區');
  }
  // 2FA區 / 2樓A區
  const f=n.match(/^([1-5])(?:F|樓)(.+)$/);
  if(f){out.add(f[1]+'F'+f[2].replace(/區$/,''));out.add(f[2]);out.add(f[2].replace(/區$/,''))}
  return [...out].filter(Boolean);
}
function scoreLabelToSection(text,section){
  const t=norm(text), toks=tokensForSection(section.name);
  if(!t)return 0;
  let best=0;
  for(const tok of toks){
    if(t===tok) best=Math.max(best,1);
    else if(t.includes(tok)||tok.includes(t)) best=Math.max(best,Math.min(t.length,tok.length)/Math.max(t.length,tok.length)*.84);
  }
  return best;
}
export function mapOcrLabelsToSections(labels,sections,stageType='end'){
  const src=(sections||[]).map(s=>({...s}));
  if(!src.length||!(labels||[]).length)return {applied:false,sections:src,matches:[],confidence:0,reason:'no-labels-or-sections'};
  const candidates=[];
  for(let si=0;si<src.length;si++){
    for(let li=0;li<labels.length;li++){
      const l=labels[li],score=scoreLabelToSection(l.text,src[si])*(l.confidence??1);
      if(score>=.58)candidates.push({si,li,score});
    }
  }
  candidates.sort((a,b)=>b.score-a.score);
  const usedS=new Set(),usedL=new Set(),matches=[];
  for(const c of candidates){
    if(usedS.has(c.si)||usedL.has(c.li))continue;
    // ambiguity guard: if a competing candidate is too close, skip.
    const rivalS=candidates.find(x=>x!==c&&x.si===c.si&&!usedL.has(x.li));
    const rivalL=candidates.find(x=>x!==c&&x.li===c.li&&!usedS.has(x.si));
    if((rivalS&&rivalS.score>c.score-.08)||(rivalL&&rivalL.score>c.score-.08))continue;
    usedS.add(c.si);usedL.add(c.li);
    const l=labels[c.li],s=src[c.si],maxArc=String(stageType).startsWith('center')?150:118;
    const angle=Math.max(-maxArc,Math.min(maxArc,(l.cx-.5)*maxArc*2));
    src[c.si]={...s,angle:+angle.toFixed(1),mappingConfidence:'ocr-assisted',mappingSource:'seatmap-label',
      visualAnchor:{text:l.text,cx:l.cx,cy:l.cy,ocrConfidence:l.confidence}};
    matches.push({index:c.si,name:s.name,label:l.text,score:+c.score.toFixed(2),cx:l.cx,cy:l.cy,angle:+angle.toFixed(1)});
  }
  const coverage=matches.length/src.length;
  const avg=matches.length?matches.reduce((n,m)=>n+m.score,0)/matches.length:0;
  const confidence=+(avg*(.55+.45*coverage)).toFixed(2);
  const applied=matches.length>=2&&coverage>=.30&&confidence>=.54;
  return {applied,sections:applied?src:(sections||[]).map(s=>({...s})),matches,coverage:+coverage.toFixed(2),confidence,
    reason:applied?'label-anchor-match':'insufficient-unambiguous-label-matches'};
}
export function normalizeOcrBlocks(blocks,width,height){
  return (blocks||[]).map(b=>{
    const box=b.bbox||b.boundingBox||b.box||{};
    const x=box.x??box.left??0,y=box.y??box.top??0,w=box.width??((box.right??0)-(box.left??0)),h=box.height??((box.bottom??0)-(box.top??0));
    return {
      text:String(b.rawValue??b.text??'').trim(),
      confidence:Math.max(0,Math.min(1,Number(b.confidence??b.score??.8))),
      cx:+((x+w/2)/(width||1)).toFixed(4),cy:+((y+h/2)/(height||1)).toFixed(4),
      bbox:{x:+(x/(width||1)).toFixed(4),y:+(y/(height||1)).toFixed(4),w:+(w/(width||1)).toFixed(4),h:+(h/(height||1)).toFixed(4)}
    };
  }).filter(x=>x.text);
}
