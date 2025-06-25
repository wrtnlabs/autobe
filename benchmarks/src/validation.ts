import { OpenAI } from "openai";
import { TestScenario } from "./types";

export class ValidationEngine {
  private openai: OpenAI;

  constructor(openai: OpenAI) {
    this.openai = openai;
  }

  async validateResponse(question: string, response: string): Promise<{
    validated: boolean;
    issues: string[];
  }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a technical validator. Evaluate if the response adequately addresses the technical question about backend development. 
            Focus on:
            1. Technical accuracy
            2. Completeness of the answer
            3. Practical implementation details
            4. Security considerations (if applicable)
            5. Error handling (if applicable)
            
            Respond with JSON format:
            {
              "validated": boolean,
              "issues": ["issue1", "issue2", ...]
            }`
          },
          {
            role: "user",
            content: `Question: ${question}\n\nResponse: ${response}\n\nPlease validate this response.`
          }
        ],
        temperature: 0.1
      });

      const validationResult = JSON.parse(completion.choices[0].message.content || '{"validated": false, "issues": ["Failed to parse validation"]}');
      return validationResult;
    } catch (error) {
      return {
        validated: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  validateFlow(scenario: TestScenario, results: {
    analysis: { files: Record<string, string> } | null;
    prisma: { schemas: Record<string, string>; compiled: { type: string; errors?: string[]; document?: unknown } } | null;
    interface: { document: unknown; files: Record<string, string> } | null;
  }): { success: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (scenario.validationCriteria.requiresAnalysis && !results.analysis) {
      errors.push("Missing analysis result");
    }
    
    if (scenario.validationCriteria.requiresPrismaSchema && !results.prisma) {
      errors.push("Missing Prisma schema result");
    }
    
    if (scenario.validationCriteria.requiresApiInterface && !results.interface) {
      errors.push("Missing API interface result");
    }

    // Run custom validations
    for (const customValidation of scenario.validationCriteria.customValidations) {
      const firstSchemaContent = results.prisma?.schemas ? Object.values(results.prisma.schemas)[0] : undefined;
      const validation = customValidation({
        analysisFiles: results.analysis?.files,
        prismaSchema: firstSchemaContent,
        interfaceDocument: results.interface?.document
      });
      
      if (!validation.valid) {
        errors.push(...validation.issues);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  calculateCompletenessScore(adversarialQuestions: Array<{
    question: string;
    response: string;
    validated: boolean;
    issues: string[];
    timestamp: string;
    category?: string;
  }>): {
    overallScore: number;
    breakdown: {
      analysis: { total: number; validated: number; score: number };
      schema: { total: number; validated: number; score: number };
      api: { total: number; validated: number; score: number };
      security: { total: number; validated: number; score: number };
      performance: { total: number; validated: number; score: number };
      errorHandling: { total: number; validated: number; score: number };
      dataConsistency: { total: number; validated: number; score: number };
      userExperience: { total: number; validated: number; score: number };
      general: { total: number; validated: number; score: number };
    };
  } {
    if (adversarialQuestions.length === 0) {
      return {
        overallScore: 0,
        breakdown: {
          analysis: { total: 0, validated: 0, score: 0 },
          schema: { total: 0, validated: 0, score: 0 },
          api: { total: 0, validated: 0, score: 0 },
          security: { total: 0, validated: 0, score: 0 },
          performance: { total: 0, validated: 0, score: 0 },
          errorHandling: { total: 0, validated: 0, score: 0 },
          dataConsistency: { total: 0, validated: 0, score: 0 },
          userExperience: { total: 0, validated: 0, score: 0 },
          general: { total: 0, validated: 0, score: 0 }
        }
      };
    }
    
    // Group questions by category
    const categories = {
      analysis: adversarialQuestions.filter(q => q.category === 'analysis'),
      schema: adversarialQuestions.filter(q => q.category === 'schema'),
      api: adversarialQuestions.filter(q => q.category === 'api'),
      security: adversarialQuestions.filter(q => q.category === 'security'),
      performance: adversarialQuestions.filter(q => q.category === 'performance'),
      errorHandling: adversarialQuestions.filter(q => q.category === 'errorHandling'),
      dataConsistency: adversarialQuestions.filter(q => q.category === 'dataConsistency'),
      userExperience: adversarialQuestions.filter(q => q.category === 'userExperience'),
      general: adversarialQuestions.filter(q => q.category === 'general')
    };
    
    // Calculate scores for each category
    const breakdown = {
      analysis: {
        total: categories.analysis.length,
        validated: categories.analysis.filter(q => q.validated).length,
        score: categories.analysis.length > 0 ? 
          Math.round((categories.analysis.filter(q => q.validated).length / categories.analysis.length) * 100) : 0
      },
      schema: {
        total: categories.schema.length,
        validated: categories.schema.filter(q => q.validated).length,
        score: categories.schema.length > 0 ? 
          Math.round((categories.schema.filter(q => q.validated).length / categories.schema.length) * 100) : 0
      },
      api: {
        total: categories.api.length,
        validated: categories.api.filter(q => q.validated).length,
        score: categories.api.length > 0 ? 
          Math.round((categories.api.filter(q => q.validated).length / categories.api.length) * 100) : 0
      },
      security: {
        total: categories.security.length,
        validated: categories.security.filter(q => q.validated).length,
        score: categories.security.length > 0 ? 
          Math.round((categories.security.filter(q => q.validated).length / categories.security.length) * 100) : 0
      },
      performance: {
        total: categories.performance.length,
        validated: categories.performance.filter(q => q.validated).length,
        score: categories.performance.length > 0 ? 
          Math.round((categories.performance.filter(q => q.validated).length / categories.performance.length) * 100) : 0
      },
      errorHandling: {
        total: categories.errorHandling.length,
        validated: categories.errorHandling.filter(q => q.validated).length,
        score: categories.errorHandling.length > 0 ? 
          Math.round((categories.errorHandling.filter(q => q.validated).length / categories.errorHandling.length) * 100) : 0
      },
      dataConsistency: {
        total: categories.dataConsistency.length,
        validated: categories.dataConsistency.filter(q => q.validated).length,
        score: categories.dataConsistency.length > 0 ? 
          Math.round((categories.dataConsistency.filter(q => q.validated).length / categories.dataConsistency.length) * 100) : 0
      },
      userExperience: {
        total: categories.userExperience.length,
        validated: categories.userExperience.filter(q => q.validated).length,
        score: categories.userExperience.length > 0 ? 
          Math.round((categories.userExperience.filter(q => q.validated).length / categories.userExperience.length) * 100) : 0
      },
      general: {
        total: categories.general.length,
        validated: categories.general.filter(q => q.validated).length,
        score: categories.general.length > 0 ? 
          Math.round((categories.general.filter(q => q.validated).length / categories.general.length) * 100) : 0
      }
    };
    
    // Calculate overall score
    const totalValidated = adversarialQuestions.filter(q => q.validated).length;
    const overallScore = Math.round((totalValidated / adversarialQuestions.length) * 100);
    
    return {
      overallScore,
      breakdown
    };
  }
}