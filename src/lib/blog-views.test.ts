import { describe, expect, test } from "bun:test";
import { createBlogViewRecorder } from "./blog-views";

describe("blog visits", () => {
  test("one displayed article records one visit despite repeated effects", async () => {
    let count = 0;
    const record = createBlogViewRecorder(async () => ++count);
    const results = await Promise.all([record("article-a"), record("article-a")]);
    expect(count).toBe(1);
    expect(results).toEqual([1, 1]);
  });

  test("visiting another article and returning records separate visits", async () => {
    const counts: Record<string, number> = {};
    const record = createBlogViewRecorder(async (slug) => {
      counts[slug] = (counts[slug] ?? 0) + 1;
      return counts[slug];
    });
    expect(await record("article-a")).toBe(1);
    expect(await record("article-b")).toBe(1);
    expect(await record("article-a")).toBe(2);
    expect(counts).toEqual({ "article-a": 2, "article-b": 1 });
  });

  test("a failed save propagates the error rather than inventing a count", async () => {
    const record = createBlogViewRecorder(async () => { throw new Error("save failed"); });
    await expect(record("article-a")).rejects.toThrow("save failed");
  });
});