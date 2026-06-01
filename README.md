# floof phone web

This is the prototype HTTPS phone camera page for `floof`.

It is designed for Vercel:

- `index.html` opens the iPhone camera over HTTPS
- `api/frame.js` accepts JPEG frame uploads for a session
- the desktop app polls `/api/frame?session=...` and displays the latest frame

This is a quick prototype relay. It is not the final low-latency WebRTC architecture.

## Required Storage

Vercel serverless functions do not reliably share in-memory state between requests, so the relay needs Redis/KV storage.

Create a Vercel KV / Upstash Redis database and add these environment variables to the Vercel project:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Without these variables, the phone page can open but frames will not reach the desktop app.

## Deploy

Deploy this folder as the Vercel project root.

After deployment, the desktop app expects:

```text
https://floof-phone.vercel.app
```

If your Vercel URL changes, update `phoneCloudBaseUrl` in `src/MainComponent.cpp`.
