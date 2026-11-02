---
title: AI features in production
description: A model is a slow, expensive, unpredictable third party whose output can be steered by strangers. Build around it like one.
stage: build
track: 11
concerns: [ai-features, security, cost, reliability]
freshness: durable
status: draft
---

A model call is an API call to a third party that's slow, charges by the token (a small chunk of text), and returns text you can't fully predict, sometimes steered by whoever wrote the input. Treat it like any flaky, expensive, untrusted service. And use one only where plain code can't do the job: if you could write the rule down, write the code.

## Easy to miss

- **Model output is untrusted input.** Check structured output against a schema, because raw parsing throws the first time the model adds "Sure! Here's the JSON:". Render it as text, never as HTML or code.
- **A cut-off answer still looks like success.** A reply that hit the token limit stops mid-sentence, and a blocked one can arrive as a 200. Check why the model stopped before you show or save it.
- **The model can't tell your instructions from the email's.** No prompt reliably stops text in a document from steering it. The danger is an agent with private data, untrusted content, and a way to send things out. Remove one: split reading from acting, and have a person confirm anything that sends, pays, or deletes.
- **A markdown image is a way out.** Injected text can ask for an image whose URL carries the user's data. Rendering it sends that data, no tool needed. Don't render remote images from model output.
- **An open model route is someone else's free API.** Keep the key on your server, put auth and a per-user limit in front of the route, and set a spend cap with the provider as the backstop.
- **Bound the input, the output, and the wait.** A pasted 40-page contract runs until the platform kills it. Cap input length and output tokens, add a timeout, and turn off the SDK's default retries when a person is waiting ([timeouts and retries](timeouts-retries-idempotency.md)).
- **Trying two examples tells you nothing.** A prompt or model change makes some outputs better and some worse. Keep about 20 real inputs, including ones that broke, and check what must always hold, not exact wording. Pin the model ID so upgrades happen on purpose.

**How I do it:** every model route gets auth, a per-user daily limit in Postgres, input and output caps, and a timeout, and nothing sends, pays, or deletes without the user's click.

## Go deeper

- [Simon Willison: The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)
- [OWASP: LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
