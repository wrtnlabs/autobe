import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ThemeContextProvider } from "./theme/ThemeContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { BenchmarkPage } from "./pages/BenchmarkPage";
import { BenchmarkModelDetailPage } from "./pages/BenchmarkModelDetailPage";
import { BenchmarkComparePage } from "./pages/BenchmarkComparePage";
import { BenchmarkProjectDetailPage } from "./pages/BenchmarkProjectDetailPage";
import { MonitoringPage } from "./pages/MonitoringPage";
import { SettingsPage } from "./pages/SettingsPage";

export function AutoBeDashboardApplication() {
  return (
    <ThemeContextProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/benchmark" replace />} />
            <Route path="/benchmark" element={<BenchmarkPage />} />
            <Route
              path="/benchmark/compare"
              element={<BenchmarkComparePage />}
            />
            <Route
              path="/benchmark/:model"
              element={<BenchmarkModelDetailPage />}
            />
            <Route
              path="/benchmark/:model/:project"
              element={<BenchmarkProjectDetailPage />}
            />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeContextProvider>
  );
}
