<!--
AutoBE, Backend No-Coding Agent Achieving 100% Compilation Success (Open Source)
-->

## Preface

{% youtube 6Pio2tp5QMU %}

We are immensely proud to introduce AutoBE, our revolutionary open-source vibe coding agent for backend applications, developed by Wrtn Technologies.

AutoBE is an AI-powered no-code agent that solves the fundamental problem every developer faces with AI code generation: broken, incomplete, or non-compilable code. Unlike typical AI coding assistants that generate snippets and hope for the best, AutoBE produces 100% working, production-ready backend applications through a revolutionary compiler-driven approach.

The core innovation lies in AutoBE's internal compiler system that validates every piece of generated code in real-time. When the AI makes mistakes, the compiler catches them, provides detailed feedback, and guides the AI to retry until perfect code is achieved.

**Links:**
- **GitHub Repository**: https://github.com/wrtnlabs/autobe
- **Guide Documents**: https://wrtnlabs.io/autobe/docs
- **Demo Result (Generated backend applications)**
  - Bulletin Board System: https://github.dev/wrtnlabs/autobe-example-bbs
  - E-Commerce System: https://github.dev/wrtnlabs/autobe-example-shopping

## Playground

Experience AutoBE directly in your browser at https://stackblitz.com/github/wrtnlabs/autobe-playground-stackblitz

**Demo Example - Creating a Bulletin Board System:**

In the demo video, we demonstrated AutoBE by making this request:

> "I want to create a current affairs and economics bulletin board, but I don't know much about development. So please have the AI handle all the requirements analysis report for me."

The result was impressive: In just forty minutes, AutoBE delivered a complete, enterprise-grade backend application that would typically require months of development work by a team of senior developers.

**What AutoBE Generated:**
- Requirements Analysis: Comprehensive six-chapter specification document with user roles, feature prioritization, and technical requirements
- Database Design: Twenty-three properly normalized tables with foreign key relationships, indexes, and constraints  
- API Development: One hundred twenty-five REST endpoints with complete OpenAPI documentation and request/response schemas
- Quality Assurance: Two hundred fifty-three end-to-end tests covering every user scenario and edge case
- Developer Tools: Type-safe SDK generation for seamless frontend integration

## How It Actually Works

AutoBE doesn't just generate code and hope for the best. Here's the magic process:

```
User Request → AI Function Calling → AST Generation → Compiler Validation
                     ↑                                         ↓
                 Retry with feedback ← Error Analysis ← Validation Failed
```

The system employs a sophisticated five-step waterfall model that mirrors how senior developers approach complex projects:

1. **Requirements Analysis** - Generates detailed project specifications and user roles
2. **Database Design** - Creates optimized schemas with proper relationships  
3. **API Specification** - Develops complete REST API documentation
4. **E2E Test Generation** - Writes comprehensive test suites
5. **Main Program Implementation** - Full backend code (coming in beta)

Currently, four of these five steps are fully implemented in the alpha release. The technology stack was carefully chosen for enterprise reliability: TypeScript ensures type safety, NestJS provides scalable server-side architecture, and Prisma offers next-generation database management.

**The Compiler Feedback Process**: AutoBE constructs Abstract Syntax Trees (AST) for each component through AI function calling, with dedicated validation for each step:

| Step | AST Structure | Validation Logic |
|------|---------------|------------------|
| **Database Design** | [`AutoBePrisma.IApplication`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/prisma/AutoBePrisma.ts) | [`IAutoBePrismaValidation`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/prisma/IAutoBePrismaValidation.ts) |
| **API Specification** | [`AutoBeOpenApi.IDocument`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/openapi/AutoBeOpenApi.ts) | [`IValidation`](https://github.com/samchon/openapi/blob/master/src/structures/IValidation.ts) |
| **E2E Test Code** | [`AutoBeTest.IFunction`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/test/AutoBeTest.ts) | [`IAutoBeTypeScriptCompileResult`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/compiler/IAutoBeTypeScriptCompileResult.ts) |

When the AI constructs AST data, internal compilers immediately validate the structure. If validation fails, the system provides detailed error analysis explaining exactly what went wrong and how to fix it. The AI learns from this feedback and retries until achieving perfect results. This approach fundamentally solves the reliability problem that plagues AI-generated code.

## Beta Release is Coming

**Upcoming Milestones:**
- **Beta Release**: August 31, 2025 (complete 5-step process)
- **Production Release**: December 1, 2025 (enterprise-ready service)

The beta release will complete AutoBE's five-step waterfall process by adding the final "Realize" step - full main program implementation. Currently, AutoBE generates comprehensive specifications, database designs, API documentation, and test suites, but stops short of creating the actual running application code.

With the Realize Agent, AutoBE will generate the complete NestJS application including all controllers, services, DTOs, middleware, guards, and business logic implementation. The generated applications will be fully functional backend servers that can be immediately deployed and run in production environments. Users will receive not just the architectural blueprints and test specifications, but the complete, working codebase that implements every requirement.

This represents the transition from "design and specification" to "complete application delivery" - the final piece that transforms AutoBE from a powerful design tool into a comprehensive backend development solution.

## Current Limitations

AutoBE remains in alpha status with several important limitations:

**Requirements Accuracy**: While AutoBE excels at creating perfectly compilable, well-architected code, there's no guarantee the generated backend precisely matches user intentions. The AI might create technically excellent features that differ from what users actually wanted.

**Token Consumption**: The current implementation lacks RAG optimization, resulting in high token usage. The economics forum demo consumed approximately 10 million tokens (~$30). This represents remarkable value compared to traditional development timelines, but it's significantly more expensive than typical AI tools.

**Local Model Compatibility**: The system is currently optimized for cloud-based LLMs and hasn't been extensively tested with local alternatives. For the LocalLLM community, this represents both a limitation and an opportunity to explore adaptations for models like Code Llama or Deepseek Coder.

**User Experience**: As a proof-of-concept implementation, AutoBE prioritizes demonstrating core technical capabilities over polished user experience.
