// Track stops: puts the duck next to each "Ask your agent" bubble and wires its Copy button.
// The bubble's markup comes from src/lib/rehype-stop-notes.mjs, the duck from a <template> that
// PageTitle.astro renders once per page.

const resetLabel = new WeakMap<HTMLButtonElement, number>();

function hop(duck: SVGElement | null) {
  if (!duck) return;
  // Restart the hop if it's still playing. Under reduced motion there's no animation and no
  // animationend, so the timeout clears the class instead.
  duck.classList.remove('duck--hop');
  void duck.getBoundingClientRect();
  duck.classList.add('duck--hop');
  // Parts of the duck may animate too, and their animationend bubbles up, so wait until
  // nothing in it is still running.
  const done = () => {
    if (
      duck
        .getAnimations({ subtree: true })
        .some((a) => a.playState === 'running')
    )
      return;
    duck.classList.remove('duck--hop');
    duck.removeEventListener('animationend', done);
  };
  duck.addEventListener('animationend', done);
  window.setTimeout(done, 1500);
}

export function setupStopAsks() {
  const template = document.querySelector<HTMLTemplateElement>('#stop-duck');
  for (const ask of document.querySelectorAll<HTMLElement>('[data-stop-ask]')) {
    const slot = ask.querySelector<HTMLElement>('[data-stop-duck]');
    if (template && slot && !slot.firstChild) {
      slot.append(template.content.cloneNode(true));
    }
    const prompt = ask.querySelector<HTMLElement>('[data-stop-prompt]');
    const button = ask.querySelector<HTMLButtonElement>('[data-stop-copy]');
    const status = ask.querySelector<HTMLElement>('[data-stop-status]');
    if (!prompt || !button || !status) continue;
    button.addEventListener('click', async () => {
      const text = prompt
        .textContent!.replace(/\s+/g, ' ')
        .trim()
        .replace(/^["“]|["”]$/g, '');
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Copied';
        status.textContent = 'Copied. Paste it to your agent.';
        hop(ask.querySelector<SVGElement>('svg.duck'));
      } catch {
        status.textContent = "Couldn't copy. Select the text and copy it.";
      }
      window.clearTimeout(resetLabel.get(button));
      resetLabel.set(
        button,
        window.setTimeout(() => (button.textContent = 'Copy'), 1800),
      );
    });
  }
}
