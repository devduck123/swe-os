// Shared by the scenario harness (run.mjs) and the project eval (../project/run.mjs):
// how to start Claude Code headless, what tools the agent gets, and the SWE OS snapshot.
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const repo = resolve(import.meta.dirname, '../..');

// Tools both arms get. Pushing, GitHub, deploys, and Docker are off so a run can't touch
// anything outside its temp folder. Both arms lose them equally.
export const ALLOWED = [
  'Read',
  'Glob',
  'Grep',
  'Edit',
  'Write',
  'WebFetch',
  'WebSearch',
  'Bash(npm:*)',
  'Bash(npx:*)',
  'Bash(node:*)',
  'Bash(git:*)',
  'Bash(ls:*)',
  'Bash(cat:*)',
  'Bash(curl:*)',
  'Bash(mkdir:*)',
  'Bash(grep:*)',
  'Bash(find:*)',
];
export const DENIED = [
  'Bash(git push:*)',
  'Bash(git remote:*)',
  'Bash(gh:*)',
  'Bash(vercel:*)',
  'Bash(docker:*)',
  'Bash(supabase:*)',
  'Bash(eas:*)',
];

// Keep the user's own settings, skills, and MCP servers out of both arms.
export const ISOLATION = [
  '--setting-sources',
  'project,local',
  '--disable-slash-commands',
  '--strict-mcp-config',
];

// B's first message starts with this. A gets the same message without it.
export const pointer = (sweos) =>
  `Use Tommy's SWE OS at ${sweos} for this task. Start at skills/README.md and follow the skill that fits.\n\n`;

// True when a reply ends by asking the user something.
export const asksQuestion = (reply) => /\?\s*$/m.test(reply.slice(-800));

export const section = (markdown, heading) => {
  const start = markdown.indexOf(`## ${heading}`);
  if (start === -1) return '';
  const rest = markdown.slice(start + heading.length + 3);
  const end = rest.search(/^## /m);
  return (end === -1 ? rest : rest.slice(0, end)).trim();
};

export function claude(
  args,
  cwd,
  transcript,
  { timeoutMs = 20 * 60_000 } = {},
) {
  return new Promise((done) => {
    // No stdin: with an open pipe, `claude -p` waits 3 seconds for input on every call.
    const child = spawn('claude', args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', (chunk) => (out += chunk));
    child.stderr.on('data', (chunk) => (out += chunk));
    const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);
    child.on('close', (code) => {
      clearTimeout(timer);
      writeFileSync(transcript, out);
      const events = out
        .split('\n')
        .filter((line) => line.startsWith('{'))
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      const result = events.findLast((e) => e.type === 'result') ?? {};
      const init = events.find(
        (e) => e.type === 'system' && e.subtype === 'init',
      );
      const commands = events
        .filter((e) => e.type === 'assistant')
        .flatMap((e) => e.message.content)
        .filter((c) => c.type === 'tool_use')
        .map((c) =>
          `${c.name} ${c.input.command ?? c.input.file_path ?? c.input.url ?? c.input.pattern ?? ''}`.trim(),
        );
      done({
        code,
        sessionId: result.session_id ?? init?.session_id,
        reply: result.result ?? '',
        error: result.is_error
          ? result.result
          : code !== 0
            ? out.slice(-500)
            : null,
        cost: result.total_cost_usd ?? 0,
        ms: result.duration_ms ?? 0,
        turns: result.num_turns ?? 0,
        model: init?.model,
        skills: init?.slash_commands ?? [],
        commands,
      });
    });
  });
}

// A failure every later run would hit too, so the caller should stop. Null otherwise.
export function stopReasonFor(error) {
  if (/authenticat|OAuth|logged out|login/i.test(error ?? ''))
    return 'A run failed to log in. Run `claude auth login`';
  if (/rate.?limit|usage limit|429|overloaded/i.test(error ?? ''))
    return 'A run hit a usage or rate limit. Wait for it to reset';
  return null;
}

export function refuseNested() {
  if (process.env.CLAUDECODE)
    throw new Error(
      'Run this from a normal terminal. Claude Code refuses to start inside another Claude Code session.',
    );
}

// A copy of SWE OS at the current commit, so B reads exactly what's committed.
// Only the folders agents are meant to read. Never evals/: a B run once found its own
// scenario's reviewer notes by searching the snapshot.
export const AGENT_FOLDERS = ['core', 'profile', 'skills', 'templates'];

export function snapshotSweos(dir, ref = 'HEAD') {
  mkdirSync(dir, { recursive: true });
  // Through a file, not a buffer: the archive is bigger than execFileSync's 1 MB default.
  const archive = join(dir, '..', 'swe-os.tar');
  execFileSync('git', ['archive', '--output', archive, ref, ...AGENT_FOLDERS], {
    cwd: repo,
  });
  execFileSync('tar', ['-xf', archive, '-C', dir]);
  return execFileSync('git', ['rev-parse', '--short', ref], {
    cwd: repo,
    encoding: 'utf8',
  }).trim();
}
