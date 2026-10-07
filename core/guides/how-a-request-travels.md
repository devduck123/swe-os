---
title: How a request travels through your app
description: One mental model of a web request from the browser to the database and back, so the rest of the track has something to build on.
domain: foundations
stage: understand
freshness: durable
status: outline
track: 2
concerns: [performance, reliability, security]
---

**After this page, the reader can** trace one click from the browser to the database and back, and say where their own code runs at each step.

## Clicking a link starts a chain

- DNS lookup, then a TLS handshake, then CDN or edge, then a server or function, then the database, then a response, then the browser renders it.
- One diagram, with rough timings for each hop.
- A real example: a Next.js page on Vercel reading from Postgres.

## Your code runs in more than one place

- Browser vs. server vs. edge.
- Server components vs. client components, in plain words.
- Why this matters: whatever ships to the browser, anyone can read. That sets up the env-var trap in [secrets and safety](secrets-and-agent-safety.md).

## Every hop can be slow or fail

- Rough latency numbers to build intuition: memory, disk, same-region network, cross-region network.
- That's why timeouts exist. Link [timeouts, retries, and idempotency](timeouts-retries-idempotency.md).

## State lives in more places than you think

- The URL, component state, cookies, local storage, server memory (which serverless throws away), the database, and caches.
- Which of those survives a refresh, a deploy, or another device.

## Caching happens at every layer

- Browser cache, CDN, the framework's data cache, and the database's own cache.
- Stale data bugs come from a cache you didn't know about.

## What the vibe-coded version misses

- Secrets in client code, because the developer assumed it ran on the server.
- A new database connection on every serverless call, until the connection limit is hit. Pooling explained simply.
- CORS errors "fixed" with `*`.
- Cached responses that show one user's data to another.
- Cold starts and regions: a function in one region talking to a database in another.

## What I'd do

- One app, one region close to the database, and the framework's defaults.
- Learn the chain once, so debugging becomes "which hop broke?"

## What changes at scale

- Multiple regions, read replicas, queues between steps, and edge caching on purpose.

## Sources to check before writing

- MDN on how the web works. Vercel and Next.js docs on where code runs. The current Next.js caching model, since it changed in v16.
