# Explain circuit breakers

## Task

Explain circuit breakers to me like I am a capable frontend engineer new to backend reliability. I understand HTTP and try/catch. When would I use one, when would I skip it, and what can go wrong? Keep it concise but technically accurate.

## Starting state

No repository or tool-specific implementation. No framework recommendation needed. The reader is considering a hobby service that calls an unreliable third-party API.

## Reviewer-only notes

Expect a simple model of failing fast to protect a caller, closed/open/half-open states, bounded probing and recovery, and a concrete example. Distinguish breakers from timeouts/retries/rate limiting. Avoid implying a breaker fixes the dependency or guarantees availability. Mention an appropriate simple default for a hobby app and at least one practical failure mode such as bad thresholds or synchronized probes. Prefer accurate clarity over exhaustive terminology.
