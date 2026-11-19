// Shared by the scenario harness (run.mjs), the project eval (../project/run.mjs), and the
// learner test: how to start Claude Code headless, what tools the agent gets, what environment
// it runs in, and the SWE OS snapshot.
import { spawn, execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const repo = resolve(import.meta.dirname, '../..');

// Tools both arms get. Pushing, GitHub, deploys, and Docker are denied by name, so an agent that
// reaches for them gets a refusal it can report. That's a rule for the agent, not a wall:
// `npx`, `node`, and `curl` can still start anything. What keeps a run away from your logins
// is runEnv below. Both arms get the same list.
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
  // Harmless helpers that checks chain onto: `cd site && …`, `… | head`, `sleep 2` while a
  // server starts. Without them, compound commands were blocked, so a run couldn't look at its
  // own page for reasons that had nothing to do with its judgment.
  'Bash(cd:*)',
  'Bash(head:*)',
  'Bash(tail:*)',
  'Bash(echo:*)',
  'Bash(which:*)',
  'Bash(wc:*)',
  'Bash(sort:*)',
  'Bash(sleep:*)',
  'Bash(pwd:*)',
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

// What a run can reach. Every `claude` call, and every command it or a check runs, gets an
// empty home folder of its own and only the variables below. The CLIs an agent might try (gh,
// vercel, supabase, npm, git) keep their logins in your home folder or your environment, so in
// a run they find none. Before this, runs inherited both, and one ran `npx supabase init`.
//
// It isn't a sandbox. The network works, and a command can still read your files by their full
// path. On macOS the keychain belongs to your user, not to HOME, and ssh finds ~/.ssh the same
// way. Claude Code's sandbox setting would close more of that, but it also limits the network,
// which changes what a run can do, so it stays off until a round can measure it. Add a name
// here only if a run can't work without it, like a proxy.
const PASSED = [
  'PATH',
  'SHELL',
  'USER',
  'LOGNAME',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'TERM',
  'TMPDIR',
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'NO_PROXY',
  'NODE_EXTRA_CA_CERTS',
];

export function runEnv(home, extra = {}) {
  mkdirSync(home, { recursive: true });
  // Commits need a name. A neutral one, like the fixtures' own commits.
  const gitconfig = join(home, '.gitconfig');
  if (!existsSync(gitconfig))
    writeFileSync(
      gitconfig,
      '[user]\n\tname = dev\n\temail = dev@example.com\n[init]\n\tdefaultBranch = main\n',
    );
  return {
    ...Object.fromEntries(
      PASSED.filter((name) => process.env[name] !== undefined).map((name) => [
        name,
        process.env[name],
      ]),
    ),
    HOME: home,
    XDG_CONFIG_HOME: join(home, '.config'),
    // The system Git config can name a credential helper, like the macOS keychain's.
    GIT_CONFIG_NOSYSTEM: '1',
    ...extra,
  };
}

// The Claude CLI also gets its own login and settings (CLAUDE_CODE_OAUTH_TOKEN, ANTHROPIC_MODEL),
// and the tests' stand-in CLI gets its switches.
const claudeEnv = (home) =>
  runEnv(home, {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([name]) =>
        /^(ANTHROPIC_|CLAUDE_CODE_|FAKE_CLAUDE_)/.test(name),
      ),
    ),
    // Don't update the CLI in the middle of a round.
    DISABLE_AUTOUPDATER: '1',
  });

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

// Runs `claude` with runEnv. A session is saved in its home folder, so a run that resumes one
// passes the same `home` every time. Any other call gets a throwaway home.
export function claude(
  args,
  cwd,
  transcript,
  { timeoutMs = 20 * 60_000, home } = {},
) {
  const throwaway = home ? null : mkdtempSync(join(tmpdir(), 'claude-home-'));
  return new Promise((done) => {
    // No stdin: with an open pipe, `claude -p` waits 3 seconds for input on every call.
    const child = spawn('claude', args, {
      cwd,
      env: claudeEnv(home ?? throwaway),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', (chunk) => (out += chunk));
    child.stderr.on('data', (chunk) => (out += chunk));
    const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);
    child.on('close', (code) => {
      clearTimeout(timer);
      if (throwaway) rmSync(throwaway, { recursive: true, force: true });
      if (transcript) writeFileSync(transcript, out);
      done(parseStream(out, code));
    });
  });
}

// Reads the stream-json a `claude -p` call printed: the reply, its cost, the commands the agent
// ran, and the ones the permission settings blocked.
export function parseStream(out, code = 0) {
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
  const init = events.find((e) => e.type === 'system' && e.subtype === 'init');
  const describe = (name, input = {}) =>
    `${name} ${input.command ?? input.file_path ?? input.url ?? input.pattern ?? ''}`.trim();
  const commands = events
    .filter((e) => e.type === 'assistant')
    .flatMap((e) => e.message.content)
    .filter((c) => c.type === 'tool_use')
    .map((c) => describe(c.name, c.input));
  return {
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
    denied: (result.permission_denials ?? []).map((d) =>
      describe(d.tool_name, d.tool_input),
    ),
  };
}

// A failure every later run would hit too, so the caller should stop. Null otherwise.
export function stopReasonFor(error) {
  if (/authenticat|OAuth|logged out|login/i.test(error ?? ''))
    return 'A run failed to log in. Check CLAUDE_CODE_OAUTH_TOKEN (`claude setup-token` makes a new one)';
  if (
    /rate.?limit|usage.?limit|session limit|429|overloaded/i.test(error ?? '')
  )
    return 'A run hit a usage or rate limit. Wait for it to reset';
  return null;
}

export function checkReady() {
  if (process.env.CLAUDECODE)
    throw new Error(
      'Run this from a normal terminal. Claude Code refuses to start inside another Claude Code session.',
    );
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN && !process.env.ANTHROPIC_API_KEY)
    throw new Error(
      'Set CLAUDE_CODE_OAUTH_TOKEN (`claude setup-token` makes one) or ANTHROPIC_API_KEY. Runs get an empty home folder instead of yours, so they log in with a token.',
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
