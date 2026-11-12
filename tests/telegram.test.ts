import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { validateInitData } from "@/lib/telegram";

function sign(fields: Record<string, string>, token = "123456:TEST-TOKEN") {
  const p = new URLSearchParams(fields);
  const dcs = [...p.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  p.set("hash", crypto.createHmac("sha256", secret).update(dcs).digest("hex"));
  return p.toString();
}
const now = () => String(Math.floor(Date.now() / 1000));
const user = JSON.stringify({ id: 42, first_name: "Dilnoza" });

describe("validateInitData", () => {
  it("accepts data signed with the bot token", () => {
    expect(validateInitData(sign({ auth_date: now(), user }))?.id).toBe(42);
  });
  it("rejects a changed user", () => {
    const s = sign({ auth_date: now(), user }).replace("42", "43");
    expect(validateInitData(s)).toBeNull();
  });
  it("rejects junk appended to the hash", () => {
    expect(validateInitData(sign({ auth_date: now(), user }) + "x")).toBeNull();
  });
  it("rejects another bot's signature", () => {
    expect(validateInitData(sign({ auth_date: now(), user }, "999:OTHER"))).toBeNull();
  });
  it("rejects stale data", () => {
    const old = String(Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30);
    expect(validateInitData(sign({ auth_date: old, user }))).toBeNull();
  });
});
