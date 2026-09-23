import test from 'node:test';
import assert from 'node:assert/strict';
import {startupState} from '../initial-data.js';
import {shift} from '../model.js';
test('Primo avvio: profilo, colleghi e turni già disponibili',()=>{
 const s=startupState();assert.equal(s.profile.name,'Fabiana Martorano');assert.equal(s.roster.primaryId,'fabiana');assert.equal(s.roster.people.length,7);assert.equal(s.roster.cycle.length,35);assert.equal(shift(s,'fabiana','2026-09-23'),'M2');assert.equal(s.tasks.length,0);
 s.profile.name='Modifica';assert.equal(startupState().profile.name,'Fabiana Martorano');
});
test('Un aggiornamento conserva le modifiche locali invece di ricaricare il prospetto',()=>{
 const saved=startupState();saved.overrides['fabiana|2026-09-23']='Ferie';saved.revision=3;
 const loaded=startupState(saved);assert.equal(loaded.revision,3);assert.equal(shift(loaded,'fabiana','2026-09-23'),'Ferie');assert.throws(()=>startupState({version:999}));
});
