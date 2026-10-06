---
title: AI features
description: What goes wrong when a product calls a language model, and how to ship one you can trust, afford, and improve.
---

**Triggered by:** calling a language model or other ML API, or acting on what one returns: showing it, storing it, or running the tool calls it asks for.
**Floor:** a model that can take actions (send, write, buy, delete) or that reads untrusted content alongside private data always gets "when stakes rise", even in a prototype.

## Minimum bar

- **Check that a model is the right tool.** If plain code can do the job reliably, use code. A model earns its place where the input is messy language or the output needs judgment.
- **Treat the output as untrusted input.** Validate structured output against a schema, like Zod, before you use it. Handle refusals, empty answers, malformed JSON, and responses cut off at the token limit.
- **Keep keys on the server.** Call the model from your backend, never from the browser.
- **Bound every call.** Set a timeout and a small retry budget, and show the user a real fallback when the model fails. Stream long responses so the screen doesn't look frozen.
- **Cap the cost.** Set max output tokens per call, put auth or rate limits in front of any endpoint that calls a paid model, and set a per-user or daily limit.
- **Mind what you send.** Don't send personal data or secrets to a provider unless the feature needs it and the provider's terms allow it.

## When stakes rise

- **Assume prompt injection.** Any text the model reads can contain instructions: a web page, an email, a user's file, a tool result. A model that reads untrusted content must not take consequential actions on its own. Give tools least privilege, allow-list what they can do, and require a person to confirm anything that's hard to undo.
- **Measure quality with evals.** Keep a small set of real inputs with the properties a good answer must have. Run them before you change a prompt or a model. "Two examples looked better" isn't evidence.
- **Log every call.** Record the prompt version, model, latency, tokens, and cost for each request, without secrets or personal data. You'll need it for debugging, evals, and the bill.
- **Pin the model and plan for change.** Use an explicit model version, and keep the provider call in one place so a swap or deprecation touches one file. One place, not a framework.
- **Respect the context window.** Long inputs cost more, get slower, and can be truncated. Chunk, summarize, or retrieve only what the task needs.
- **Put a person in the loop when it matters.** Outputs that affect money, health, access, or someone's reputation need human review or a clear way to appeal.

## Common misses

- The API key shipped in the frontend bundle.
- `JSON.parse(response)` with no validation, which crashes the first time the model adds a sentence before the JSON.
- An unauthenticated "chat" endpoint that turns into someone else's free model API.
- A support bot with email-sending tools that a pasted message can instruct.
- A prompt change shipped because it felt better, with no evals to catch the regression.
- A 30-second spinner with no streaming, timeout, or cancel button.

## Learn more

- [Timeouts, retries, and idempotency](../guides/timeouts-retries-idempotency.md)
- [Security](security.md) and [cost](cost.md), which this concern always pulls in
