type Demo = {
  label: string;
  request: string;
  skill: string;
  concerns: string[];
  report: [string, string, string][];
};

// Motion is off if the OS asks for less of it or the visitor pressed the pause button.
const stillMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.documentElement.classList.contains('motion-paused');

function setupMotion() {
  const button = document.querySelector<HTMLButtonElement>(
    '[data-motion-toggle]',
  );
  const root = document.documentElement;
  const sync = () =>
    button?.setAttribute(
      'aria-pressed',
      String(root.classList.contains('motion-paused')),
    );
  sync();
  button?.addEventListener('click', () => {
    const paused = root.classList.toggle('motion-paused');
    try {
      localStorage.setItem('swe-motion', paused ? 'paused' : '');
    } catch {
      // Storage blocked: the pause still applies to this visit.
    }
    sync();
  });

  // Stop painting the hero drawing while it's scrolled out of view.
  const art = document.querySelector<HTMLElement>('.hero__art');
  if (art && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) =>
      art.classList.toggle('is-offscreen', !entry!.isIntersecting),
    ).observe(art);
  }
}

function setupTheme() {
  const button = document.querySelector<HTMLButtonElement>(
    '[data-theme-toggle]',
  );
  if (!button) return;
  const label = () => {
    const next =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    button.setAttribute('aria-label', `Switch to ${next} theme`);
  };
  label();
  button.addEventListener('click', () => {
    const next =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('starlight-theme', next);
    } catch {
      // Private mode or blocked storage: the switch still works for this page.
    }
    label();
  });
}

function setupReveal() {
  const items = document.querySelectorAll<HTMLElement>('.reveal');
  if (stillMotion() || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js-reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  items.forEach((item) => observer.observe(item));
}

function setupDemo() {
  const found = document.querySelector<HTMLElement>('[data-demo]');
  const data = document.getElementById('demo-data');
  if (!found || !data) return;
  const root: HTMLElement = found;
  const demos: Demo[] = JSON.parse(data.textContent ?? '[]');
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panel = root.querySelector<HTMLElement>('[role="tabpanel"]')!;
  const request = root.querySelector<HTMLElement>('[data-request]')!;
  const requestText = root.querySelector<HTMLElement>('[data-request-sr]')!;
  const status = root.querySelector<HTMLElement>('[data-demo-status]')!;
  const skill = root.querySelector<HTMLAnchorElement>('[data-skill]')!;
  const chips = [...root.querySelectorAll<HTMLLIElement>('[data-concerns] li')];
  const report = root.querySelector<HTMLUListElement>('[data-report]')!;
  let timers: number[] = [];
  let announce = 0;

  const later = (fn: () => void, ms: number) =>
    timers.push(window.setTimeout(fn, ms));

  // The first, automatic play runs at a relaxed pace. A click replays faster,
  // because the visitor is comparing examples and shouldn't wait.
  function show(index: number, fromUser: boolean) {
    const demo = demos[index];
    if (!demo) return;
    timers.forEach(clearTimeout);
    timers = [];
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tabs[index]!.id);

    requestText.textContent = demo.request;
    // Announce only choices the visitor made, and only the last of a quick series.
    window.clearTimeout(announce);
    if (fromUser) {
      announce = window.setTimeout(() => {
        const n = demo.concerns.length;
        status.textContent = `${demo.label}: the ${demo.skill} skill picked ${n} ${n === 1 ? 'concern' : 'concerns'}.`;
      }, 300);
    }
    skill.textContent = demo.skill;
    skill.href = `/skills/${demo.skill}/`;
    report.replaceChildren(
      ...demo.report.map(([kind, title, text]) => {
        const li = document.createElement('li');
        li.className = 'report__line';
        const badge = document.createElement('span');
        badge.className = `badge badge--${kind.replace('/', '')}`;
        badge.textContent = kind;
        const body = document.createElement('span');
        const strong = document.createElement('strong');
        strong.textContent = `${title}.`;
        body.append(strong, ` ${text}`);
        li.append(badge, body);
        return li;
      }),
    );
    chips.forEach((chip) => {
      const on = demo.concerns.includes(chip.dataset.id ?? '');
      chip.querySelector('.sr-only')!.textContent = on
        ? 'Picked: '
        : 'Skipped: ';
      chip.classList.toggle('is-on', on);
    });

    if (stillMotion()) {
      request.textContent = demo.request;
      return;
    }

    // Replay: type the request, light up concerns one by one, then reveal the report lines.
    root.classList.add('is-playing');
    chips.forEach((chip) => chip.classList.remove('is-lit'));
    report
      .querySelectorAll('li')
      .forEach((li) => li.classList.add('is-hidden'));
    skill.classList.add('is-hidden');
    request.textContent = '';
    request.classList.add('is-typing');
    const pace = fromUser ? 0.45 : 1;
    const step = 22 * pace;
    [...demo.request].forEach((_, i) =>
      later(
        () => (request.textContent = demo.request.slice(0, i + 1)),
        i * step,
      ),
    );
    const typed = demo.request.length * step + 150 * pace;
    later(() => {
      request.classList.remove('is-typing');
      skill.classList.remove('is-hidden');
    }, typed);
    const on = chips.filter((chip) => chip.classList.contains('is-on'));
    on.forEach((chip, i) =>
      later(() => chip.classList.add('is-lit'), typed + (250 + i * 90) * pace),
    );
    const reported = typed + (400 + on.length * 90) * pace;
    const line = 260 * pace;
    report
      .querySelectorAll('li')
      .forEach((li, i) =>
        later(() => li.classList.remove('is-hidden'), reported + i * line),
      );
    later(
      () => root.classList.remove('is-playing'),
      reported + demo.report.length * line,
    );
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => show(i, true));
    tab.addEventListener('keydown', (event) => {
      const move = {
        ArrowRight: 1,
        ArrowLeft: -1,
        Home: -i,
        End: tabs.length - 1 - i,
      }[event.key];
      if (move === undefined) return;
      event.preventDefault();
      const next = (i + move + tabs.length) % tabs.length;
      tabs[next]!.focus();
      show(next, true);
    });
  });

  // Play the first example once, when it scrolls into view.
  if (!stillMotion() && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        show(0, false);
      }
    });
    observer.observe(root);
  }
}

function setupCopy() {
  const origin = document.querySelector<HTMLElement>('[data-origin]');
  if (origin) origin.textContent = `${location.origin}/skills/README.md`;
  const button = document.querySelector<HTMLButtonElement>('[data-copy]');
  const prompt = document.querySelector<HTMLElement>('[data-prompt]');
  const status = document.querySelector<HTMLElement>('[data-copy-status]');
  if (!button || !prompt || !status) return;
  button.addEventListener('click', async () => {
    const text = prompt.textContent!.replace(/\s+/g, ' ').trim();
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied!';
      status.textContent = 'Prompt copied to your clipboard.';
    } catch {
      status.textContent =
        "Couldn't copy automatically. Select the text and copy it.";
    }
    window.setTimeout(() => (button.textContent = 'Copy'), 1800);
  });
}

export function setupLanding() {
  setupMotion();
  setupTheme();
  setupReveal();
  setupDemo();
  setupCopy();
}
