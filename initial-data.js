import {validateState} from './model.js';
// Dati iniziali autorizzati per il repository privato.
const seed = {
  "version": 1,
  "profile": {
    "name": "Fabiana Martorano"
  },
  "roster": {
    "start": "2026-09-14",
    "sourceEnd": "2026-10-18",
    "cycle": [
      "R",
      "M1",
      "RC",
      "P1",
      "M2",
      "P2",
      "M1",
      "P2",
      "P1",
      "R",
      "RC",
      "P2",
      "M1",
      "P2",
      "M1",
      "RC",
      "M2",
      "M1",
      "R",
      "RC",
      "M2",
      "M2",
      "P2",
      "M1",
      "P2",
      "M1",
      "R",
      "RC",
      "P1",
      "M2",
      "P2",
      "M2",
      "P1",
      "M2",
      "R"
    ],
    "people": [
      {
        "id": "mazzeo",
        "name": "Giuseppe Mazzeo",
        "offset": 0
      },
      {
        "id": "mollica",
        "name": "Donatella Mollica",
        "offset": 7
      },
      {
        "id": "montagnuolo",
        "name": "Elia Montagnuolo",
        "offset": 14
      },
      {
        "id": "russillo",
        "name": "Rosanna Russillo",
        "offset": 21
      },
      {
        "id": "tartaglia",
        "name": "Gaetano Tartaglia",
        "offset": 28
      },
      {
        "id": "fabiana",
        "name": "Fabiana Martorano",
        "offset": 7
      },
      {
        "id": "brienza",
        "name": "Salvatore Brienza",
        "offset": 28
      }
    ],
    "primaryId": "fabiana"
  },
  "tasks": [],
  "templates": [],
  "overrides": {},
  "completed": {},
  "trash": [],
  "revision": 0
};
export function startupState(saved){return validateState(saved ?? seed);}
