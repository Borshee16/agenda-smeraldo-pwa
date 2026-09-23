import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,recurrenceDate,occurs,shift,changeShift,swapCandidates,saveTask,validateState,isCycleTask} from '../model.js';
const task={id:'monthly',name:'Visita',mode:'interval',start:'2026-01-31',every:1,unit:'months',duration:null,active:true,checkable:true};
test('Ricorrenze mensili ancorate al giorno originale, anche a fine mese',()=>{
 for(const date of ['2026-01-31','2026-02-28','2026-03-31','2027-02-28'])assert(occurs([task],task,date),date);
 for(const date of ['2026-02-27','2026-03-28','2026-01-30'])assert(!occurs([task],task,date),date);
 assert.equal(recurrenceDate(task.start,2,1,'months'),'2026-03-31');
 const bounded={...task,duration:60};assert(!occurs([bounded],bounded,'2026-04-30'));
});
test('Anni bisestili e finestre collegate usano date di calendario',()=>{
 const yearly={...task,start:'2024-02-29',unit:'years'};
 assert(occurs([yearly],yearly,'2025-02-28'));assert(occurs([yearly],yearly,'2028-02-29'));assert(!occurs([yearly],yearly,'2028-02-28'));
 const linked={id:'linked',name:'Prima',mode:'relative',parentId:task.id,before:3,after:3,active:true,checkable:false};
 assert(occurs([task,linked],linked,'2026-02-25'));assert(occurs([task,linked],linked,'2026-03-03'));assert(!occurs([task,linked],linked,'2026-03-04'));
});
test('Periodi mensili e indicatore del ciclo persistono nel backup',()=>{
 const period={...task,mode:'period',name:'Ciclo mestruale',length:7};
 assert(occurs([period],period,'2026-03-06'));assert(!occurs([period],period,'2026-03-07'));
 assert(isCycleTask(period));assert(!isCycleTask({...period,cycleMarker:false}));assert(!isCycleTask({...period,name:'Viaggio'}));
 const state=initialState();saveTask(state,{...period,cycleMarker:true},true);
 assert.equal(validateState(JSON.parse(JSON.stringify(state))).tasks[0].unit,'months');
 assert.throws(()=>validateState({...state,tasks:[{...period,unit:'weeks'}]}));
});
test('Scambio atomico tra persone, senza alterare le date successive',()=>{
 const s=initialState();s.roster.cycle=['M1','P1','R'];s.roster.people.push({id:'a',name:'A',offset:1},{id:'b',name:'B',offset:1});const date=s.roster.start;
 assert.equal(swapCandidates(s,'me',date,'P1').length,2);
 const before=JSON.stringify(s);assert.throws(()=>changeShift(s,'me',date,'P1'),/Scegli/);assert.equal(JSON.stringify(s),before);
 changeShift(s,'me',date,'P1','a');assert.equal(shift(s,'me',date),'P1');assert.equal(shift(s,'a',date),'M1');assert.equal(shift(s,'b',date),'P1');assert.equal(shift(s,'me','2026-09-15'),'P1');assert.equal(shift(s,'a','2026-09-15'),'R');
 changeShift(s,'me',date,'M1','a');assert.equal(shift(s,'a',date),'P1');assert.equal(shift(s,'me',date),'M1');
 changeShift(s,'me',date,'Ferie');assert.equal(shift(s,'me',date),'Ferie');assert.equal(shift(s,'a',date),'P1');
 assert.equal(validateState(JSON.parse(JSON.stringify(s))).overrides['me|'+date],'Ferie');
});
