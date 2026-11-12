import os from "os";
import path from "path";
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.DATA_FILE = path.join(os.tmpdir(), `roses-test-${Date.now()}.json`);
  delete process.env.SUPABASE_URL;
});

describe("quote (server-side prices)", () => {
  it("uses database prices and ignores unknown products", async () => {
    const { quote } = await import("@/lib/data");
    const q = await quote([{ id: "p-3", qty: 2 }, { id: "fake", qty: 5 }]);
    expect(q.items).toHaveLength(1);
    expect(q.subtotal).toBe(1300000);
    expect(q.delivery_fee).toBe(0); // above free delivery threshold
  });
  it("charges delivery below the free threshold", async () => {
    const { quote } = await import("@/lib/data");
    const q = await quote([{ id: "p-7", qty: 1 }]);
    expect(q.delivery_fee).toBe(30000);
    expect(q.total).toBe(320000);
  });
  it("applies a percent promo above its minimum", async () => {
    const { quote } = await import("@/lib/data");
    const q = await quote([{ id: "p-1", qty: 1 }], "roses10");
    expect(q.discount).toBe(42000);
    expect(q.promoError).toBeNull();
  });
  it("refuses a promo below its minimum", async () => {
    const { quote } = await import("@/lib/data");
    const q = await quote([{ id: "p-7", qty: 1 }], "ROSES10");
    expect(q.discount).toBe(0);
    expect(q.promoError).toMatch(/dan boshlab/);
  });
  it("clamps quantities", async () => {
    const { quote } = await import("@/lib/data");
    const q = await quote([{ id: "p-1", qty: 1000 }]);
    expect(q.items[0].qty).toBe(99);
  });
});
