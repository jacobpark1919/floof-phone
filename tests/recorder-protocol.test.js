const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const protocol = require("../recorder-protocol.js");

const receiver = fs.readFileSync(path.join(__dirname, "..", "desktop.html"), "utf8");

test("FileReader completion order cannot change assigned chunk order", async () => {
  let nextSequence = 0;
  const emitted = [];
  const read = (delay) => {
    const sequence = nextSequence++;
    return new Promise((resolve) => setTimeout(() => {
      emitted.push(sequence);
      resolve();
    }, delay));
  };
  await Promise.all([read(20), read(0), read(10)]);
  assert.deepEqual(emitted, [1, 2, 0]);
  assert.deepEqual([...emitted].sort((a, b) => a - b), [0, 1, 2]);
  assert.match(receiver, /const sequence = nextRecorderChunkSequence\+\+;[\s\S]*new FileReader\(\)/);
});

test("stopped waits for MediaRecorder stop and every asynchronous chunk read", () => {
  assert.match(receiver, /if \(!recorderStopRequested \|\| pendingChunkReads > 0\)/);
  assert.match(receiver, /mediaRecorder\.onstop = \(\) => \{[\s\S]*maybeEmitRecorderStopped\(\)/);
  assert.doesNotMatch(receiver, /recorderStopGraceTimer|requestData\(\)/);
  assert.match(receiver, /chunkCount: nextRecorderChunkSequence/);
});

test("duration uses the median frame interval and capture boundaries are monotonic", () => {
  const timing = protocol.calculateDuration(10, 10.1, [0.05, 0.033, 0.04], 99);
  assert.equal(timing.finalFrameIntervalSeconds, 0.04);
  assert.ok(Math.abs(timing.sourceDurationSeconds - 0.14) < 1e-9);
  assert.equal(protocol.captureBoundaryReached(999, 1000), false);
  assert.equal(protocol.captureBoundaryReached(1000, 1000), true);
  assert.equal(protocol.captureBoundaryReached(1001, 1000), true);
  assert.match(receiver, /captureBoundaryHardTimer = setTimeout[\s\S]*2000/);
});

test("receiver advertises protocol 2 and reports integrity metadata", () => {
  assert.match(receiver, /floofRecorderProtocolVersion = 2/);
  assert.match(receiver, /sourceDurationSeconds/);
  assert.match(receiver, /finalFrameIntervalSeconds/);
  assert.match(receiver, /sequence,/);
});
