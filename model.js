export const DAY = 86400000;
export const CODES = ['M1','M2','P1','P2','R','RC','Ferie'];
export const KINDS = {M1:'morning',M2:'morning',P1:'afternoon',P2:'afternoon',R:'rest',RC:'rest',Ferie:'vacation','–':'rest'};
export const LABELS = {M1:'Mattina',M2:'Mattina',P1:'Pomeriggio',P2:'Pomeriggio',R:'Riposo',RC:'Riposo',Ferie:'Ferie','–':'Non impostato'};
export const parse = s => new Date(s+'T00:00:00Z');
export const iso = d => d.toISOString().slice(0,10);
export const add = (s,n) => iso(new Date(+parse(s)+n*DAY));
export const diff = (a,b) => Math.round((+parse(a)-+parse(b))/DAY);
export const fmt = (s,opts={day:'numeric',month:'long'}) => new Intl.DateTimeFormat('it-IT',{timeZone:'UTC',...opts}).format(parse(s));
export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export const validDate = s => typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && s>='1900-01-01' && s<='2199-12-31' && Number.isFinite(+parse(s)) && iso(parse(s))===s;
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const ident=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(s);
export function initialState(){return {version:1,profile:{name:'La mia agenda'},roster:{start:'2026-09-14',sourceEnd:'2026-10-18',cycle:[],people:[{id:'me',name:'Io',offset:0}],primaryId:'me'},tasks:[],templates:[],overrides:{},completed:{},trash:[],revision:0};}
export function shift(state,personId,date){const key=personId+'|'+date;if(Object.hasOwn(state.overrides,key))return state.overrides[key];const r=state.roster,p=r.people.find(p=>p.id===personId);if(!p||!r.cycle.length)return '–';return r.cycle[((diff(date,r.start)+p.offset)%r.cycle.length+r.cycle.length)%r.cycle.length];}
// Calendar recurrences always anchor to the original day, including month ends.
export function recurrenceDate(start,index,every=1,unit='days'){
 if(unit==='days')return add(start,index*every);
 const d=parse(start),months=index*every*(unit==='years'?12:1),first=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+months,1));
 const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
 first.setUTCDate(Math.min(d.getUTCDate(),last));return iso(first);
}
export function recurrenceOffset(t,s){
 if(s<t.start)return -1;const unit=t.unit||'days';
 if(unit==='days')return diff(s,t.start)%t.every;
 const a=parse(t.start),b=parse(s),months=(b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth();
 let i=Math.floor(months/(t.every*(unit==='years'?12:1)));
 if(recurrenceDate(t.start,i,t.every,unit)>s)i--;
 return i<0?-1:diff(s,recurrenceDate(t.start,i,t.every,unit));
}
export function isCycleTask(t){return /^(?:ciclo(?:\s+mestruale)?|mestruazioni)$/i.test(t.name.trim())&&t.mode!=='relative';}
export function swapCandidates(state,personId,date,code){return state.roster.people.filter(p=>p.id!==personId&&shift(state,p.id,date)===code);}
export function changeShift(state,personId,date,code,partnerId=''){
 if(!validDate(date)||!CODES.includes(code)||!state.roster.people.some(p=>p.id===personId))throw Error('Turno o giorno non valido.');
 const old=shift(state,personId,date);if(old===code)return;
 const candidates=swapCandidates(state,personId,date,code);
 if(candidates.length){
  const partner=candidates.find(p=>p.id===partnerId);if(!partner)throw Error('Scegli con chi scambiare il turno.');
  if(!CODES.includes(old))throw Error('Imposta prima il turno di partenza.');
  state.overrides[partner.id+'|'+date]=old;
 }else if(partnerId)throw Error('Il turno del collega è cambiato. Scegli di nuovo.');
 state.overrides[personId+'|'+date]=code;
}
export function originalShift(state,personId,date){return shift({...state,overrides:{}},personId,date);}
export function restoreShiftCandidates(state,personId,date){
 const current=shift(state,personId,date),original=originalShift(state,personId,date);
 if(current===original)return [];
 return state.roster.people.filter(p=>p.id!==personId&&Object.hasOwn(state.overrides,p.id+'|'+date)&&shift(state,p.id,date)===original&&originalShift(state,p.id,date)===current);
}
export function resetShift(state,personId,date,partnerId=''){
 if(!validDate(date)||!state.roster.people.some(p=>p.id===personId))throw Error('Persona o giorno non valido.');
 if(partnerId&&!restoreShiftCandidates(state,personId,date).some(p=>p.id===partnerId))throw Error('Lo scambio non corrisponde più ai turni attuali.');
 delete state.overrides[personId+'|'+date];
 if(partnerId)delete state.overrides[partnerId+'|'+date];
}
export function dependsOn(tasks,id,target,seen=new Set()){if(id===target)return true;if(seen.has(id))return true;seen.add(id);const t=tasks.find(t=>t.id===id);return !!t&&t.mode==='relative'&&dependsOn(tasks,t.parentId,target,seen);}
export function validateTask(t,tasks=[],template=false){
 if(!t||!ident(t.id))return 'Identificativo dell’attività non valido.';
 if(typeof t.name!=='string'||!t.name.trim()||t.name.length>100)return 'Inserisci un nome di massimo 100 caratteri.';
 if(typeof t.checkable!=='boolean'||typeof t.active!=='boolean')return 'Impostazioni dell’attività non valide.';
 if(!['once','dates','interval','period','consecutive','relative'].includes(t.mode))return 'Tipo di ripetizione non valido.';
 if(!template){if(t.mode==='once'&&!validDate(t.date))return 'Scegli un giorno valido.';if(t.mode==='dates'&&(!Array.isArray(t.dates)||!t.dates.length||t.dates.length>366||t.dates.some(d=>!validDate(d))))return 'Aggiungi almeno una data valida.';if(['period','interval','consecutive'].includes(t.mode)&&!validDate(t.start))return 'Imposta il primo giorno.';}
 if(t.unit!==undefined&&!['days','months','years'].includes(t.unit))return 'Unità di tempo non valida.';
 if(t.cycleMarker!==undefined&&typeof t.cycleMarker!=='boolean')return 'Indicatore del ciclo non valido.';
 if(['interval','period','consecutive'].includes(t.mode)&&!integer(t.every,1,3650))return 'Inserisci una cadenza intera maggiore di zero.';
 if(t.mode==='period'&&(!integer(t.length,1,365)||t.length>t.every*({days:1,months:28,years:365}[t.unit||'days'])))return 'La durata deve essere tra 1 e 365 giorni e non superare l’intervallo tra gli inizi.';
 if(t.mode==='consecutive'&&!integer(t.duration,1,3650))return 'Inserisci la durata in giorni interi.';
 if(t.mode==='interval'&&t.duration!==null&&!integer(t.duration,1,3650))return 'Inserisci una durata valida o lascia il campo vuoto.';
 if(t.mode==='relative'){if(!integer(t.before,0,365)||!integer(t.after,0,365))return 'Inserisci giorni interi tra 0 e 365.';if(!template&&(!tasks.some(p=>p.id===t.parentId)||dependsOn(tasks,t.parentId,t.id)))return 'Scegli una voce di riferimento indipendente da questa attività.';}
 return '';
}
export function occurs(tasks,t,s,seen=new Set(),cache=new Map()){
 if(!t||!t.active||seen.has(t.id))return false;const key=t.id+'|'+s;if(cache.has(key))return cache.get(key);let result=false;
 if(t.mode==='relative'){const parent=tasks.find(a=>a.id===t.parentId),nextSeen=new Set(seen);nextSeen.add(t.id);for(let n=-t.after;n<=t.before;n++){if(!parent||!parent.active||nextSeen.has(parent.id))break;const anchor=add(s,n);const present=parent.mode==='period'?recurrenceOffset(parent,anchor)===0:occurs(tasks,parent,anchor,nextSeen,cache);if(present){result=true;break}}}
 else if(t.mode==='once')result=t.date===s;
 else if(t.mode==='dates')result=t.dates.includes(s);
 else {const n=diff(s,t.start),offset=recurrenceOffset(t,s);result=t.mode==='period'?offset>=0&&offset<t.length:n>=0&&(!t.duration||n<t.duration)&&offset===0;}
 cache.set(key,result);return result;
}
export function due(state,s){const cache=new Map();return state.tasks.filter(t=>occurs(state.tasks,t,s,new Set(),cache));}
export function summary(t,tasks=[]){const unit={days:t.every===1?'giorno':'giorni',months:t.every===1?'mese':'mesi',years:t.every===1?'anno':'anni'}[t.unit||'days'];if(t.mode==='once')return validDate(t.date)?fmt(t.date,{day:'numeric',month:'short',year:'numeric'})+' · non si ripete':'Una sola data';if(t.mode==='dates')return (t.dates||[]).map(d=>fmt(d,{day:'numeric',month:'short'})).join(' · ');if(t.mode==='period')return `${t.length} giorni ogni ${t.every} ${unit}${validDate(t.start)?' · dal '+fmt(t.start,{day:'numeric',month:'short'}):''}`;if(t.mode==='relative'){const p=tasks.find(a=>a.id===t.parentId);return `Da ${t.before} giorni prima a ${t.after} giorni dopo ${p?.mode==='period'?'l’inizio di ':''}«${p?.name||'voce da scegliere'}»${p&&!p.active?' · disattivata':''}`;}if(t.mode==='consecutive')return `Ogni giorno per ${t.duration} giorni`;return `Ogni ${t.every} ${unit}${t.duration?' per '+t.duration+' giorni':''}${validDate(t.start)?' · dal '+fmt(t.start,{day:'numeric',month:'short'}):''}`;}
export function dateSpan(s,n){return fmt(s,{day:'numeric',month:'short',year:'numeric'})+' – '+fmt(add(s,n-1),{day:'numeric',month:'short',year:'numeric'});}
export function makeTemplate(task){const t=structuredClone(task);delete t.date;delete t.start;delete t.dates;delete t.templateId;delete t.reusable;if(t.mode==='relative')t.parentId=null;return t;}
export function saveTask(state,task,reusable){const error=validateTask(task,state.tasks);if(error)throw Error(error);const t={...task,reusable};const i=state.tasks.findIndex(a=>a.id===t.id);if(i<0)state.tasks.push(t);else state.tasks[i]=t;state.templates=state.templates.filter(a=>a.id!==t.id);if(reusable)state.templates.push(makeTemplate(t));}
export function removeTask(state,id){const task=state.tasks.find(t=>t.id===id);if(!task)return;const affected=state.tasks.filter(t=>t.id!==id&&dependsOn(state.tasks,t.id,id));if(affected.length)throw Error('Prima modifica o elimina le attività collegate: '+affected.map(t=>t.name).join(', '));state.trash.push({task:structuredClone(task),template:state.templates.find(t=>t.id===id)||null,completed:Object.fromEntries(Object.entries(state.completed).filter(([k])=>k.startsWith(id+'|'))),deletedAt:new Date().toISOString()});state.trash=state.trash.slice(-30);state.tasks=state.tasks.filter(t=>t.id!==id);state.templates=state.templates.filter(t=>t.id!==id);for(const k of Object.keys(state.completed))if(k.startsWith(id+'|'))delete state.completed[k];}
export function restoreTask(state,id){const item=state.trash.find(x=>x.task.id===id);if(!item)return;const error=validateTask(item.task,state.tasks);if(error)throw Error(error);state.tasks.push(item.task);if(item.template)state.templates.push(item.template);Object.assign(state.completed,item.completed);state.trash=state.trash.filter(x=>x.task.id!==id);}
export function holiday(s){const fixed={'01-01':'Capodanno','01-06':'Epifania','04-25':'Festa della Liberazione','05-01':'Festa del Lavoro','06-02':'Festa della Repubblica','08-15':'Ferragosto','11-01':'Ognissanti','12-08':'Immacolata Concezione','12-25':'Natale','12-26':'Santo Stefano'};if(fixed[s.slice(5)])return fixed[s.slice(5)];const y=parse(s).getUTCFullYear(),a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),em=Math.floor((h+l-7*m+114)/31),ed=(h+l-7*m+114)%31+1,ea=iso(new Date(Date.UTC(y,em-1,ed)));if(s===ea)return 'Pasqua';if(s===add(ea,1))return 'Lunedì dell’Angelo';return parse(s).getUTCDay()===0?'Domenica':'';}
export function validateState(input){
 const s=structuredClone(input);if(!s||s.version!==1)throw Error('Formato del backup non riconosciuto.');if(typeof s.profile?.name!=='string'||s.profile.name.length>100)throw Error('Profilo non valido.');const r=s.roster;if(!r||!validDate(r.start)||!validDate(r.sourceEnd)||!Array.isArray(r.cycle)||r.cycle.length>366||r.cycle.some(c=>!CODES.includes(c))||!Array.isArray(r.people)||r.people.length>100||!r.people.length)throw Error('Turni non validi.');
 if(r.people.some(p=>!ident(p.id)||typeof p.name!=='string'||!p.name||p.name.length>100||!integer(p.offset,0,365))||new Set(r.people.map(p=>p.id)).size!==r.people.length||!r.people.some(p=>p.id===r.primaryId))throw Error('Persone del calendario non valide.');
 if(!Array.isArray(s.tasks)||s.tasks.length>2000||new Set(s.tasks.map(t=>t.id)).size!==s.tasks.length||!Array.isArray(s.templates)||s.templates.length>2000)throw Error('Elenco delle attività non valido.');for(const t of s.tasks){const error=validateTask(t,s.tasks);if(error)throw Error(error);}for(const t of s.templates){const error=validateTask(t,s.tasks,true);if(error)throw Error(error);}
 for(const [name,kind]of [['overrides','shift'],['completed','check']]){const obj=s[name];if(!obj||Array.isArray(obj)||typeof obj!=='object'||Object.keys(obj).length>50000)throw Error('Dati non validi.');for(const [key,v]of Object.entries(obj)){const [id,date,...extra]=key.split('|');if(extra.length||!ident(id)||!validDate(date)||(kind==='shift'?!r.people.some(p=>p.id===id)||!CODES.includes(v):typeof v!=='boolean'))throw Error('Voce del calendario non valida.');}}
 if(!Array.isArray(s.trash)||s.trash.length>30)throw Error('Elenco delle eliminate non valido.');
 const all=[...s.tasks,...s.trash.map(x=>x.task)];for(const item of s.trash){if(!item||validateTask(item.task,all)||typeof item.deletedAt!=='string'||!validDate(item.deletedAt.slice(0,10))||!item.completed||typeof item.completed!=='object')throw Error('Voce eliminata non valida.');if(item.template&&validateTask(item.template,all,true))throw Error('Modello eliminato non valido.');for(const [k,v]of Object.entries(item.completed)){const [id,date,...extra]=k.split('|');if(extra.length||id!==item.task.id||!validDate(date)||typeof v!=='boolean')throw Error('Spunte eliminate non valide.');}}
 s.revision=integer(s.revision,0,Number.MAX_SAFE_INTEGER)?s.revision:0;return s;
}
