import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,saveTask,validateState} from '../model.js';
const base={id:'test',name:'Yoga',mode:'once',date:'2026-10-25',active:true,checkable:false};
test('Nuove attività: promemoria attivo all’orario scelto o alle 09:00',()=>{const s=initialState();saveTask(s,{...base,time:'18:30'},true);assert.equal(s.tasks[0].reminder.enabled,true);assert.equal(s.tasks[0].reminder.time,'18:30');assert.equal(s.templates[0].reminder.enabled,true);saveTask(s,{...base,id:'other'},false);assert.equal(s.tasks[1].reminder.time,'09:00');});
test('Dati precedenti: abilita solo i promemoria mai configurati e conserva i disattivati',()=>{const s=initialState();s.tasks=[{...base},{...base,id:'off',reminder:{enabled:false,time:'11:00',daysBefore:1}}];const loaded=validateState(s);assert.equal(loaded.tasks[0].reminder.enabled,true);assert.equal(loaded.tasks[0].reminder.time,'09:00');assert.deepEqual(loaded.tasks[1].reminder,s.tasks[1].reminder);assert.deepEqual(validateState(loaded),loaded);});
