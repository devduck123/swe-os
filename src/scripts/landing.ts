// The landing page's two behaviors: the theme switch (shared with the docs through
// Starlight's storage key) and the copy buttons next to each agent prompt.

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
      } catch {
        status.textContent =
          "Couldn't copy automatically. Select the text and copy it.";
      }
      window.setTimeout(() => (button.textContent = 'Copy'), 1800);
    });
  }
}

export function setupLanding() {
  setupTheme();
  setupCopy();
}
