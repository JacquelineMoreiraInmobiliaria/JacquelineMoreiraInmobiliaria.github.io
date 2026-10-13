import {readdir,readFile,lstat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseDocument} from 'yaml';
const ENDPOINT='https://moreira-herramientas.lucas720.chatgpt.site/api/public/media/retirements/check';
const ID=/^pm-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const LIMIT=20,MAX_RESPONSE=4096;
function stop(code){throw Error(code);}
function collect(value,ids){
 if(typeof value==='string'){
  // Decode escaped/encoded aliases before validating; malformed managed references also block.
  let text=value;try{for(let i=0;i<3;i++){const decoded=decodeURIComponent(text);if(decoded===text)break;text=decoded;}}catch{if(text.includes('/media/presentations/'))stop('invalid_managed_media_reference');}
  for(const match of text.matchAll(/\/media\/presentations\/([^\s"'<>?#]*)/g)){
   if(!ID.test(match[1]))stop('invalid_managed_media_reference');ids.add(match[1]);
  }
 }else if(Array.isArray(value))for(const item of value)collect(item,ids);
 else if(value&&typeof value==='object')for(const item of Object.values(value))collect(item,ids);
}
export function idsFromYaml(text){
 try{const document=parseDocument(text,{schema:'core',strict:true,uniqueKeys:true});if(document.errors.length||document.warnings.length)stop('invalid_yaml');const ids=new Set();collect(document.toJS({maxAliasCount:0}),ids);return [...ids];}
 catch(error){if(['invalid_yaml','invalid_managed_media_reference'].includes(error.message))throw error;stop('invalid_yaml');}
}
async function boundedResponse(response){
 const reader=response.body?.getReader();if(!reader)stop('media_check_invalid_response');const chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_RESPONSE){await reader.cancel();stop('media_check_invalid_response');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{stop('media_check_invalid_response');}
}
export async function verifyManagedIds(ids,{fetcher=fetch}={}){
 if(!Array.isArray(ids)||ids.some(id=>typeof id!=='string'||!ID.test(id)))stop('invalid_managed_media_reference');
 const unique=[...new Set(ids)];
 for(let offset=0;offset<unique.length;offset+=LIMIT){
  const batch=unique.slice(offset,offset+LIMIT);let response;
  try{response=await fetcher(ENDPOINT,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:batch}),signal:AbortSignal.timeout(15000)});}catch{stop('media_check_unavailable');}
  if(response.status!==200)stop('media_check_unavailable');
  if(!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')||''))stop('media_check_invalid_response');
  const data=await boundedResponse(response);
  if(!data||Array.isArray(data)||Object.keys(data).length!==1||!Array.isArray(data.results)||data.results.length!==batch.length)stop('media_check_invalid_response');
  const seen=new Set();for(const row of data.results){
   if(!row||Array.isArray(row)||Object.keys(row).length!==2||typeof row.id!=='string'||!batch.includes(row.id)||seen.has(row.id)||typeof row.usable!=='boolean')stop('media_check_invalid_response');seen.add(row.id);
   if(!row.usable)stop('managed_media_not_usable');
  }
 }
 return {checked:unique.length};
}
export async function checkPropertyMedia({directory=resolve('src/data/properties'),fetcher=fetch}={}){
 const ids=new Set();
 async function scan(folder){for(const entry of await readdir(folder,{withFileTypes:true})){
  const path=resolve(folder,entry.name);if(entry.isSymbolicLink())stop('property_source_not_regular');
  if(entry.isDirectory()){await scan(path);continue;}
  if(!/\.ya?ml$/i.test(entry.name))continue;
  if(!entry.isFile()||(await lstat(path)).size>100000)stop('invalid_yaml');
  for(const id of idsFromYaml(await readFile(path,'utf8')))ids.add(id);
 }}
 await scan(directory);return verifyManagedIds([...ids],{fetcher});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const result=await checkPropertyMedia();console.log(result.checked?'Multimedia administrada verificada: '+result.checked+' IDs.':'Sin multimedia administrada: no se consultó el endpoint.');}
 catch(error){console.error('Build bloqueado: '+(['invalid_yaml','invalid_managed_media_reference','property_source_not_regular','media_check_invalid_response','media_check_unavailable','managed_media_not_usable'].includes(error.message)?error.message:'media_verification_failed'));process.exitCode=1;}
}
