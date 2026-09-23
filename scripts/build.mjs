import {mkdir,copyFile,readdir,readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=['index.html','app.css','app.js','model.js','initial-data.js','storage.js','pwa.js','manifest.webmanifest'];
await rm('dist',{recursive:true,force:true});await mkdir('dist/icons',{recursive:true});
const hash=createHash('sha256');for(const path of [...files,...(await readdir('icons')).map(x=>'icons/'+x)]){const content=await readFile(path);hash.update(content);await copyFile(path,'dist/'+path);}
const sw=await readFile('sw.js','utf8');hash.update(sw);await writeFile('dist/sw.js',sw.replace('__BUILD_VERSION__',hash.digest('hex').slice(0,16)));await writeFile('dist/.nojekyll','');console.log('PWA pronta in dist/ con dati personali. Distribuire solo tramite un accesso protetto.');
