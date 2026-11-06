export function parseIssue(input) {
  const m = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/issues\/([1-9]\d*)\/?$/.exec(input);
  if (!m || m[1] === '..' || m[2] === '..') throw new Error('Expected https://github.com/owner/repo/issues/123');
  return {owner:m[1], repo:m[2], number:Number(m[3])};
}
export class GitHub {
  constructor({token, fetcher = fetch} = {}) { this.token=token; this.fetcher=fetcher; this.requests=0; }
  async get(path) {
    if (!path.startsWith('/repos/') || path.includes('..')) throw new Error('Unsupported API path.');
    const headers = {Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'RepoRelay/0.1'};
    if (this.token) headers.Authorization=`Bearer ${this.token}`;
    this.requests++;
    const response = await this.fetcher(`https://api.github.com${path}`, {headers, redirect:'error', signal:AbortSignal.timeout(20000)});
    if (!response.ok) {
      const remaining=response.headers.get('x-ratelimit-remaining');
      if (response.status===429 || remaining==='0') throw new Error('GitHub rate limit reached. Retry later or provide GITHUB_TOKEN.');
      throw new Error(`GitHub API returned ${response.status}. Check repository visibility and token permissions.`);
    }
    const text=await response.text();
    if (text.length>12_000_000) throw new Error('GitHub response exceeds the 12 MB limit.');
    return JSON.parse(text);
  }
  async collect(input) {
    const {owner,repo,number}=parseIssue(input);
    const base=`/repos/${owner}/${repo}`;
    const issue=await this.get(`${base}/issues/${number}`);
    if (issue.pull_request) throw new Error('Use an issue URL, not a pull request.');
    const repository=await this.get(base);
    const commit=await this.get(`${base}/commits/${encodeURIComponent(repository.default_branch)}`);
    const tree=await this.get(`${base}/git/trees/${commit.commit.tree.sha}?recursive=1`);
    return {repository:`${owner}/${repo}`,sha:commit.sha,issue:{number,title:issue.title,body:issue.body ?? '',url:issue.html_url},files:tree.tree.filter(f=>f.type==='blob').map(({path,size})=>({path,size})),truncated:!!tree.truncated};
  }
}
