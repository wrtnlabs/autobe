/**
 * Configuration options for retrieving generated files from the AutoBE agent.
 *
 * This interface defines the parameters that control how the agent transforms
 * its internal development artifacts into a concrete file structure ready for
 * deployment or further development. The configuration primarily focuses on
 * database-specific code generation to ensure the output aligns with your
 * target infrastructure and deployment environment.
 *
 * @author Samchon
 */
export interface IAutoBeGetFilesOptions {
  /**
   * Specifies the target database management system for code generation.
   *
   * This parameter fundamentally determines how the generated NestJS
   * application will interact with persistent data storage and shapes the
   * entire codebase structure, configuration, and deployment characteristics.
   *
   * **PostgreSQL (`"postgres"`)**: Generates production-ready code optimized
   * for enterprise PostgreSQL deployments. This includes robust connection
   * pooling, transaction handling, performance optimizations, and configuration
   * suitable for scalable production environments. The generated code assumes
   * external PostgreSQL server infrastructure and includes Docker
   * configurations for containerized deployments.
   *
   * **SQLite (`"sqlite"`)**: Creates lightweight, file-based database code
   * ideal for local development, rapid prototyping, and testing scenarios. This
   * option eliminates external database dependencies by using SQLite's embedded
   * database engine, making the generated application immediately runnable
   * without additional infrastructure setup. Perfect for proof-of-concept
   * demonstrations, development testing, or situations requiring quick
   * application validation.
   *
   * The database choice cascades throughout the entire generated project:
   *
   * - Prisma schema configurations and data source definitions
   * - Database connection strings and environment variable templates
   * - Docker compose files and container orchestration settings
   * - Package.json dependencies and development scripts
   * - Test database setup and teardown procedures
   * - Deployment configuration and infrastructure requirements
   *
   * This comprehensive integration ensures that your generated application
   * maintains consistency across all layers and can be deployed immediately
   * without manual configuration adjustments or compatibility fixes.
   */
  dbms: "postgres" | "sqlite";

  /**
   * Limitation stage.
   *
   * Limitation of the generated files to a specific stage in the AutoBE
   * development process.
   *
   * If you configure this option, the generated files will only include the
   * artifacts up to the specified stage, excluding any subsequent development
   * stages.
   *
   * For example, if AutoBE is currently in the "realize" stage, setting `stage:
   * "interface"` will generate files only up to the interface development
   * stage, omitting any code of the "test" or "realize" steps.
   */
  stage?: "analyze" | "prisma" | "interface" | "test" | "realize";
}
