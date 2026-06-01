# floof phone web

This is the prototype HTTPS phone camera/WebRTC pairing site for `floof`.

It is designed for Vercel:

- `index.html` opens the iPhone camera over HTTPS and sends it with WebRTC
- `desktop.html` receives and displays the WebRTC stream on the computer
- `api/signal.js` stores temporary WebRTC offer/answer/ICE signaling messages
- `api/frame.js` is the older JPEG relay fallback/prototype endpoint
- `package.json` installs Vercel's KV client for serverless signaling storage

Vercel is only used for pairing/signaling. The WebRTC media path should connect peer-to-peer when the network allows it.

## Required Storage

Vercel serverless functions do not reliably share in-memory state between requests, so signaling needs Redis/KV storage.

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

Without working KV variables, the phone page can open but WebRTC pairing will not complete.

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

## WebRTC Flow

1. In floof, choose `Phone as Webcam (WebRTC)`.
2. floof opens `desktop.html?s=<session>` in the computer's browser.
3. Scan the QR from floof with the iPhone.
4. Tap `Start Camera`.
5. Click `Start Receiver` in the desktop browser page if it has not already started.

This first WebRTC milestone previews the phone camera in the browser receiver. It does not yet pipe decoded video frames into JUCE or record phone video into floof's timeline.
