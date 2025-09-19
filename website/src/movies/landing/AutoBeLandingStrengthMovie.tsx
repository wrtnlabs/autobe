"use client";

import AutoBeLandingStrengthCardMovie from "./AutoBeLandingStrengthCardMovie";

const features = [
  {
    gradientFrom: "rgba(59, 130, 246, 0.1)",
    gradientTo: "rgba(147, 51, 234, 0.1)",
    hoverFrom: "rgba(59, 130, 246, 0.2)",
    hoverTo: "rgba(147, 51, 234, 0.2)",
    shadowColor: "rgb(147, 51, 234)",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    icon: "⚡",
    title: "Intelligent Agents",
    subtitle: "40+ specialized agents collaborate",
    description: "From requirements analysis to API implementation - the entire waterfall development process is fully automated by our intelligent agent system.",
    footerColor: "text-blue-400",
    footer: "• Analyze • Prisma • Interface • Test • Realize",
  },
  {
    gradientFrom: "rgba(236, 72, 153, 0.1)",
    gradientTo: "rgba(239, 68, 68, 0.1)",
    hoverFrom: "rgba(236, 72, 153, 0.2)",
    hoverTo: "rgba(239, 68, 68, 0.2)",
    shadowColor: "rgb(236, 72, 153)",
    iconBg: "bg-pink-500/20",
    iconColor: "text-pink-400",
    icon: "✓",
    title: "AST-Based Generation",
    subtitle: "100% compilation guaranteed",
    description: "AI generates Abstract Syntax Trees first, then compilers validate and generate code - ensuring structural correctness every time.",
    footerColor: "text-pink-400",
    footer: "TypeScript • Prisma • OpenAPI • Zero Errors",
  },
  {
    gradientFrom: "rgba(147, 51, 234, 0.1)",
    gradientTo: "rgba(236, 72, 153, 0.1)",
    hoverFrom: "rgba(147, 51, 234, 0.2)",
    hoverTo: "rgba(236, 72, 153, 0.2)",
    shadowColor: "rgb(147, 51, 234)",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    icon: "🚀",
    title: "Modern Tech Stack",
    subtitle: "Proven enterprise frameworks",
    description: "Built with TypeScript, NestJS, and Prisma - the most trusted tools for enterprise-grade backend applications.",
    footerColor: "text-purple-400",
    footer: "PostgreSQL • SQLite • Production-Ready",
  },
  {
    gradientFrom: "rgba(34, 197, 94, 0.1)",
    gradientTo: "rgba(20, 184, 166, 0.1)",
    hoverFrom: "rgba(34, 197, 94, 0.2)",
    hoverTo: "rgba(20, 184, 166, 0.2)",
    shadowColor: "rgb(34, 197, 94)",
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    icon: "📚",
    title: "Enterprise Ready",
    subtitle: "Complete development lifecycle",
    description: "Comprehensive documentation, E2E testing, and clean architecture that juniors can understand and seniors can extend with AI assistants.",
    footerColor: "text-green-400",
    footer: "Full Documentation • Testing • Maintainable Code",
  },
  {
    gradientFrom: "rgba(234, 179, 8, 0.1)",
    gradientTo: "rgba(251, 146, 60, 0.1)",
    hoverFrom: "rgba(234, 179, 8, 0.2)",
    hoverTo: "rgba(251, 146, 60, 0.2)",
    shadowColor: "rgb(251, 146, 60)",
    iconBg: "bg-yellow-500/20",
    iconColor: "text-yellow-400",
    icon: "💰",
    title: "Cost Effective",
    subtitle: "Reduce development time & cost",
    description: "From months to hours of development time. Significantly reduce backend development costs while maintaining enterprise-grade quality.",
    footerColor: "text-yellow-400",
    footer: "Time Saving • Cost Reduction • High ROI",
  },
  {
    gradientFrom: "rgba(6, 182, 212, 0.1)",
    gradientTo: "rgba(59, 130, 246, 0.1)",
    hoverFrom: "rgba(6, 182, 212, 0.2)",
    hoverTo: "rgba(59, 130, 246, 0.2)",
    shadowColor: "rgb(6, 182, 212)",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    icon: "🌐",
    title: "Open Source & Extensible",
    subtitle: "Flexible and community-driven",
    description: "Open source project with support for multiple LLMs (GPT-4.1, Qwen3), local development, and seamless integration with AI coding assistants.",
    footerColor: "text-cyan-400",
    footer: "Multi-LLM Support • Local Setup • AI Assistant Ready",
  },
];

export default function AutoBeLandingStrengthMovie() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">Why Choose AutoBE?</h2>
          <p className="text-xl text-gray-300">
            Powered by advanced AI agents and compiler validation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <AutoBeLandingStrengthCardMovie key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}