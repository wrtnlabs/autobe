/**
 * Union type representing predefined example project templates.
 *
 * This type enumerates the available example project templates that can be used
 * to quickly initialize AutoBE with well-known application patterns. Each
 * example project provides a complete set of pre-written requirements,
 * demonstrating different types of backend applications and serving as starting
 * points for users to understand AutoBE's capabilities or bootstrap their own
 * projects.
 *
 * **Available Example Projects**:
 *
 * - **todo**: Simple task management application with CRUD operations for todo
 *   items, demonstrating basic backend patterns
 * - **bbs**: Bulletin Board System with posts, comments, and user interactions,
 *   showcasing hierarchical data structures and community features
 * - **reddit**: Reddit-like social platform with posts, voting, comments, and
 *   community moderation, demonstrating complex social application patterns
 * - **shopping**: E-commerce application with products, shopping carts, orders,
 *   and payment processing, showcasing transactional business logic
 * - **chat**: Real-time messaging application with channels, direct messages,
 *   and presence, demonstrating real-time communication patterns
 * - **account**: User account management system with authentication,
 *   authorization, profiles, and security features, showcasing identity and
 *   access management patterns
 *
 * These examples serve multiple purposes:
 *
 * 1. **Learning**: Help users understand how to write effective requirements
 *    for AutoBE
 * 2. **Demonstration**: Showcase AutoBE's ability to generate complete backends
 *    for various domains
 * 3. **Testing**: Provide consistent test cases for validating AutoBE's
 *    generation quality
 * 4. **Bootstrapping**: Offer starting points that users can modify and extend
 *    for their own needs
 *
 * @author Samchon
 */
export type AutoBeExampleProject =
  | "todo"
  | "bbs"
  | "reddit"
  | "shopping"
  | "chat"
  | "account";
