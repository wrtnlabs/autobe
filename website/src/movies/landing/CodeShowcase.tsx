"use client";

import { useEffect, useRef, useState } from "react";

const CHAT_MESSAGE =
  "Build a shopping mall backend with user auth, product catalog, cart, and payment API";

const TABS = [
  {
    name: "schema.prisma",
    code: `model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  role      UserRole @default(CUSTOMER)
  cart      Cart?
  orders    Order[]
  createdAt DateTime @default(now())
}

model Product {
  id          String   @id @default(uuid())
  name        String
  description String
  price       Float
  stock       Int      @default(0)
  category    Category @relation(fields: [categoryId])
  categoryId  String
  cartItems   CartItem[]
}

model Order {
  id        String      @id @default(uuid())
  user      User        @relation(fields: [userId])
  userId    String
  items     OrderItem[]
  total     Float
  status    OrderStatus @default(PENDING)
  payment   Payment?
  createdAt DateTime    @default(now())
}`,
  },
  {
    name: "products.controller.ts",
    code: `@Controller("products")
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  async findAll(
    @Query() query: FindProductsDto,
  ): Promise<PaginatedResponse<Product>> {
    return this.productsService.findAll(query);
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
  ): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(
    @Body() dto: CreateProductDto,
  ): Promise<Product> {
    return this.productsService.create(dto);
  }
}`,
  },
  {
    name: "products.e2e.ts",
    code: `describe("ProductsController (e2e)", () => {
  it("GET /products — returns paginated list", async () => {
    const res = await request(app.getHttpServer())
      .get("/products")
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta.total).toBeDefined();
  });

  it("POST /products — admin can create", async () => {
    const res = await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", \`Bearer \${adminToken}\`)
      .send({
        name: "Wireless Headphones",
        description: "Noise-cancelling",
        price: 79.99,
        stock: 150,
        categoryId: categoryId,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("Wireless Headphones");
  });
});`,
  },
];

const TAB_RESULTS: {
  title: string;
  items: { label: string; value: string }[];
  extra: string;
}[] = [
  {
    title: "Database Schema",
    items: [
      { label: "Models", value: "12" },
      { label: "Relations", value: "18" },
      { label: "Enums", value: "3" },
      { label: "Indexes", value: "8" },
    ],
    extra: "Prisma validated · 0 errors",
  },
  {
    title: "API Endpoints",
    items: [
      { label: "GET", value: "/products" },
      { label: "POST", value: "/products" },
      { label: "GET", value: "/cart" },
      { label: "POST", value: "/orders" },
      { label: "POST", value: "/auth/login" },
      { label: "POST", value: "/payments" },
    ],
    extra: "+ 41 more endpoints",
  },
  {
    title: "Test Coverage",
    items: [
      { label: "Test suites", value: "24" },
      { label: "Test cases", value: "156" },
      { label: "Assertions", value: "480+" },
      { label: "Coverage", value: "100%" },
    ],
    extra: "All tests passing",
  },
];

const INITIAL_PIPELINE_STEPS = [
  "Analyzing requirements",
  "Generating database schema",
  "Generating API specification",
  "Generating E2E tests",
  "Compiling TypeScript",
];

const TAB_PIPELINE_STEPS = [
  [
    "Parsing entity relationships",
    "Validating Prisma schema",
    "Generating indexes",
    "Schema compiled",
  ],
  [
    "Generating controllers",
    "Applying guards & decorators",
    "Validating routes",
    "API compiled",
  ],
  [
    "Generating test suites",
    "Creating assertions",
    "Validating coverage",
    "Tests compiled",
  ],
];

const KEYWORDS =
  /\b(model|enum|import|export|class|const|let|async|await|return|describe|it|expect)\b/;
const DECORATORS = /(@\w+)/;
const STRINGS = /(["'`])(?:(?=(\\?))\2.)*?\1/;
const TYPES = /\b(String|Int|Float|Boolean|DateTime|Promise|Array)\b/;
const NUMBERS = /\b(\d+\.?\d*)\b/;

function HighlightedLine({ text }: { text: string }) {
  const tokens: { value: string; color: string }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliest = { index: Infinity, length: 0, color: "", match: "" };

    for (const [regex, color] of [
      [STRINGS, "text-emerald-400"],
      [DECORATORS, "text-yellow-400"],
      [KEYWORDS, "text-purple-400"],
      [TYPES, "text-blue-400"],
      [NUMBERS, "text-orange-400"],
    ] as [RegExp, string][]) {
      const m = remaining.match(regex);
      if (m && m.index !== undefined && m.index < earliest.index) {
        earliest = {
          index: m.index,
          length: m[0].length,
          color,
          match: m[0],
        };
      }
    }

    if (earliest.index === Infinity) {
      tokens.push({ value: remaining, color: "" });
      break;
    }

    if (earliest.index > 0) {
      tokens.push({ value: remaining.slice(0, earliest.index), color: "" });
    }
    tokens.push({ value: earliest.match, color: earliest.color });
    remaining = remaining.slice(earliest.index + earliest.length);
  }

  return (
    <span>
      {tokens.map((t, i) =>
        t.color ? (
          <span key={i} className={t.color}>
            {t.value}
          </span>
        ) : (
          <span key={i}>{t.value}</span>
        ),
      )}
    </span>
  );
}

export default function CodeShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [typedChat, setTypedChat] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [visibleResultItems, setVisibleResultItems] = useState(0);
  const [started, setStarted] = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const [tabPipelineStep, setTabPipelineStep] = useState(-1);
  const [tabCompletedSteps, setTabCompletedSteps] = useState<number[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Start on viewport enter
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  // Phase 1: Chat typing
  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedChat(CHAT_MESSAGE.slice(0, i));
      if (i >= CHAT_MESSAGE.length) {
        clearInterval(interval);
        // Phase 2: Start pipeline steps
        setTimeout(() => setPipelineStep(0), 400);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [started]);

  // Phase 2: Initial pipeline steps (sequential with delays)
  useEffect(() => {
    if (pipelineStep < 0 || pipelineStep >= INITIAL_PIPELINE_STEPS.length) return;

    const delay = [600, 800, 700, 600, 900][pipelineStep] ?? 700;
    const timeout = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, pipelineStep]);

      // Show code when schema step completes
      if (pipelineStep === 1) setShowCode(true);

      if (pipelineStep < INITIAL_PIPELINE_STEPS.length - 1) {
        setPipelineStep(pipelineStep + 1);
      } else {
        // All steps done — start tab-specific pipeline
        setInitialDone(true);
        setTimeout(() => setTabPipelineStep(0), 300);
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [pipelineStep]);

  // Phase 2b: Tab-specific pipeline steps (sequential, re-runs on tab switch)
  useEffect(() => {
    if (tabPipelineStep < 0 || tabPipelineStep >= TAB_PIPELINE_STEPS[activeTab].length) return;

    const delay = [400, 500, 400, 300][tabPipelineStep] ?? 400;
    const timeout = setTimeout(() => {
      setTabCompletedSteps((prev) => [...prev, tabPipelineStep]);

      if (tabPipelineStep < TAB_PIPELINE_STEPS[activeTab].length - 1) {
        setTabPipelineStep(tabPipelineStep + 1);
      } else {
        // All tab steps done — show result
        setTimeout(() => setShowResult(true), 300);
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [tabPipelineStep, activeTab]);

  // Phase 3: Code line reveal (starts when showCode is set)
  useEffect(() => {
    if (!showCode) return;
    const totalLines = TABS[activeTab].code.split("\n").length;
    setVisibleLines(0);
    let line = 0;
    const interval = setInterval(() => {
      line += 2;
      setVisibleLines(line);
      if (line >= totalLines) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [showCode, activeTab]);

  // Phase 4: Result items reveal (resets on tab switch)
  useEffect(() => {
    if (!showResult) return;
    setVisibleResultItems(0);
    let count = 0;
    const total = TAB_RESULTS[activeTab].items.length;
    const interval = setInterval(() => {
      count++;
      setVisibleResultItems(count);
      if (count >= total) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, [showResult, activeTab]);

  const lines = TABS[activeTab].code.split("\n");

  return (
    <div
      ref={ref}
      className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-neutral-800/60 shadow-[0_20px_80px_rgba(0,0,0,0.6)] bg-[#0a0a0a]"
    >
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
        {/* Left panel */}
        <div className="border-b md:border-b-0 md:border-r border-neutral-800/60 p-5 flex flex-col">
          <div className="text-[11px] text-neutral-600 font-mono mb-4 uppercase tracking-wider">
            Your prompt
          </div>

          {/* User bubble */}
          {typedChat && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-neutral-300 leading-relaxed">
              {typedChat}
              {typedChat.length < CHAT_MESSAGE.length && (
                <span className="inline-block w-[2px] h-4 bg-blue-400 ml-0.5 animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Pipeline steps */}
          {pipelineStep >= 0 && (
            <div className="mt-4 space-y-1.5">
              {/* Initial pipeline (collapses once done) */}
              {!initialDone
                ? INITIAL_PIPELINE_STEPS.map((step: string, i: number) => {
                    if (i > pipelineStep) return null;
                    const done = completedSteps.includes(i);
                    return (
                      <div
                        key={`init-${step}`}
                        className="flex items-center gap-2 text-xs animate-[fadeSlideUp_0.3s_ease]"
                      >
                        {done ? (
                          <span className="text-emerald-400 w-4 text-center">
                            ✓
                          </span>
                        ) : (
                          <span className="w-4 text-center text-yellow-400 animate-pulse">
                            ●
                          </span>
                        )}
                        <span
                          className={
                            done ? "text-neutral-400" : "text-neutral-500"
                          }
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })
                : (
                  <>
                    {/* Collapsed summary of initial steps */}
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <span className="text-emerald-400 w-4 text-center">✓</span>
                      <span>Pipeline complete</span>
                    </div>
                    {/* Tab-specific pipeline steps */}
                    {TAB_PIPELINE_STEPS[activeTab].map((step: string, i: number) => {
                      if (i > tabPipelineStep) return null;
                      const done = tabCompletedSteps.includes(i);
                      return (
                        <div
                          key={`tab-${step}`}
                          className="flex items-center gap-2 text-xs animate-[fadeSlideUp_0.3s_ease]"
                        >
                          {done ? (
                            <span className="text-emerald-400 w-4 text-center">
                              ✓
                            </span>
                          ) : (
                            <span className="w-4 text-center text-yellow-400 animate-pulse">
                              ●
                            </span>
                          )}
                          <span
                            className={
                              done ? "text-neutral-400" : "text-neutral-500"
                            }
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
            </div>
          )}

          {/* Result: Tab-specific results */}
          {showResult && (
            <div className="mt-4 pt-4 border-t border-neutral-800/60 animate-[fadeSlideUp_0.4s_ease]">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-semibold">
                  Compiled · 0 errors
                </span>
              </div>

              <div className="text-[11px] text-neutral-600 font-mono mb-2 uppercase tracking-wider">
                {TAB_RESULTS[activeTab].title}
              </div>
              <div className="space-y-1">
                {TAB_RESULTS[activeTab].items.slice(0, visibleResultItems).map((item) => (
                  <div
                    key={item.label + item.value}
                    className="flex items-center gap-2 text-xs font-mono animate-[fadeSlideUp_0.2s_ease]"
                  >
                    <span className="w-16 text-right font-semibold text-neutral-400">
                      {item.label}
                    </span>
                    <span className="text-neutral-500">{item.value}</span>
                  </div>
                ))}
                {visibleResultItems >= TAB_RESULTS[activeTab].items.length && (
                  <div className="text-[10px] text-neutral-700 mt-2">
                    {TAB_RESULTS[activeTab].extra}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Code */}
        <div className="flex flex-col min-h-[420px]">
          {/* Tab bar */}
          <div className="flex items-center gap-0 border-b border-neutral-800/60 bg-[#0d0d0d]">
            {TABS.map((tab, i) => (
              <button
                key={tab.name}
                onClick={() => {
                  if (!showCode || activeTab === i) return;
                  setActiveTab(i);
                  setVisibleLines(0);
                  setShowResult(false);
                  setVisibleResultItems(0);
                  setTabPipelineStep(-1);
                  setTabCompletedSteps([]);
                  setTimeout(() => setTabPipelineStep(0), 200);
                }}
                className={`px-4 py-2.5 text-xs font-mono transition-colors border-b-2 ${
                  activeTab === i
                    ? "text-white border-blue-400 bg-[#0a0a0a]"
                    : "text-neutral-600 border-transparent hover:text-neutral-400"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Code content */}
          <div className="flex-1 p-4 overflow-auto">
            {showCode ? (
              <pre className="font-mono text-xs leading-[1.7] text-neutral-400">
                {lines.slice(0, visibleLines).map((line, i) => (
                  <div key={i} className="flex">
                    <span className="text-neutral-700 select-none w-8 text-right mr-4 shrink-0">
                      {i + 1}
                    </span>
                    <HighlightedLine text={line} />
                  </div>
                ))}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-700 text-sm font-mono">
                {pipelineStep >= 0
                  ? "Generating..."
                  : "Waiting for prompt..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
