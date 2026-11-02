---
title: AI features in production
description: A model is a slow, expensive, unpredictable third party whose output can be steered by strangers. Build around it like one.
stage: build
track: 11
concerns: [ai-features, security, cost, reliability]
freshness: durable
status: draft
---

A model call is an API call to a third party that's slow, charges by the token (a small chunk of text), and returns text you can't fully predict, sometimes steered by whoever wrote the input. If you could write the rule down as code, skip the model.

## Easy to miss

- **Model output is untrusted input.** Check structured output with a schema, a description of the shape you expect (Zod is one), because raw parsing breaks when the model adds "Sure! Here's the JSON:". Render it as text, never as HTML or code.
- **A cut-off answer still looks like success.** A reply that hit the token limit stops mid-sentence, and one blocked by the provider's safety filter can arrive as a 200. Every response says why it stopped. Check it before you use the reply.
- **The model can't tell your instructions from the email's.** If it reads a user's inbox, an email can steer it. That's prompt injection, and no prompt reliably stops it. The danger is an agent (a model that takes actions) with private data, untrusted content, and a way to send things out. Remove one: give the step that reads untrusted text no tools, and have a person confirm anything that sends, pays, or deletes.
- **A markdown image is a way out.** Injected text can have the model write an image whose URL ends with the user's data. Showing it makes the browser send that data to the attacker's server. Don't render remote images from model output.
- **Bound the input, the output, and the wait.** A pasted 40-page contract runs until the platform kills it. Cap input length and output tokens, add a timeout, and turn off the library's built-in retries when a person is waiting ([timeouts and retries](timeouts-retries-idempotency.md)).
- **Trying two examples tells you nothing.** A prompt or model change makes some outputs better and some worse. Keep about 20 real inputs, including ones that broke, and rerun them on every change. Check what must always hold, like valid JSON or no made-up prices, not exact wording. Pin the model version so upgrades happen on purpose.

**How I do it:** every model route gets auth, a per-user daily limit counted in Postgres, input and output caps, and a timeout, plus a spend cap at the provider. Nothing sends, pays, or deletes without the user's click.

**Ask your agent:** "Check every route that calls a model: signed-in users only, a daily limit per user, capped input and output, a timeout, and validated output. Nothing it triggers should send, pay, or delete without a click."

## Go deeper

- [Simon Willison: The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)
- [OWASP: LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
