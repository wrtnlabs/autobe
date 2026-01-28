import { AutoBeOpenApi } from "@autobe/interface";

export class AutoBeJsonSchemaCollection {
  public constructor(
    private readonly all: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
    private readonly local: Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >,
  ) {}

  public assign(
    other: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  ): void {
    for (const [key, value] of Object.entries(other)) {
      if (value === undefined) continue;
      this.set(key, value);
    }
  }

  public get(key: string): AutoBeOpenApi.IJsonSchemaDescriptive | undefined {
    return this.all[key];
  }

  public set(key: string, value: AutoBeOpenApi.IJsonSchemaDescriptive): void {
    this.local[key] = value;
    this.all[key] = value;
  }

  public delete(key: string): void {
    delete this.local[key];
    delete this.all[key];
  }

  public has(key: string): boolean {
    return this.all[key] !== undefined;
  }

  public get schemas() {
    return this.all;
  }
}
