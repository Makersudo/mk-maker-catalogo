import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { urlBase64ToUint8Array } from "./notificationService";

describe("notificationService", () => {
  it("converts URL-safe VAPID public keys to Uint8Array", () => {
    const converted = urlBase64ToUint8Array("AQIDBA");

    assert.equal(converted.byteLength, 4);
    assert.deepEqual(Array.from(converted), [1, 2, 3, 4]);
  });
});
