import assert from 'node:assert/strict';
import {test} from 'node:test';
import {webcrypto, timingSafeEqual} from 'node:crypto';
import primary from './primary.mjs';
import reader from './reader.mjs';
import {isPublicRead} from './guard.mjs';
import config from './rules.json' with {type:'json'};
webcrypto.subtle.timingSafeEqual=(a,b)=>timingSafeEqual(Buffer.from(a),Buffer.from(b));
Object.defineProperty(globalThis,'crypto',{value:webcrypto});
const q={sql:config.rules.find(r=>r.sql.includes('from "review_stats"')).sql,params:[],method:'all'};
const quota=new Error('D1_ERROR: Your account has exceeded D1 free tier daily row read limit');
const token='test-service-token';
function req(body,auth=token,path='/query'){return new Request('https://example.test'+path,{method:'POST',headers:{authorization:'Bearer '+auth,'content-type':'application/json'},body:JSON.stringify(body)});}
function db(error=null){const hits={reads:0,writes:0,batches:0};return {hits,withSession(){return {prepare(){return {bind(){return this},async raw(){hits.reads++;if(error)throw error;return [[7]]},async first(){hits.reads++;if(error)throw error;return {ok:1}},async run(){hits.writes++;if(error)throw error;return {}}}},async batch(){hits.batches++;if(error)throw error;return [{results:[{a:7}]}]}}}};}
const oldFetch=globalThis.fetch;
function env(DB){return {DB,DB_PROXY_TOKEN:token,RECOVERY_READ_URL:'https://backup.test'}};
await test('healthy primary stays authoritative',async()=>{let called=0;globalThis.fetch=async()=>{called++;throw Error('wrong')};const d=db();const r=await primary.fetch(req(q),env(d));assert.equal(r.status,200);assert.equal(called,0);assert.deepEqual(await r.json(),{rows:[[7]]});});
await test('quota public read uses backup and concurrency has no shared request state',async()=>{let called=0;globalThis.fetch=async(u,o)=>{called++;assert.equal(o.headers.authorization,'Bearer '+token);return Response.json({rows:[[42]]})};const d=db(quota);const rs=await Promise.all(Array.from({length:10},()=>primary.fetch(req(q),env(d))));for(const r of rs){assert.equal(r.status,200);assert.equal(r.headers.get('x-lashpop-recovery'),'snapshot-read');assert.deepEqual(await r.json(),{rows:[[42]]})}assert.equal(called,10);assert.equal(d.hits.writes,0);});
await test('private reads and all writes never fall back',async()=>{let called=0;globalThis.fetch=async()=>{called++;return Response.json({})};for(const a of [{...q,sql:'select * from session'},{...q,sql:'select * from user'},{...q,sql:'delete from reviews',method:'run'},{...q,sql:'UPDATE reviews SET rating=5 RETURNING id'}]){const r=await primary.fetch(req(a),env(db(quota)));assert.equal(r.status,500)}assert.equal(called,0);});
await test('unrelated errors and failed backup remain failures',async()=>{let called=0;globalThis.fetch=async()=>{called++;return new Response('',{status:503})};assert.equal((await primary.fetch(req(q),env(db(new Error('missing table'))))).status,500);assert.equal(called,0);assert.equal((await primary.fetch(req(q),env(db(quota)))).status,500);assert.equal(called,1);});
await test('reader refuses unauthorized/private/writes/mixed batch before database access',async()=>{const d=db();assert.equal((await reader.fetch(req(q,'bad'),env(d))).status,401);for(const a of [{...q,sql:'select * from session'},{...q,sql:q.sql+';delete from session'},{...q,sql:q.sql+' UNION SELECT * FROM user'},{...q,method:'run'}])assert.equal((await reader.fetch(req(a),env(d))).status,403);assert.equal((await reader.fetch(req({batch:[q,{...q,sql:'select * from user'}]},token,'/batch'),env(d))).status,403);assert.deepEqual(d.hits,{reads:0,writes:0,batches:0});});
await test('reader accepts approved exact query and primary public batch',async()=>{const d=db();assert.equal((await reader.fetch(req(q),env(d))).status,200);globalThis.fetch=async()=>Response.json({results:[{rows:[[7]]}]});assert.equal((await primary.fetch(req({batch:[q]},token,'/batch'),env(db(quota)))).status,200);});
globalThis.fetch=oldFetch;
