import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyze,eligible,markdown} from '../src/engine.js';
import {GitHub,parseIssue} from '../src/github.js';
import {demo} from '../src/demo.js';
import {run} from '../src/cli.js';
test('exact path ranks first with evidence and related tests',()=>{
 const p=analyze(demo); assert.equal(p.candidates[0].path,'src/payments/retry.ts'); assert.match(p.candidates[0].reasons[0],/Exact/); assert.deepEqual(p.tests,['tests/payments/retry.test.ts']); assert.equal(p.candidates.some(f=>f.path.includes('avatar')),false);
});
test('sensitive and generated paths are excluded',()=>{
 for(const p of ['.env','.env.production','config/credentials.json','keys/server.pem','node_modules/a.js','dist/a.js','package-lock.json']) assert.equal(eligible(p),false,p);
 assert.equal(eligible('src/environment.js'),true);
});
test('no match never invents candidate files',()=>{const p=analyze({...demo,issue:{title:'zzzz',body:''}}); assert.equal(p.candidates.length,0);assert.match(markdown(p),/No path matches/);});
test('truncation is disclosed',()=>assert.match(markdown(analyze({...demo,truncated:true})),/incomplete/));
test('Markdown neutralizes embedded HTML',()=>assert.ok(!markdown(analyze({...demo,issue:{title:'<script>alert(1)</script>',body:''}})).includes('<script>')));
test('only canonical issue URLs are accepted',()=>{
 assert.deepEqual(parseIssue('https://github.com/a/b/issues/42'),{owner:'a',repo:'b',number:42});
 for(const s of ['https://evil.test/a/b/issues/1','https://github.com/a/b/pull/1','https://github.com/../b/issues/1','https://github.com/a/b/issues/0','https://github.com/a/b/issues/1?token=secret']) assert.throws(()=>parseIssue(s));
});
test('API collection pins tree to a commit and uses GET-only fetch',async()=>{
 const calls=[];const payloads=[{title:'retry',body:'',html_url:demo.issue.url},{default_branch:'main'},{sha:'abc',commit:{tree:{sha:'tree123'}}},{tree:[{type:'blob',path:'src/retry.js'},{type:'tree',path:'src'}],truncated:false}];
 const api=new GitHub({fetcher:async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(payloads.shift()));}});
 const p=await api.collect('https://github.com/a/b/issues/1'); assert.equal(p.sha,'abc');assert.equal(p.files.length,1);assert.ok(calls[3].url.includes('/trees/tree123?recursive=1'));assert.ok(calls.every(c=>!c.options.method && c.options.redirect==='error'));assert.equal(calls[0].options.headers.Authorization,undefined);
});
test('rate limit and failures are explicit; token never appears in errors',async()=>{
 const api=new GitHub({token:'private-token',fetcher:async()=>new Response('{}',{status:403,headers:{'x-ratelimit-remaining':'0'}})});
 await assert.rejects(()=>api.get('/repos/a/b'),/rate limit/); await assert.rejects(()=>api.get('https://evil.test'),/Unsupported/);
});
test('pull requests cannot masquerade as issues',async()=>{const api=new GitHub({fetcher:async()=>new Response('{"pull_request":{}}')});await assert.rejects(()=>api.collect('https://github.com/a/b/issues/1'),/pull request/);});
test('CLI exports valid JSON and rejects invalid flags',async()=>{
 let stdout='',stderr='';const io={out:{write:s=>stdout+=s},err:{write:s=>stderr+=s}};
 assert.equal(await run(['--demo','--format','json'],io),0);assert.equal(JSON.parse(stdout).version,1);
 for(const args of [['--demo','--limit','0'],['--demo','--format','xml'],['--demo','--wat'],['--format','json']]) assert.equal(await run(args,io),1);
 assert.ok(stderr.length);
});
