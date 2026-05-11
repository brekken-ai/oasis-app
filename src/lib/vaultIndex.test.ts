import { describe, expect, it } from "vitest";
import { emptyIndex, upsertFile, removeFile } from "./vaultIndex";

describe("vaultIndex", () => {
  it("adds a file with backlinks and tags", () => {
    const i = upsertFile(emptyIndex(), "a.md", {
      mtime: 1, size: 1, frontmatter: {},
      outgoing: ["b.md"], tags: ["x"],
    });
    expect(i.files["a.md"].outgoing).toEqual(["b.md"]);
    expect(i.backlinks["b.md"]).toEqual(["a.md"]);
    expect(i.tags["x"]).toEqual(["a.md"]);
  });

  it("updates outgoing links cleanly when a file is re-indexed", () => {
    let i = upsertFile(emptyIndex(), "a.md", {
      mtime: 1, size: 1, frontmatter: {},
      outgoing: ["b.md"], tags: [],
    });
    i = upsertFile(i, "a.md", {
      mtime: 2, size: 1, frontmatter: {},
      outgoing: ["c.md"], tags: [],
    });
    expect(i.backlinks["b.md"]).toBeUndefined();
    expect(i.backlinks["c.md"]).toEqual(["a.md"]);
  });

  it("removes a file and its derived entries", () => {
    let i = upsertFile(emptyIndex(), "a.md", {
      mtime: 1, size: 1, frontmatter: {},
      outgoing: ["b.md"], tags: ["x"],
    });
    i = removeFile(i, "a.md");
    expect(i.files["a.md"]).toBeUndefined();
    expect(i.backlinks["b.md"]).toBeUndefined();
    expect(i.tags["x"]).toBeUndefined();
  });
});
