# Topher website: first real-use round

Date: November 5, 2026. Client: Codex. Guidance: the local SWE OS checkout at `8fae251`, including the design guidance on its working branch. No subagents. This is a real-use record, not a paired eval or a model score.

## The task and result

Tommy asked for a public introduction to Topher, his work-in-progress Mac assistant, so portfolio visitors could explore the project. Codex inspected the private native implementation and built a separate static website, published as Sites version 1 at [Topher](https://topher-mac.grassyfalcon.chatgpt.site/). The first-round website source is `d1c0896c3738ee8ea4d41caecde35b306607c555` in its separate Sites repository.

The site has original concept illustrations, nine interactive examples, a clickable request path, a companion concept, a current-status ledger and FAQs. It says Coming soon, distinguishes source implementation from pending runtime acceptance, and publishes no native source or private repository links. Tommy chose the strongest design directly rather than three sketches.

## What the work exposed

- Reading the implementation caught a stale README statement about companion search permissions. The public explanation stayed within the current code’s capabilities and evidence limits.
- Rendered verification caught insufficient contrast on two surfaces and a decorative orbit overflowing at 320px. Shared tokens and the orbit dimensions were corrected, then checked again.
- The final local checks covered all nine examples, four pipeline stages, keyboard focus and activation, eight widths, reduced motion, no-JavaScript content, and error routes. Desktop and phone axe scans reported zero violations. A fresh clone passed the check command; the static artifact was about 67 KB and made no third-party requests in the browser run.
- Gitleaks found no secrets in the deployment artifact and rejected a separate synthetic canary. Native-app runtime behavior was not claimed as tested.

These are observed actions from a run that used SWE OS. There is no control showing which actions the model would have performed without it. Sites also supplied authoring and publication instructions, so the outcome cannot be attributed to SWE OS alone.

## Still open

Tommy has not graded the design, and no visitor comprehension test has run. Human screen-reader testing and native device acceptance remain open. This local-path run does not validate hosted raw-Markdown adoption, a named learning area, or the learn loop. It supplies neither a productivity comparison nor proof of better model behavior.

The next request was dark mode, followed by Chrome/YouTube emphasis. That is a second implementation round; it must not overwrite the first round’s evidence. The website repository keeps separate dated round records and the original verification note.
