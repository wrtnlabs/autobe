import { RandomGenerator } from "@nestia/e2e";

for (let i: number = 0; i < 39; ++i)
  console.log(RandomGenerator.alphaNumeric(8));
