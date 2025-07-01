import { IScenario } from "../types";

export const scenario: IScenario = {
  name: "bbs-system-1",
  requirements: {
    analyze:
      "I want to create a political/economic discussion board. Since I'm not familiar with programming, please write a requirements analysis report as you see fit.",
    prisma:
      "Based on the requirements analysis, design the database schema using Prisma.",
    interface:
      "Based on the database schema, create the API interface specification.",
  },
  criteria: [
    "The database schema should be designed to support the requirements analysis. The schema should be designed to support the requirements analysis.",
    "The API interface specification should be designed to support the database schema. The interface should be designed to support the database schema.",
    "The requirements analysis should be designed to support the database schema. The analysis should be designed to support the database schema.",
    "The requirements analysis should be designed to support the API interface specification. The analysis should be designed to support the API interface specification.",
    "The database schema should be designed to support the API interface specification. The schema should be designed to support the API interface specification.",
    "The API interface specification should be designed to support the requirements analysis. The interface should be designed to support the requirements analysis.",
    "The requirements analysis should be designed to support the database schema. The analysis should be designed to support the database schema.",
    "The database schema should be designed to support the API interface specification. The schema should be designed to support the API interface specification.",
    "The API interface specification should be designed to support the requirements analysis. The interface should be designed to support the requirements analysis.",
  ],
};
