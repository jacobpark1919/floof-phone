# floof phone web

This is the prototype HTTPS phone camera page for `floof`.

It is designed for Vercel:

- `index.html` opens the iPhone camera over HTTPS
- `api/frame.js` accepts JPEG frame uploads for a session
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

The relay uses `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

It also supports the equivalent Upstash names if you add them manually:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Without one complete URL/token pair, the phone page can open but frames will not reach the desktop app.

## Deploy

Deploy this folder as the Vercel project root.

After deployment, the desktop app expects:

```text
https://floof-phone.vercel.app
```

If your Vercel URL changes, update `phoneCloudBaseUrl` in `src/MainComponent.cpp`.
