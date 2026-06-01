# floof phone web

This is the prototype HTTPS phone camera page for `floof`.

It is designed for Vercel:

- `index.html` opens the iPhone camera over HTTPS
- `api/frame.js` accepts JPEG frame uploads for a session
- `package.json` installs Vercel's KV client for serverless frame storage
- the desktop app polls `/api/frame?session=...` and displays the latest frame

This is a quick prototype relay. It is not the final low-latency WebRTC architecture.

## Required Storage

Vercel serverless functions do not reliably share in-memory state between requests, so the relay needs Redis/KV storage.

Create a Vercel KV / Upstash Redis database. Vercel may add these environment variables automatically:

```text
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
KV_URL
REDIS_URL
```

The relay uses Vercel's `@vercel/kv` client, which reads the `KV_*` variables automatically.

It also supports the equivalent Upstash names if you add them manually:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Without working KV variables, the phone page can open but frames will not reach the desktop app.

## Deploy

Deploy this folder as the Vercel project root.

After deployment, you can verify that KV is working by opening:

```text
https://floof-phone.vercel.app/api/frame?session=test&debug=1
```

It should return JSON with `"ok": true`.

After deployment, the desktop app expects:

```text
https://floof-phone.vercel.app
```

If your Vercel URL changes, update `phoneCloudBaseUrl` in `src/MainComponent.cpp`.
