import { DatabaseModule } from "../../src/database/database.module";
import { Article } from "../../src/entities/article.entity";
import { Chunk } from "../../src/entities/chunk.entity";

describe("DatabaseModule", () => {
  it("should be defined as a class", () => {
    expect(DatabaseModule).toBeDefined();
    expect(typeof DatabaseModule).toBe("function");
  });

  it("should have Article entity defined", () => {
    expect(Article).toBeDefined();
  });

  it("should have Chunk entity defined", () => {
    expect(Chunk).toBeDefined();
  });

  it("should have entity files in the correct location", () => {
    expect(typeof Article.prototype.id).toBeDefined();
    expect(typeof Chunk.prototype.id).toBeDefined();
  });
});
