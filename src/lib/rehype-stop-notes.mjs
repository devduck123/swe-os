// Each track stop ends with two paragraphs in a fixed shape: `**How I do it:** …` and
// `**Ask your agent:** "…"`. In the Markdown they stay plain paragraphs, for agents and GitHub.
// On the site, the first becomes Tommy's note card and the second a speech bubble from the duck
// with a Copy button. src/scripts/stop.ts places the duck and wires the button.

const text = (value) => ({ type: 'text', value });
const el = (tagName, properties, children = []) => ({
  type: 'element',
  tagName,
  properties,
  children,
});

/** The label of a paragraph that opens with bold text, like "How I do it:". */
const leadLabel = (node) => {
  const first = node.children?.[0];
  if (first?.type !== 'element' || first.tagName !== 'strong') return null;
  const only = first.children.length === 1 ? first.children[0] : null;
  return only?.type === 'text' ? only.value.trim() : null;
};

const note = (p) => {
  p.children[0].properties = { className: ['stop-note__label'] };
  return el('div', { className: ['stop-note'] }, [p]);
};

// Drops the leading space and the quotes around the prompt: the bubble already says it's speech.
const unquote = (nodes) => {
  const first = nodes[0];
  const last = nodes.at(-1);
  if (first?.type === 'text') first.value = first.value.trimStart();
  if (
    first?.type === 'text' &&
    last?.type === 'text' &&
    /^["“]/.test(first.value) &&
    /["”]$/.test(last.value.trimEnd())
  ) {
    first.value = first.value.slice(1);
    last.value = last.value.trimEnd().slice(0, -1);
  }
  return nodes.filter((n) => n.type !== 'text' || n.value !== '');
};

const ask = (p) =>
  el('div', { className: ['stop-ask'], dataStopAsk: '' }, [
    el('span', {
      className: ['stop-ask__duck'],
      dataStopDuck: '',
      ariaHidden: 'true',
    }),
    el('div', { className: ['stop-ask__bubble'] }, [
      el('p', { className: ['stop-ask__label'] }, [
        el('strong', {}, [text('Ask your agent')]),
      ]),
      el(
        'p',
        { className: ['stop-ask__prompt'], dataStopPrompt: '' },
        unquote(p.children.slice(1)),
      ),
      el('div', { className: ['stop-ask__actions'], dataPagefindIgnore: '' }, [
        el(
          'button',
          {
            type: 'button',
            className: ['stop-ask__copy'],
            dataStopCopy: '',
            ariaLabel: 'Copy the prompt for your agent',
          },
          [text('Copy')],
        ),
        el('span', {
          className: ['stop-ask__status'],
          role: 'status',
          dataStopStatus: '',
        }),
      ]),
    ]),
  ]);

const shapes = { 'How I do it:': note, 'Ask your agent:': ask };

export default function rehypeStopNotes() {
  return (tree) => {
    const visit = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type !== 'element') return child;
        if (child.tagName === 'p') {
          const shape = shapes[leadLabel(child)];
          return shape ? shape(child) : child;
        }
        visit(child);
        return child;
      });
    };
    visit(tree);
  };
}
