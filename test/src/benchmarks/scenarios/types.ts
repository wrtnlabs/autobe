export interface IScenario {
  name: string;
  requirements: {
    analyze: string;
    prisma?: string;
    interface?: string;
  };
  criteria: string[];
}
