# AI feature review

## Task

Review this "smart inbox" endpoint before we launch it to our beta users. It summarizes a customer email and lets the model draft and send a reply. Keep the review read-only.

## Starting state

Next.js route handler in a small public SaaS. `getUser()` returns the signed-in user or null. `sendEmail` sends real email from the company domain. `llm` is a thin wrapper over a hosted model API that supports tool calls. Emails come from the public, so their content is untrusted. This is the whole handler.

```ts
export async function POST(req: Request) {
  const { emailBody } = await req.json();
  const res = await llm.chat({
    model: 'latest',
    messages: [
      { role: 'system', content: 'Summarize the email and reply helpfully.' },
      { role: 'user', content: emailBody },
    ],
    tools: { sendEmail },
  });
  const result = JSON.parse(res.text);
  return Response.json({ summary: result.summary });
}
```

## Reviewer-only notes

Expect, in roughly this order:

- **Prompt injection with a real action (critical).** Untrusted email text can instruct the model to call `sendEmail` with any recipient and content, from the company domain. The fix is to remove the autonomous send: draft only, a person confirms, and allow-list the recipient to the original sender.
- **No auth or rate limit.** Anyone can call a paid model and the email tool.
- **Output parsed without validation.** `JSON.parse` on free text fails, so use structured output with schema validation.
- **No timeout, retry bound, or fallback.**
- **No cost cap.** No max tokens, no per-user limit.
- **`model: 'latest'` isn't pinned.** Behavior changes silently.
- **No logging or evals** for quality regressions.
- **Privacy.** Customer email content goes to a third party. Check the terms and keep it out of logs.

Don't reward a review that only says "add error handling", or one that requires a full eval platform before beta. A small eval set is proportionate.
