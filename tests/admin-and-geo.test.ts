import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { clean } from "@/lib/admin-schema";
import { formatAddress, validCoords } from "@/lib/geo";
import { toWebp } from "@/lib/image";

describe("admin input cleaning", () => {
  it("normalises a product", () => {
    const r = clean("products", { name: "  Buket ", price: "350000", old_price: "", images: ["a", ""], in_stock: "true", hack: 1 }, false);
    expect(r).toMatchObject({ name: "Buket", price: 350000, old_price: null, images: ["a"], in_stock: true });
    expect(r).not.toHaveProperty("hack");
  });
  it("partial updates only touch given fields", () => {
    expect(clean("products", { in_stock: false }, true)).toEqual({ in_stock: false });
  });
  it("upper-cases promo codes", () => {
    expect(clean("promos", { code: " bahor 15 ", type: "fixed", value: 5000 }, false).code).toBe("BAHOR15");
  });
  it("requires a name", () => {
    expect(() => clean("categories", { name: "" }, false)).toThrow();
  });
});

describe("geo", () => {
  it("validates coordinates", () => {
    expect(validCoords("41.3111", "69.2797")).toEqual({ lat: 41.3111, lng: 69.2797 });
    expect(validCoords(0, 0)).toBeNull();
    expect(validCoords(120, 10)).toBeNull();
    expect(validCoords("x", 1)).toBeNull();
  });
  it("builds a short address", () => {
    expect(formatAddress({ road: "Bunyodkor ko‘chasi", house_number: "12", suburb: "Chilonzor", city: "Toshkent" }))
      .toBe("Bunyodkor ko‘chasi 12, Chilonzor, Toshkent");
  });
});

describe("image upload", () => {
  it("converts to WebP and limits the size", async () => {
    const png = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#e9a0b0" } }).png().toBuffer();
    const out = await toWebp(png);
    expect(out.data.subarray(0, 4).toString()).toBe("RIFF");
    expect(out.data.subarray(8, 12).toString()).toBe("WEBP");
    expect(Math.max(out.width, out.height)).toBe(1600);
  });
});
