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

async function redisCommand(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error("Missing Redis REST URL or token");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    throw new Error(`Redis command failed with ${response.status}`);
  }

  return response.json();
}

module.exports = async function handler(req, res) {
  const session = String(req.query.session || "manual").slice(0, 64);
  const key = `floof:frame:${session}`;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "POST") {
    try {
      const body = await readBody(req);

      if (body.length > 0) {
        await redisCommand([
          "SET",
          key,
          body.toString("base64"),
          "EX",
          "5"
        ]);
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to store frame" });
    }

    return;
  }

  if (req.method === "GET") {
    try {
      const frame = await redisCommand(["GET", key]);

      if (!frame || !frame.result) {
        res.status(204).end();
        return;
      }

      const body = Buffer.from(frame.result, "base64");
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Length", body.length);
      res.status(200).send(body);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to load frame" });
    }

    return;
  }

  if (req.method === "HEAD") {
    try {
      const frame = await redisCommand(["GET", key]);

      if (!frame || !frame.result) {
        res.status(204).end();
        return;
      }

      res.setHeader("Content-Type", "image/jpeg");
      res.status(200).end();
    } catch (error) {
      res.status(500).end();
    }

    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
