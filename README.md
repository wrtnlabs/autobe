# AutoBE, Vibe Coding Agent for Backend Applications

<div align="center">

![Auto BE - OG Diagram](https://github.com/user-attachments/assets/d7bd7403-dedb-4194-9a21-4c2fb3af18e8)

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@autobe/agent.svg)](https://www.npmjs.com/package/@autobe/agent)
[![NPM Downloads](https://img.shields.io/npm/dm/@autobe/agent.svg)](https://www.npmjs.com/package/@autobe/agent)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

[![Fund Raising News](https://wrtnlabs.io/agentica/images/badges/fund-raising-news-202503.svg)](https://www.bloomberg.com/news/videos/2025-03-31/wtrn-on-series-b-funding-growth-strategy-video)
[![One Mission](https://wrtnlabs.io/agentica/images/badges/open-source-mission.svg)](https://github.com/wrtnlabs)

</div>

Backend Vibe Coding Agent, enhanced by Compiler and Validation Feedback.

`@autobe` is an AI agent for vibe coding that analyzes user requirements and automatically generates backend applications with the stack below. Since `@autobe` has been enhanced by TypeScript/Prisma compilers and OpenAPI validator feedback, it delivers 100% working code.

- TypeScript
- NestJS
- Prisma (Postgres)

If you integrate the `@autobe` generated backend application with [`@agentica`](https://github.com/wrtnlabs/agentica) or [`@autoview`](https://github.com/wrtnlabs/autoview), you can also automate not only backend development, but also AI chatbot and frontend application development.

Since both [`@agentica`](https://github.com/wrtnlabs/agentica) and [`@autoview`](https://github.com/wrtnlabs/autoview) use the same strategy (compiler and validation feedback) as `@autobe`, they also guarantee 100% working applications.

- [`@agentica`](https://github.com/wrtnlabs/agentica): TypeScript AI function calling framework
- [`@autoview`](https://github.com/wrtnlabs/autoview): AI frontend coding agent using type information

```mermaid
flowchart LR
subgraph "Backend Coding Agent"
  coder("Facade Controller")
end
subgraph "Functional Agents"
  coder --"Requirements Analysis"--> analyze("Analyze")
  coder --"ERD"--> prisma("Prisma")
  coder --"API Design"--> interface("Interface")
  coder --"Test Codes" --> test("Test")
  coder --"Main Program" --> realize("Realize")
end
subgraph "Compiler Feedback"
  prisma --"validates" --> prismaCompiler("Prisma Compiler")
  interface --"validates" --> openapiValidator("OpenAPI Validator")
  interface --"generates" --> tsCompiler("TypeScript Compiler")
  test --"validates" --> tsCompiler("TypeScript Compiler")
  realize --"validates" --> tsCompiler("TypeScript Compiler")
end
```

`@autobe` is based on the waterfall model but incorporates the spiral model's iterative improvement cycles, producing high-quality code through continuous feedback between users and AI.

The spiral process ensures not only well-structured code but also safe and reliable implementations verified by integrated TypeScript/Prisma compilers, OpenAPI validator, and automated test programs at each development stage.

Waterfall    | AutoBE   | Description
-------------|----------|----------------
Requirements | Analysis  | Users tell AutoBE what they want, and AutoBE helps them discover their needs and make them concrete.
Analysis     | Analysis  | Write requirement analysis reports
Design       | Prisma    | Write prisma schema (DB ORM) files, and validate them using the embedded Prisma compiler. If validation succeeds, also create [ERD documentation](https://github.com/samchon/prisma-markdown) for the next step.
Design       | Interface | Write OpenAPI documents, and validate them using the [OpenAPI validator](https://github.com/samchon/openapi). Then convert them to a NestJS project through the [OpenAPI generator](https://nestia.io/docs/swagger/editor). The OpenAPI generator includes not only NestJS controllers, but also client-side SDKs and e2e test programs.
Development  | Realize   | Write implementation code for each API endpoint starting from what the `interface` agent generated, and validate them using the embedded TypeScript compiler.
Testing      | Test      | Write e2e test functions for each API endpoint starting from what the `interface` agent generated, and validate them using the embedded TypeScript compiler.
Maintenance  | -         | Users can request AutoBE to modify the backend application. There are no restrictions on the scope of modification, so everything can be changed, including requirements, DB design, API specifications, and test code.

## Playground

https://github.com/user-attachments/assets/00a3649a-ca0a-417b-a2eb-43387d45b4aa

[https://stackblitz.com/github/wrtnlabs/autobe-playground-stackblitz](https://stackblitz.com/github/wrtnlabs/autobe-playground-stackblitz?file=md!README.md)

You can experience the `@autobe` agent from the playground website above.

Currently, the alpha version of `@autobe` supports up to the [Interface](#interface) step, but it will be expanded to include full features in the beta release. In the official release, you may be able to experience full-stack vibe coding by integrating with [`@agentica`](https://github.com/wrtnlabs/agentica) and [`@autoview`](https://github.com/wrtnlabs/autoview).

To see examples of backend applications generated by `@autobe`, check out these interactive demos. These demos showcase `@autobe`'s ability to generate production-ready backend code with proper structure, API documentation, and TypeScript interfaces. If you're not sure what to talk about, please refer to the BBS example script below.

- [BBS (Bulletin Board System)](https://stackblitz.com/github/wrtnlabs/autobe-example-bbs)
  1. I want to create a political/economic discussion board. Since I'm not familiar with programming, please write a requirements analysis report as you see fit.
  2. Design the database schema.
  3. Create the API interface specification.
- [E-Commerce](https://stackblitz.com/github/wrtnlabs/autobe-example-shopping)

## Documentation Resources

Preparing...

It will be published with the beta release (2025-07-01).

## Vibe Coding Ecosystem

### Full Stack Vibe Coding

```mermaid
flowchart LR
vibe("Vibe Coding")
backend("Backend Application")
chatbot("AI Chatbot")
frontend("Frontend Application")

vibe --"@autobe" --> backend
backend --"@agentica" --> chatbot
backend --"@autoview" --> frontend
```

Our [WrtnLabs](https://github.com/wrtnlabs) team is developing two more projects, [`@agentica`](https://github.com/wrtnlabs/agentica) and [`@autoview`](https://github.com/wrtnlabs/autoview). [`@agentica`](https://github.com/wrtnlabs/agentica) automatically creates an AI Chatbot when you simply provide a `swagger.json` file, and [`@autoview`](https://github.com/wrtnlabs/autoview) automatically generates a Frontend Application when you provide a `swagger.json` file.

Therefore, you're not limited to automatically creating a backend with `@autobe` and vibe coding. If you've created a backend server with vibe coding through `@autobe`, you can immediately create an AI Chatbot and Frontend Application alongside it.

Can you converse? Then you're a full-stack developer.

### Agentica, AI Function Calling Framework

![Agentica - OG Diagram](https://github.com/user-attachments/assets/42a238b1-9223-4c7d-883c-b94ccc59ae68)

> `@autobe` is also developed using [`@agentica`](https://github.com/wrtnlabs/agentica)

https://github.com/wrtnlabs/agentica

Agentica is an Agentic AI framework specialized in AI Function Calling.

It does everything through function calling, and brings functions from the three protocols below. If you provide the `swagger.json` file of an `@autobe` generated backend server, it directly becomes an AI chatbot that interacts with it.

  - TypeScript Class/Interface
  - Swagger/OpenAPI Document
  - MCP (Model Context Protocol) Server

```typescript
import { Agentica, assertHttpController } from "@agentica/core";
import OpenAI from "openai";
import typia from "typia";

import { MobileFileSystem } from "./services/MobileFileSystem";

const agent = new Agentica({
  vendor: {
    api: new OpenAI({ apiKey: "********" }),
    model: "gpt-4o-mini",
  },
  controllers: [
    // functions from TypeScript class
    typia.llm.controller<MobileFileSystem, "chatgpt">(
      "filesystem",
      MobileFileSystem(),
    ),
    // functions from Swagger/OpenAPI
    assertHttpController({
      name: "shopping",
      model: "chatgpt",
      document: await fetch(
        "https://shopping-be.wrtn.ai/editor/swagger.json",
      ).then(r => r.json()),
      connection: {
        host: "https://shopping-be.wrtn.ai",
        headers: { Authorization: "Bearer ********" },
      },
    }),
  ],
});
await agent.conversate("I wanna buy MacBook Pro");
```

### AutoView, Type to React Component

![Autoview - OG Diagram](https://github.com/user-attachments/assets/7ed405c6-4116-4c18-9ae4-487bc9fc1e2d)

https://github.com/wrtnlabs/autoview

AutoView is a frontend automation tool that generates React component code from type information from the sources below. If you provide the `swagger.json` file of an `@autobe` generated backend server, it directly becomes a frontend application.

  - TypeScript Type
  - JSON Schema (OpenAPI Document)

```typescript
import { AutoViewAgent } from "@autoview/agent";
import fs from "fs";
import OpenAI from "openai";
import typia, { tags } from "typia";

// 1. Define your own TypeScript interface to display
interface IMember {
  id: string & tags.Format<"uuid">;
  name: string;
  age: number & tags.Minimum<0> & tags.Maximum<100>;
  thumbnail: string & tags.Format<"uri"> & tags.ContentMediaType;
}

// 2. Setup the AutoView agent
const agent = new AutoViewAgent({
  model: "chatgpt",
  vendor: {
    api: new OpenAI({ apiKey: "********" }),
    model: "o3-mini",
    isThinkingEnabled: true,
  },
  input: {
    type: "json-schema",
    unit: typia.json.unit<IMember>(),
  },
  transformFunctionName: "transformMember",
  experimentalAllInOne: true, // recommended for faster and less-error results
});

// 3. Get the result!
const result = await agent.generate(); 
await fs.promises.writeFile(
  "./src/transformers/transformMember.ts",
  result.transformTsCode,
  "utf8",
);
```

## Roadmap Schedule

### Pre-Releases

```mermaid
gantt
  dateFormat YYYY-MM-DD
  title Pre-Release Roadmap Schedule

  section Interface
  Facade Controller: done, 2025-04-30, 18d
  Event Handlers:    done, 2025-05-18, 14d
  Data Structures:   done, 2025-05-18, 28d

  section Compilers
  Backend Compiler:     done, 2025-04-30, 32d
  Schema to TypeScript: done, 2025-05-18, 14d
  Prisma Compiler:      done, 2025-05-18, 14d

  section Orchestration
  Analyze  : done,    2025-04-30, 18d
  Prisma   : done,    2025-04-30, 18d
  Interface: done,    2025-05-18, 28d
  Test     : planned, 2025-06-01, 28d
  Realize  : planned, 2025-06-01, 28d
  Facade   : done,    2025-05-18, 18d

  section Test Program
  Compilers: done,    2025-04-30, 46d
  Prompts:   done,    2025-04-30, 46d
  Benchmark: planned, 2025-06-01, 28d

  section Playground Website
  websocket: done, 2025-05-18, 14d
  backend  : done, 2025-06-01, 14d
  frontend : done, 2025-06-08, 14d
```

We are committed to delivering the best possible `@autobe` experience and have confirmed that all functional agents are operating correctly. Prior to our v1.0 official release, we plan to conduct two pre-release phases as outlined below.

However, these alpha and beta pre-releases will lack certain refinements. Streaming functionality will not be available, which means users may experience longer wait times during conversations with the `@autobe` agent while it completes program generation. Additionally, limited event granularity may make it difficult to track the intermediate progress of functional agents.

During this period, comprehensive documentation will not yet be available. Developers who wish to use `@autobe` at the library level may need to refer directly to API documentation, source code comments, or test programs to understand usage patterns.

All these limitations will be resolved in the v1.0 official release.

  - Alpha version: 2025-06-01
  - Beta version: 2025-07-01

### Official Release

We will create a comprehensive technical specification website to introduce `@autobe`'s concepts and usage. We'll provide detailed guidance on how to integrate [`@agentica`](https://github.com/wrtnlabs/agentica) with backend servers generated by `@autobe` to create AI chatbot applications, and how to leverage [`@autoview`](https://github.com/wrtnlabs/autoview) with `@autobe` generated servers to instantly build frontend and mobile applications.

Additionally, we will implement streaming processing for `@autobe` agents, allowing users to observe in real-time what the `@autobe` agent is thinking, planning, and creating. We will enhance and document the event API to provide convenience for developers using `@autobe` at the library level.

Once this comprehensive refinement work is completed, `@autobe` will be officially released as version 1.0. We appreciate your anticipation and support.

- Target Release: 2025-08-01

### Hosting Service

We will create an integrated `@autobe` hosting service. When you discuss requirements with the `@autobe` agent through chat, your application will be deployed to our server infrastructure and made available for immediate use.

This integrated hosting service will be connected with [`@agentica`](https://github.com/wrtnlabs/agentica) and [`@autoview`](https://github.com/wrtnlabs/autoview). Simply by discussing requirements with the AI agent, you can automatically generate and deploy not only backend servers but also AI chatbot applications and frontend/mobile applications, all ready for immediate testing and use.

While we cannot yet guarantee the exact launch date for our hosting service, Wrtn Technologies will demonstrate the future of vibe coding. We will show you not the current era's vibe coding where you might succeed once or twice out of 100 attempts and exclaim "wow" with excitement, but the future's vibe coding where 100 attempts yield 100 successes—truly reliable, production-ready automation.

- Target Release: 2025-12-01

## Principles

```mermaid
flowchart LR
subgraph "Backend Coding Agent"
  coder("Facade Controller")
end
subgraph "Functional Agents"
  coder --"Requirements Analysis"--> analyze("Analyze")
  coder --"ERD"--> prisma("Prisma")
  coder --"API Design"--> interface("Interface")
  coder --"Test Codes" --> test("Test")
  coder --"Main Program" --> realize("Realize")
end
subgraph "Compiler Feedback"
  prisma --"validates" --> prismaCompiler("Prisma Compiler")
  interface --"validates" --> openapiValidator("OpenAPI Validator")
  interface --"generates" --> tsCompiler("TypeScript Compiler")
  test --"validates" --> tsCompiler("TypeScript Compiler")
  realize --"validates" --> tsCompiler("TypeScript Compiler")
end
```

`@autobe` consists of five core functional agents, each responsible for a specific stage of backend development.

These agents operate independently while utilizing outputs from previous stages to form a coherent development pipeline.

### Analyze

An agent that analyzes requirements and creates specification documents.

- **Input**: All conversation history between users and AI
- **Output**: Structured requirements specification
- **Features**: 
  - Separates business logic from technical requirements
  - Generates follow-up questions for ambiguous requirements
  - Establishes priorities and defines development scope

The Analyze agent serves as the foundation of the entire development process. It not only captures initial requirements but also continuously refines understanding through iterative conversation with users. When requirements are ambiguous or incomplete, it proactively formulates targeted questions to elicit necessary information before proceeding with development.

Additionally, once other agents have generated code, the Analyze agent can interpret change requests in the context of existing implementations, assessing the impact and feasibility of modifications while maintaining system integrity. This comprehensive approach ensures that all subsequent development stages work from a clear, complete, and consistent specification.

### Prisma

An agent that analyzes requirements specifications to generate database schemas in Prisma format.

- **Input**: Requirements specification
- **Output**: Prisma DB schema and ERD documentation
- **Features**:
  - Automatic schema validation with built-in Prisma compiler
  - Detailed comments for entities and attributes
  - Automatic ERD documentation generation (using `prisma-markdown`)
  - Schema optimization through self-review system

The Prisma agent references the requirements specification document created by the [Analyze Agent](#analyze) to craft the `prisma.schema` file. For each entity and attribute in the database schema, it provides comprehensive documentation including the rationale behind its creation, its purpose, and conceptual explanations. The agent employs normalization techniques to ensure high-quality database design.

Once the DB schema file is written, the Prisma agent compiles it using the built-in Prisma compiler. If compilation errors occur, these are fed back to the AI agent, enabling a self-correction process through compiler feedback. After successful compilation, the schema is converted into ERD documentation using [`prisma-markdown`](https://github.com/samchon/prisma-markdown). This documentation is then subjected to a quality assurance process through an internal review agent that verifies and refines the schema.

```prisma
/// Final component information on units for sale.
/// 
/// `shopping_sale_snapshot_unit_stocks` is a subsidiary entity of 
/// {@link shopping_sale_snapshot_units} that represents a product catalog 
/// for sale, and is a kind of final stock that is constructed by selecting 
/// all {@link shopping_sale_snapshot_unit_options options} 
/// (variable "select" type) and their 
/// {@link shopping_sale_snapshot_unit_option_candidates candidate} values in 
/// the belonging unit. It is the "good" itself that customers actually 
/// purchase.
/// 
/// - Product Name) MacBook
///   - Options
///   - CPU: { i3, i5, i7, i9 }
///   - RAM: { 8GB, 16GB, 32GB, 64GB, 96GB }
///   - SSD: { 256GB, 512GB, 1TB }
///   - Number of final stocks: 4 * 5 * 3 = 60
///
/// For reference, the total number of `shopping_sale_snapshot_unit_stocks` 
/// records in an attribution unit can be obtained using Cartesian Product. 
/// In other words, the value obtained by multiplying all the candidate 
/// values that each (variable "select" type) option can have by the number 
/// of cases is the total number of final stocks in the unit. 
///
/// Of course, without a single variable "select" type option, the final 
/// stocks count in the unit is only 1.
///
/// @namespace Sales
/// @erd Carts
model shopping_sale_snapshot_unit_stocks {
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged unit's {@link shopping_sale_snapshot_units.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_unit_id String @db.Uuid

  /// Name of the final stock.
  name String @db.VarChar

  /// Nominal price.
  ///
  /// This is not real price to pay, but just a nominal price to show.
  /// If this value is greater than the `real_price`, it would be shown
  /// like seller is giving a discount.
  ///
  /// @minimum 0
  nominal_price Float @db.DoublePrecision

  /// Real price to pay.
  ///
  /// @minimum 0
  real_price Float @db.DoublePrecision

  /// Initial inventory quantity.
  ///
  /// If this stock has been sold over this quantity count, the stock can't
  /// be sold anymore, because of out of stock. In that case, the seller can
  /// supplement the inventory quantity by registering some 
  /// {@link shopping_sale_snapshot_unit_stock_supplements} records.
  ///
  /// @minimum 0
  quantity Int

  /// Sequence order in belonged unit.
  sequence Int @db.Integer
}
```

### Interface

An agent that designs API interfaces based on requirements specifications and ERD documentation.

- **Input**: Requirements specification, ERD documentation
- **Output**:
  - OpenAPI Document by structured output
  - TypeScript code generated by [OpenAPI generator](https://nestia.io/docs/swagger/editor)
    - TypeScript DTO types
    - NestJS Controllers
    - Client SDK Library
    - E2E Test Functions
- **Features**:
  - OpenAPI Operation Schema and JSON Schema generation
  - Detailed API documentation comments
  - Self-validating interface generation pipeline
  - NestJS code conversion

The Interface agent bridges the gap between database design and implementation by creating precise, consistent API interfaces. The agent follows a sophisticated generation process that prioritizes correctness and clarity.

First, it analyzes the requirements specification and ERD documentation to understand the business domain and data relationships. Then, instead of directly writing TypeScript code, it constructs formal OpenAPI Operation Schemas and JSON Schemas as an intermediate representation. This deliberate constraint helps maintain consistency and prevents the unbounded expressiveness of TypeScript from introducing design flaws.

These schemas are combined to produce a validated `swagger.json` file, which undergoes rigorous verification. Only after passing validation is this structured representation transformed into NestJS controllers, DTOs, Client SDK Library, and E2E Test Functions. This pipeline ensures that all API interfaces adhere to OpenAPI standards and project conventions.

Each generated interface includes comprehensive JSDoc comments explaining its purpose, behavior, and relationship to other components. These annotations serve both as documentation for developers and as self-verification mechanisms for the agent to confirm its design decisions align with requirements.

An internal review agent continually cross-references the generated interfaces against the original requirements and data model, ensuring completeness and consistency. Additionally, the system integrates human feedback by presenting generated interfaces to users for approval or revision before proceeding to implementation.

```typescript
@Controller("shoppings/customers/sales")
export class ShoppingCustomerSaleController {
  /**
   * List up every summarized sales.
   *
   * List up every {@link IShoppingSale.ISummary summarized sales}.
   *
   * As you can see, returned sales are summarized, not detailed. It does not
   * contain the SKU (Stock Keeping Unit) information represented by the
   * {@link IShoppingSaleUnitOption} and {@link IShoppingSaleUnitStock} types.
   * If you want to get such detailed information of a sale, use
   * `GET /shoppings/customers/sales/{id}` operation for each sale.
   *
   * > If you're an A.I. chatbot, and the user wants to buy or compose
   * > {@link IShoppingCartCommodity shopping cart} from a sale, please
   * > call the `GET /shoppings/customers/sales/{id}` operation at least once
   * > to the target sale to get detailed SKU information about the sale.
   * > It needs to be run at least once for the next steps.
   *
   * @param input Request info of pagination, searching and sorting
   * @returns Paginated sales with summarized information
   * @tag Sale
   * @autobe Generated by AutoBE - https://github.com/wrtnlabs/autobe
   */
  @core.TypedRoute.Patch()
  public async index(
    @core.TypedBody() input: IShoppingSale.IRequest,
  ): Promise<IPage<IShoppingSale.ISummary>> {
    input;
    return typia.random<IPage<IShoppingSale.ISummary>>()
  }
}
```

### Test

An agent that generates E2E test code for each API interface.

- **Input**: API interfaces, OpenAPI Schema
- **Output**: Test code for each API function
- **Features**:
  - Dependency analysis for sequencing test execution
  - Automatic generation of complex test scenarios
  - Detailed test documentation through comments
  - Code validation through TypeScript compiler
  - Test coverage optimization

The Test agent synthesizes information from previously generated artifacts to produce thorough end-to-end test suites that validate both individual API endpoints and their interactions. Drawing from the requirements specification, ERD documentation, and interface definitions, it constructs tests that verify functional correctness and business rule compliance.

At its core, the Test agent leverages two critical inputs from the Interface agent's work: first, it utilizes both the OpenAPI Operation Schemas and the derived TypeScript/NestJS API interface code that define each endpoint's contract. Second, it works with automatically pre-generated e2e test program scaffolds that are mechanically derived from these OpenAPI Operation Schemas. These scaffolds provide the foundation upon which the Test agent builds more sophisticated test scenarios, enhancing them with business logic validation and dependency-aware execution sequences.

A key strength of the Test agent is its ability to analyze dependency relationships between API functions. When certain endpoints require preconditions established by other API calls, the agent automatically structures integrated test scenarios that execute functions in the correct sequence. Each test case includes detailed comments explaining the test's purpose, prerequisites, and expected results, serving as both documentation and verification of test intent.

As with other components of the `@autobe` system, the Test agent incorporates built-in TypeScript compiler validation to ensure syntactic correctness. When compilation errors occur, they're fed back into the agent, creating a self-correcting learning loop that improves code quality. An internal review agent further evaluates test coverage and quality, suggesting improvements to achieve optimal testing thoroughness.

```typescript
export const test_api_shoppings_admins_sales_reviews_comments_create =
  async (connection: api.IConnection) => {
    const output: IShoppingSaleInquiryComment =
      await api.functional.shoppings.admins.sales.reviews.comments.create(
        connection,
        typia.random<string & tags.Format<"uuid">>(),
        typia.random<string & tags.Format<"uuid">>(),
        typia.random<IShoppingSaleInquiryComment.ICreate>(),
      );
    typia.assert(output);
  };
```

> Systematically generated test code by the `interface` agent, and the `test` agent starts from it

### Realize

An agent that writes realization code for each API function.

- **Input**: Requirements specification, Prisma schema, API interfaces, test code
- **Output**: Service realization code for each API endpoint
- **Features**:
  - Compilation feedback through TypeScript compiler
  - Runtime feedback through test code execution
  - Code quality improvement through self-review system
  - Business logic optimization

The Realize agent is the culmination of the `@autobe` development pipeline, synthesizing outputs from all previous agents to create fully functional service provider code for each API endpoint. This agent comprehensively analyzes the requirements specification, Prisma schema, API interfaces, and test code to implement business logic that satisfies all defined requirements.

Internal validation mechanisms ensure high-quality output through multiple feedback loops. First, an embedded TypeScript compiler provides immediate compilation feedback, catching syntax errors and type mismatches. Second, the realization code is tested against the test suites created by the Test Agent, providing runtime feedback that validates functional correctness. Finally, an internal review agent evaluates the code quality, identifying opportunities for optimization and improvement.

The Realize agent focuses on creating maintainable, efficient code that correctly implements the business logic while adhering to best practices. It generates service providers that handle database interactions through Prisma, implement security and validation checks, and process business rules according to the requirements specification.
