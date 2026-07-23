# floof phone web

This is the prototype HTTPS phone camera/WebRTC pairing site for `floof`.

It is designed for Vercel:

- `index.html` opens the iPhone camera over HTTPS and sends it with WebRTC
- `desktop.html` receives the WebRTC stream and emits ordered protocol-2 recording chunks to floof
- `recorder-protocol.js` provides shared recording-duration and capture-boundary calculations
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

Before distributing a native build that requires recorder protocol 2, verify in the deployed receiver console:

```js
window.floofRecorderProtocolVersion
```

It must return `2`. Run the receiver protocol tests with `npm test` before deployment.

If your Vercel URL changes, update `phoneCloudBaseUrl` in `src/MainComponent.cpp`.

## WebRTC Flow

1. In floof, choose `Phone as Webcam (WebRTC)`.
2. floof opens `desktop.html?s=<session>` in the computer's browser.
3. Scan the QR from floof with the iPhone.
4. Tap `Start Camera`.
5. Click `Start Receiver` in the desktop browser page if it has not already started.

The embedded receiver records the remote stream with `MediaRecorder`. It assigns chunk sequence numbers before asynchronous reads, waits for the final `dataavailable` event and all reads, and then sends integrity and duration metadata to the native app for local storage and timeline insertion.
