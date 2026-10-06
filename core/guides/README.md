---
title: Guides
description: Concept guides that teach the why behind good engineering. Written for people, readable by agents.
---

Guides teach one concept each: what it is, why it exists, when you need it, how it fails, and what I'd actually do. Agents load the same pages when a concern points to them, so a lesson only has to be written once.

Fundamentals come before tools. You'll find caching before Redis, and messaging before Kafka.

## The map

Guides follow the lifecycle of real work. Linked titles exist. The rest are planned and get written when real projects need them.

### Foundations

How software actually runs. Later guides link back here instead of re-explaining.

- How web applications actually work: browsers, HTTP, DNS, TLS, servers
- State, boundaries, contracts, and validation
- Latency, throughput, concurrency, and failure
- What good software engineering means

### Understand

- Turning a vague idea into a problem worth solving
- Reading an unfamiliar codebase

### Design

- [Timeouts, retries, and idempotency](timeouts-retries-idempotency.md)
- Simplicity vs. overengineering
- Data modeling, transactions, and indexes
- API and security boundaries

### Build

- What a complete frontend feature includes
- Background jobs and async work

### Verify

- Testing for confidence, not coverage

### Ship

- CI/CD and deployment you can undo
- Schema migrations without downtime

### Operate

- Observability and production debugging

### Improve

- Refactoring and paying down debt on purpose

### AI engineering

- Building with coding agents
- Building AI products

## How a guide is built

Every guide follows the [teaching order in Voice](../../profile/voice.md#teach-in-this-order): the simple model, why it exists, when you need it and when you don't, how it works, what goes wrong, what I'd do, and what changes at scale. Headings state the point, so skimming the headings alone teaches something.

Each guide's frontmatter records:

| Field       | Values                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `domain`    | foundations, frontend, backend, data, architecture, infrastructure, security, reliability, testing, ai |
| `stage`     | understand, design, build, verify, ship, operate, improve                                              |
| `freshness` | **durable** (fundamentals), **evolving** (practices), **fast-moving** (products, pricing, AI tools)    |
| `status`    | **draft** until Tommy has checked the claims and rewritten it in his voice; then **reviewed**          |
| `reviewed`  | The date the claims were last checked. Required for fast-moving guides.                                |
| `concerns`  | The concern pages that point here                                                                      |

AI can draft guides. A guide stays a draft until a person has verified the technical claims, improved the examples, and made the recommendation their own.
