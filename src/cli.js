#!/usr/bin/env node
import {analyze, markdown} from './engine.js';
import {GitHub} from './github.js';
import {demo} from './demo.js';
export async function run(args, {out=process.stdout, err=process.stderr, token=process.env.GITHUB_TOKEN} = {}) {
  try {
    if (args.includes('--help') || !args.length) { out.write('RepoRelay\nUsage: node src/cli.js <GitHub issue URL> [--format markdown|json] [--limit 1..30]\n       node src/cli.js --demo [--format json]\nGITHUB_TOKEN is optional for public repositories. Read-only API requests only.\n'); return 0; }
    let target, format='markdown', limit=12;
    for (let i=0;i<args.length;i++) {
      if(args[i]==='--format') format=args[++i];
      else if(args[i]==='--limit') limit=Number(args[++i]);
      else if(args[i]==='--demo') { if(target) throw new Error('Choose one input.'); target='demo'; }
      else if(args[i].startsWith('-') || target) throw new Error('Unknown or duplicate argument. Use --help.');
      else target=args[i];
    }
    if(!['markdown','json'].includes(format)) throw new Error('Format must be markdown or json.');
    if(!Number.isInteger(limit)||limit<1||limit>30) throw new Error('File limit must be between 1 and 30.');
    if(!target) throw new Error('An issue URL or --demo is required.');
    const data=target==='demo'?demo:await new GitHub({token}).collect(target);
    const pack=analyze(data,{limit});
    out.write(format==='json'?JSON.stringify(pack,null,2)+'\n':markdown(pack)); return 0;
  } catch(error) { err.write(`RepoRelay: ${error.message}\n`); return 1; }
}
import {pathToFileURL} from 'node:url';
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) process.exitCode=await run(process.argv.slice(2));
