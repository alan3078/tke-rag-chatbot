import { AppModule } from "../../src/app.module";

describe("AppModule", () => {
  it("should be defined as a class", () => {
    expect(AppModule).toBeDefined();
    expect(typeof AppModule).toBe("function");
  });

  it("should be instantiable", () => {
    const instance = new AppModule();
    expect(instance).toBeDefined();
    expect(instance instanceof AppModule).toBe(true);
  });
});
