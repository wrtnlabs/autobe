import { BenchmarkDashboard } from "../../components/benchmark/BenchmarkDashboard";

export const metadata = {
  title: "Estimate - AutoBE",
  description: "AutoBE multi-model estimate results across projects",
};

export default function BenchmarkPage() {
  return <BenchmarkDashboard />;
}
