import {inferSectionsFromSignals} from './lib/source-engine.mjs';
const good=[{text:'VIP A區 NT$ 9380、A區 7980、B區 6980、2F C區 5980',seatImages:[{src:'x'}]}];
const r=inferSectionsFromSignals({sections:[]},good,[9380,7980,6980,5980],'end-extended','https://example.com/map.jpg');
if(r.sections.length<3) throw new Error('section parser did not produce enough zones');
if(r.status!=='mapped-estimated') throw new Error('unexpected mapping status '+r.status);
console.log(JSON.stringify(r,null,2));
