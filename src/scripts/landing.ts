// The landing page's behaviors: the theme switch (shared with the docs through Starlight's
// storage key), the tabs of ways to point an agent here, and the copy buttons.

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

function setupCopy() {
  const origin = document.querySelector<HTMLElement>('[data-origin]');
  if (origin) origin.textContent = `${location.origin}/skills/README.md`;
  const status = document.querySelector<HTMLElement>('[data-copy-status]');
  if (!status) return;
  // Each copy button copies the prompt next to it.
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    '[data-copy]',
  )) {
    const prompt =
      button.parentElement?.querySelector<HTMLElement>('[data-prompt]');
    if (!prompt) continue;
    button.addEventListener('click', async () => {
      const text = prompt.textContent!.replace(/\s+/g, ' ').trim();
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Copied!';
        status.textContent = 'Copied to your clipboard.';
        // The duck on the card hops for joy.
        const duck = document.querySelector('.card__duck');
        if (duck) {
          duck.classList.remove('duck--hop', 'duck--wave');
          void duck.getBoundingClientRect();
          duck.classList.add('duck--hop');
        }
      } catch {
        status.textContent =
          "Couldn't copy automatically. Select the text and copy it.";
      }
      window.setTimeout(() => (button.textContent = 'Copy'), 1800);
    });
  }
}

// The WAI-ARIA tabs pattern: arrow keys, Home, and End move between tabs and select them.
function setupTabs() {
  const tabs = [
    ...document.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  ];
  const select = (tab: HTMLButtonElement, focus: boolean) => {
    for (const other of tabs) {
      const on = other === tab;
      other.setAttribute('aria-selected', String(on));
      other.tabIndex = on ? 0 : -1;
      document.getElementById(other.getAttribute('aria-controls')!)!.hidden =
        !on;
    }
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (event) => {
      const to = {
        ArrowRight: i + 1,
        ArrowLeft: i - 1,
        Home: 0,
        End: tabs.length - 1,
      }[event.key];
      if (to === undefined) return;
      event.preventDefault();
      select(tabs[(to + tabs.length) % tabs.length], true);
    });
  });
}

export function setupLanding() {
  setupTheme();
  setupTabs();
  setupCopy();
}
