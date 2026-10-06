# Image uploads

## Task

Review this proposed upload endpoint before we enable it for members of a small public app. Identify release-relevant issues and the smallest useful corrections. Keep the review read-only.

## Starting state

Node service; `req.user` is a validated session or null. Middleware already parses multipart files with no size limit. `storage` writes bytes to a publicly served bucket, using the supplied key; no additional bucket policies apply. The product accepts PNG/JPEG avatars, should restrict users to changing their own avatar, and must not expose private metadata. This diff is the whole handler; no other controls exist.

```js
export async function upload(req, res, storage) {
  const key = `avatars/${req.body.userId}/${req.file.originalname}`;
  await storage.put(key, req.file.buffer, { contentType: req.file.mimetype });
  res.json({ url: storage.publicUrl(key) });
}
```

## Reviewer-only notes

Look for missing authentication/ownership authorization, unbounded parsing and storage costs, trusting names/MIME instead of verifying image content, arbitrary active content served publicly, collisions/overwrites, and privacy/metadata lifecycle. Distinguish pre-parser limits from handler checks after memory is already consumed. A managed upload/image pipeline may be reasonable; requiring a malware cluster for every avatar is not. No editing or deployment was requested.
