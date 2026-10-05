import {add,fmt,isCycleTask,recurrenceOffset,occurs,today,validDate} from './model.js';
const zone='Europe/Rome';
export function romeClock(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
 return {date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`};
}
export function reminderOccurs(state,t,date){return !t.excludedDates?.includes(date)&&occurs(state.tasks,t,date)&&(!isCycleTask(t)||t.mode!=='period'||recurrenceOffset(t,date)===0);}
export function readyReminders(state,now=new Date()){
 const clock=romeClock(now),minutes=time=>Number(time.slice(0,2))*60+Number(time.slice(3));
 return state.tasks.flatMap(t=>{const r=t.reminder;if(!r?.enabled)return [];const date=add(clock.date,r.daysBefore),late=minutes(clock.time)-minutes(r.time);if(late<0||late>5||state.completed[t.id+'|'+date]||!reminderOccurs(state,t,date))return [];return [{task:t,date,key:t.id+'|'+date+'|'+r.time+'|'+r.daysBefore}];});
}
// Use the selected Rome wall clock time; during the spring gap move forward to the next valid hour.
export function romeInstant(date,time){
 const wall=Date.parse(date+'T'+time+':00Z');let candidate=wall;const seen=[];
 for(let i=0;i<4;i++){const parts=romeClock(new Date(candidate));const observed=Date.parse(parts.date+'T'+parts.time+':00Z');const correction=wall-observed;if(!correction)return new Date(candidate);seen.push(candidate);const next=candidate+correction;if(seen.includes(next))return new Date(Math.max(candidate,next));candidate=next;}
 return new Date(candidate);
}
const stamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
const escapeText=s=>String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
function fold(line){let rows=[],row='',bytes=0;for(const ch of line){const size=new TextEncoder().encode(ch).length;if(bytes+size>73){rows.push(row);row=' ';bytes=1;}row+=ch;bytes+=size;}rows.push(row);return rows.join('\r\n');}
export function reminderCalendar(state,t,from=today()){
 if(!validDate(from)||!t.reminder||!/^([01]\d|2[0-3]):[0-5]\d$/.test(t.reminder.time)||![0,1].includes(t.reminder.daysBefore))throw Error('Scegli un orario valido.');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Agenda//Promemoria//IT','CALSCALE:GREGORIAN'];let count=0;
 for(let i=0;i<90;i++){const date=add(from,i);if(!reminderOccurs(state,t,date))continue;const noticeDate=add(date,-t.reminder.daysBefore);if(noticeDate<from)continue;const when=romeInstant(noticeDate,t.reminder.time);count++;lines.push('BEGIN:VEVENT','UID:'+t.id+'-'+date+'@agenda-smeraldo','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(when),'DTEND:'+stamp(new Date(+when+60000)),'SUMMARY:'+escapeText('Promemoria · '+t.name),'DESCRIPTION:'+escapeText('Attività del '+fmt(date,{day:'numeric',month:'long',year:'numeric'})+'. '+(t.notes||'')+'\nEsportazione dall’agenda: non sincronizzata.'),'BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:PT0S','DESCRIPTION:'+escapeText(t.name),'END:VALARM','END:VEVENT');}
 if(!count)throw Error('Nessun promemoria esportabile nei prossimi 90 giorni.');lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
}
export function setupReminders(getState,announce){
 const storageKey='agenda-reminders-delivered-v1';let delivered={};try{delivered=JSON.parse(localStorage.getItem(storageKey)||'{}');if(!delivered||Array.isArray(delivered)||typeof delivered!=='object')delivered={};}catch{}let running=false;
 async function tick(){if(document.visibilityState==='hidden'||running)return;running=true;try{for(const item of readyReminders(getState())){if(delivered[item.key])continue;const body=item.task.name+' · '+fmt(item.date);let shown=false;if('Notification'in window&&Notification.permission==='granted'){try{const reg=await navigator.serviceWorker?.getRegistration();if(reg){await reg.showNotification('Promemoria agenda',{body,tag:item.key,icon:'./icons/icon-192.png'});shown=true;}else{new Notification('Promemoria agenda',{body,tag:item.key});shown=true;}}catch{}}if(!shown)announce('Promemoria: '+body);delivered[item.key]=Date.now();}delivered=Object.fromEntries(Object.entries(delivered).filter(([,at])=>typeof at==='number'&&Date.now()-at<100*86400000));try{localStorage.setItem(storageKey,JSON.stringify(delivered));}catch{}}finally{running=false;}}
 let timer=setInterval(tick,30000);document.addEventListener('visibilitychange',tick);window.addEventListener('pagehide',()=>{clearInterval(timer);timer=null;});window.addEventListener('pageshow',()=>{if(!timer)timer=setInterval(tick,30000);tick();});tick();
}
