const frames = globalThis.__floofFrames || new Map();
globalThis.__floofFrames = frames;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  const session = String(req.query.session || "manual").slice(0, 64);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "POST") {
    const body = await readBody(req);

    if (body.length > 0) {
      frames.set(session, {
        body,
        updatedAt: Date.now()
      });
    }

    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    const frame = frames.get(session);

    if (!frame || Date.now() - frame.updatedAt > 5000) {
      res.status(204).end();
      return;
    }

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Length", frame.body.length);
    res.status(200).send(frame.body);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
