
import {mapOcrLabelsToSections,normalizeOcrBlocks} from './lib/seatmap-labels.mjs';
const labels=normalizeOcrBlocks([
 {text:'VIP A區',confidence:.94,bbox:{x:10,y:20,width:20,height:8}},
 {text:'B區',confidence:.91,bbox:{x:50,y:20,width:15,height:8}},
 {text:'2F C區',confidence:.90,bbox:{x:82,y:20,width:22,height:8}}
],120,80);
const sections=[
 {name:'VIP A區',price:9380,angle:0,distance:40},
 {name:'B區',price:6980,angle:0,distance:50},
 {name:'2F C區',price:5980,angle:0,distance:58}
];
const r=mapOcrLabelsToSections(labels,sections,'end');
if(!r.applied||r.matches.length!==3)throw new Error('OCR label mapping should apply');
if(!(r.sections[0].angle<r.sections[1].angle&&r.sections[1].angle<r.sections[2].angle))throw new Error('OCR anchors not ordered');
const ambiguous=mapOcrLabelsToSections([{text:'A',confidence:.9,cx:.3,cy:.5}],[
 {name:'A區'},{name:'VIP A區'}
],'end');
if(ambiguous.applied)throw new Error('ambiguous single label should not auto-apply');
console.log(JSON.stringify({labels,r,ambiguous},null,2));
