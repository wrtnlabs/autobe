import { AutoBeReplayComputer } from "@autobe/benchmark";
import { TestValidator } from "@nestia/e2e";

export const test_benchmark_compare_vendors = (): void => {
  // same family, different main param size → bigger first
  const qwenModels: string[] = [
    "qwen/qwen3.5-27b",
    "qwen/qwen3.5-122b-a10b",
    "qwen/qwen3.5-35b-a3b",
    "qwen/qwen3.5-397b-a17b",
  ];
  const sortedQwen = [...qwenModels].sort(AutoBeReplayComputer.compareVendors);
  TestValidator.equals("qwen models sorted by param size desc", sortedQwen, [
    "qwen/qwen3.5-397b-a17b",
    "qwen/qwen3.5-122b-a10b",
    "qwen/qwen3.5-35b-a3b",
    "qwen/qwen3.5-27b",
  ]);

  // same main param, different active param → bigger active first
  const moeModels: string[] = [
    "qwen/qwen3.5-397b-a10b",
    "qwen/qwen3.5-397b-a17b",
    "qwen/qwen3.5-397b-a3b",
  ];
  const sortedMoe = [...moeModels].sort(AutoBeReplayComputer.compareVendors);
  TestValidator.equals("moe active param desc", sortedMoe, [
    "qwen/qwen3.5-397b-a17b",
    "qwen/qwen3.5-397b-a10b",
    "qwen/qwen3.5-397b-a3b",
  ]);

  // different vendors → alphabetical
  const diffVendors: string[] = [
    "z-ai/glm-5",
    "openai/gpt-5.4",
    "anthropic/claude-sonnet-4.6",
  ];
  const sortedVendors = [...diffVendors].sort(
    AutoBeReplayComputer.compareVendors,
  );
  TestValidator.equals("different vendors alphabetical", sortedVendors, [
    "anthropic/claude-sonnet-4.6",
    "openai/gpt-5.4",
    "z-ai/glm-5",
  ]);

  // same vendor, model variant with more parts comes after
  const openaiModels: string[] = [
    "openai/gpt-5.4-nano",
    "openai/gpt-5.4-mini",
    "openai/gpt-5.4",
  ];
  const sortedOpenai = [...openaiModels].sort(
    AutoBeReplayComputer.compareVendors,
  );
  TestValidator.equals("openai variants", sortedOpenai, [
    "openai/gpt-5.4",
    "openai/gpt-5.4-mini",
    "openai/gpt-5.4-nano",
  ]);

  // full mixed list (simulating real benchmark data)
  const allModels: string[] = [
    "qwen/qwen3.5-27b",
    "anthropic/claude-sonnet-4.6",
    "z-ai/glm-5",
    "openai/gpt-5.4-nano",
    "qwen/qwen3.5-397b-a17b",
    "openai/gpt-5.4",
    "qwen/qwen3.5-35b-a3b",
    "qwen/qwen3.5-122b-a10b",
  ];
  const sortedAll = [...allModels].sort(AutoBeReplayComputer.compareVendors);
  TestValidator.equals("full mixed sort", sortedAll, [
    "anthropic/claude-sonnet-4.6",
    "openai/gpt-5.4",
    "openai/gpt-5.4-nano",
    "qwen/qwen3.5-397b-a17b",
    "qwen/qwen3.5-122b-a10b",
    "qwen/qwen3.5-35b-a3b",
    "qwen/qwen3.5-27b",
    "z-ai/glm-5",
  ]);

  // version numbers parsed as numbers → descending (4.6 before 3.5)
  TestValidator.equals(
    "version 4.6 before 3.5",
    AutoBeReplayComputer.compareVendors(
      "anthropic/claude-sonnet-4.6",
      "anthropic/claude-sonnet-3.5",
    ) < 0,
    true,
  );
};
