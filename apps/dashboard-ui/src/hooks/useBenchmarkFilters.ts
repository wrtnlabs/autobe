import { useMemo, useState } from "react";

import type { BenchmarkData, BenchmarkEntry, Grade } from "../types/benchmark";

interface UseBenchmarkFiltersResult {
  filteredEntries: BenchmarkEntry[];
  selectedModels: string[];
  selectedProjects: string[];
  selectedGrades: Grade[];
  setSelectedModels: (models: string[]) => void;
  setSelectedProjects: (projects: string[]) => void;
  setSelectedGrades: (grades: Grade[]) => void;
}

export function useBenchmarkFilters(
  data: BenchmarkData | null,
): UseBenchmarkFiltersResult {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<Grade[]>([]);

  const filteredEntries = useMemo(() => {
    if (!data) return [];
    return data.entries.filter((entry) => {
      if (selectedModels.length > 0 && !selectedModels.includes(entry.model))
        return false;
      if (
        selectedProjects.length > 0 &&
        !selectedProjects.includes(entry.project)
      )
        return false;
      if (selectedGrades.length > 0 && !selectedGrades.includes(entry.grade))
        return false;
      return true;
    });
  }, [data, selectedModels, selectedProjects, selectedGrades]);

  return {
    filteredEntries,
    selectedModels,
    selectedProjects,
    selectedGrades,
    setSelectedModels,
    setSelectedProjects,
    setSelectedGrades,
  };
}
