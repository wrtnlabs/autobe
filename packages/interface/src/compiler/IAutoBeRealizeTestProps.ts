export interface IAutoBeRealizeTestProps {
  files: Record<string, string>;
  prisma: Record<string, string>;
  package?: string;
  reset?: boolean;
  simultaneous?: number;
}
