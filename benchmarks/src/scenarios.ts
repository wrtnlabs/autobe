import { TestScenario } from "./types";

export function getDefaultScenarios(): TestScenario[] {
  return [
    {
      name: "BBS System",
      description: "Political/Economic Discussion Board",
      initialPrompt:
        "I want to create a political/economic discussion board. Since I'm not familiar with programming, please write a requirements analysis report as you see fit.",
      followUpPrompts: [
        "Based on the requirements analysis, design the database schema using Prisma.",
        "Based on the database schema, create the API interface specification.",
      ],
      adversarialPrompts: [
        // Analysis questions (5)
        "In the requirements analysis, what happens if a user tries to post without authentication?",
        "What specific user roles and permissions are defined in your requirements analysis?",
        "How does your requirements analysis address content moderation policies?",
        "What are the functional requirements for user profile management in your analysis?",
        "How does your requirements analysis handle different types of political content categorization?",

        // Schema questions (5)
        "How does the database schema handle malicious content or spam posts?",
        "What indexes are needed in your schema for optimal search performance?",
        "How does your schema handle user relationships like following and blocking?",
        "What database constraints prevent invalid data entry in your schema?",
        "How does your schema support hierarchical comment structures and nested replies?",

        // API questions (5)
        "What about rate limiting considerations in your API interface design?",
        "How do you handle pagination in your API for large result sets?",
        "What HTTP status codes does your API return for different error scenarios?",
        "How does your API handle real-time notifications for new posts and comments?",
        "What versioning strategy does your API use for backward compatibility?",

        // Security questions (5)
        "How do you prevent SQL injection attacks in your system?",
        "What authentication mechanisms are implemented for user login?",
        "How do you protect against CSRF attacks in your API?",
        "What measures prevent unauthorized access to user data?",
        "How do you implement content filtering to prevent hate speech and illegal content?",

        // Performance questions (5)
        "What if the database connection fails during a post submission according to your schema design?",
        "How do you ensure data consistency when multiple users comment simultaneously based on your schema?",
        "How do you optimize database queries for high-traffic discussion threads?",
        "What caching strategies are implemented for frequently accessed political discussions?",
        "How do you handle database scaling when user activity spikes during major political events?",

        // Error Handling questions (5)
        "How does your system handle network timeouts during post creation?",
        "What happens when image upload fails during post submission?",
        "How do you recover from partial transaction failures?",
        "What error handling exists for email notification delivery failures?",
        "How do you handle API quota exceeded scenarios for external service integrations?",

        // Data Consistency questions (5)
        "How do you maintain vote count accuracy under high concurrency?",
        "What happens if a user deletes a post with existing comments?",
        "How do you handle duplicate post prevention during network issues?",
        "How do you ensure consistent user reputation scores across multiple actions?",
        "What happens to user statistics when posts are moved between categories?",

        // User Experience questions (5)
        "How do you handle user permissions and moderation features in both schema and API?",
        "What happens if the content exceeds maximum length limits according to your design?",
        "How do you implement search functionality across posts and comments in your complete system design?",
        "How do you implement threaded comment display and sorting options?",
        "How do you provide personalized content recommendations based on user political interests?",

        // General questions (5)
        "How do you monitor system health and performance metrics?",
        "What backup and disaster recovery procedures are in place?",
        "How do you handle data privacy compliance (GDPR, CCPA) in your system?",
        "What logging and audit trails are maintained for administrative actions?",
        "How do you plan for system maintenance and updates with minimal downtime?",
      ],
      validationCriteria: {
        requiresAnalysis: true,
        requiresPrismaSchema: true,
        requiresApiInterface: true,
        requiresTests: false,
        customValidations: [],
      },
    },
    {
      name: "E-Commerce System",
      description: "Online Shopping Platform",
      initialPrompt:
        "I want to build an e-commerce platform for selling agricultural products. Please analyze the requirements and create a comprehensive requirements analysis report.",
      followUpPrompts: [
        "Based on the requirements analysis, design the database schema using Prisma for products, orders, and inventory management.",
        "Based on the database schema, create the API interface specification for the shopping cart and checkout process.",
      ],
      adversarialPrompts: [
        // Analysis questions (5)
        "In the requirements analysis, how do you handle payment processing failures?",
        "What specific business rules for agricultural product sales are captured in your analysis?",
        "How does your requirements analysis address seasonal inventory fluctuations?",
        "What customer segmentation requirements are defined in your analysis for B2B vs B2C sales?",
        "How does your requirements analysis handle multi-currency support for international sales?",

        // Schema questions (5)
        "What happens when inventory becomes unavailable during checkout according to your schema design?",
        "How does your schema handle product variants like size, weight, and quality grades?",
        "What relationships exist between suppliers, products, and inventory in your schema?",
        "How does your database schema track order fulfillment and shipping status?",
        "How does your schema design handle product categorization and hierarchical taxonomy structures?",

        // API questions (5)
        "What about handling different shipping methods and costs in your system design?",
        "How do you implement real-time inventory updates through your API?",
        "What API endpoints handle bulk order processing for wholesale customers?",
        "How does your API manage product catalog synchronization with suppliers?",
        "What API rate limiting and throttling mechanisms protect against abuse?",

        // Security questions (5)
        "What security measures are in place for payment data across your complete system?",
        "How do you protect customer personal information during checkout?",
        "What measures prevent fraudulent orders and payment attempts?",
        "How do you secure API endpoints from unauthorized access?",
        "How do you implement PCI DSS compliance for credit card processing?",

        // Performance questions (5)
        "How do you manage concurrent orders for limited stock items based on your database schema?",
        "How do you optimize search performance across large product catalogs?",
        "What caching strategies improve page load times for product listings?",
        "How do you handle database performance during flash sales and high-traffic events?",
        "What CDN and image optimization strategies improve product page load times?",

        // Error Handling questions (5)
        "How does your system handle payment gateway connection failures?",
        "What happens when shipping calculator services are unavailable?",
        "How do you recover from inventory sync failures with suppliers?",
        "How do you handle partial order fulfillment when some items become unavailable?",
        "What error recovery mechanisms exist for failed email notifications and receipts?",

        // Data Consistency questions (5)
        "How do you maintain accurate inventory counts across multiple sales channels?",
        "What happens to related data when a product is discontinued?",
        "How do you handle price updates during active shopping sessions?",
        "How do you ensure order total accuracy when promotions and taxes are applied?",
        "What mechanisms prevent overselling when inventory updates are delayed?",

        // User Experience questions (5)
        "How do you implement product recommendations based on your schema and API design?",
        "How do you handle order cancellations and refunds in both schema and API interface?",
        "What about implementing discount codes and promotions in your complete system design?",
        "How do you provide order tracking and delivery notifications to customers?",
        "How do you implement wishlist and saved cart functionality across user sessions?",

        // General questions (5)
        "How do you monitor system performance during peak shopping periods?",
        "What analytics and reporting capabilities are built into your system?",
        "How do you handle system backups and disaster recovery for e-commerce data?",
        "What compliance requirements (GDPR, CCPA) are addressed in your system design?",
        "How do you implement A/B testing infrastructure for conversion optimization?",
      ],
      validationCriteria: {
        requiresAnalysis: true,
        requiresPrismaSchema: true,
        requiresApiInterface: true,
        requiresTests: false,
        customValidations: [],
      },
    },
  ];
}
