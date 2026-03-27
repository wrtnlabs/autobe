import { BenchmarkDashboard } from "../../components/benchmark/BenchmarkDashboard";

export const metadata = {
  title: "Benchmark - AutoBE",
  description: "AutoBE multi-model benchmark results across projects",
};

export default function BenchmarkPage() {
  return <BenchmarkDashboard />;
}
