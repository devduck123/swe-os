# Flaky external API

## Task

Make this read-only weather integration robust enough for a small hobby dashboard. Requests sometimes hang or return 429/503. Keep the behavior bounded and understandable, and test meaningful failures.

## Starting state

Node 22.14+ with built-in test runner. No dependencies installed. Create `weather.mjs` from this fixture. `endpoint` is trusted configuration, not user input. A request should finish within roughly 3 seconds. There is no existing cache or queue and no paid service is authorized. On unavailable data, a clear error is acceptable. Tests can inject fetch/timers rather than calling a live service.

```js
export async function weather(endpoint) {
  const response = await fetch(endpoint);
  return response.json();
}
```

## Reviewer-only notes

Expect bounded total deadline, response-status validation, safe limited retries for this GET, backoff/jitter or an explained simpler equivalent, and cancellation/timeout handling. Do not retry every 4xx or malformed response indefinitely. Respect or bound Retry-After relative to the overall budget if implemented. Evidence should cover hangs, retry exhaustion, and permanent failures. A queue, distributed cache, or circuit-breaker service is unnecessary for this fixture.
