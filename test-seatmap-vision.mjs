
import {analyzeSeatMapPixels,applyVisionToSectionMapping} from './lib/seatmap-vision.mjs';
const w=120,h=80,d=new Uint8ClampedArray(w*h*4);
for(let i=0;i<w*h;i++){d[i*4]=245;d[i*4+1]=245;d[i*4+2]=245;d[i*4+3]=255}
function rect(x0,y0,x1,y1,r,g,b){for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*w+x)*4;d[i]=r;d[i+1]=g;d[i+2]=b;d[i+3]=255}}
rect(8,18,34,64,225,45,55);      // red
rect(47,18,73,64,240,205,35);    // yellow
rect(86,18,112,64,150,60,205);   // purple
const v=analyzeSeatMapPixels(d,w,h);
if(!v.colorCentroids.red||!v.colorCentroids.yellow||!v.colorCentroids.purple)throw new Error('color regions missing');
const sections=[
 {name:'紅2',price:6800,angle:0,distance:48,mappingConfidence:'estimated'},
 {name:'黃2',price:5800,angle:0,distance:54,mappingConfidence:'estimated'},
 {name:'紫2',price:4800,angle:0,distance:60,mappingConfidence:'estimated'}
];
const m=applyVisionToSectionMapping(sections,v,'end');
if(!m.applied||m.matches.length!==3)throw new Error('vision mapping not applied');
if(!(m.sections[0].angle<m.sections[1].angle&&m.sections[1].angle<m.sections[2].angle))throw new Error('angles not ordered by visual anchors');
const dup=applyVisionToSectionMapping([{name:'紅2'},{name:'紅2高排'},{name:'黃2'},{name:'紫2'}],v,'end');
if(dup.matches.some(x=>x.color==='red'))throw new Error('ambiguous duplicate red sections should not auto-map');
console.log(JSON.stringify({vision:{confidence:v.confidence,regionCount:v.regionCount,colors:Object.keys(v.colorCentroids)},mapping:{applied:m.applied,matches:m.matches}},null,2));
