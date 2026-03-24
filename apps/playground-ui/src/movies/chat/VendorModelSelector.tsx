import {
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundVendor,
  IAutoBePlaygroundVendorModel,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { Info, Loader2, Plus, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/utils";

import { getConnection } from "../../utils/connection";

const VENDOR_TEMPLATES = [
  { name: "OpenAI", baseURL: "https://api.openai.com/v1" },
  { name: "OpenRouter", baseURL: "https://openrouter.ai/api/v1" },
  { name: "Ollama", baseURL: "http://localhost:11434/v1", apiKey: "autobe" },
  { name: "LM Studio", baseURL: "http://localhost:1234/v1", apiKey: "autobe" },
];

const LOCALE_SUGGESTIONS = [
  "en-US", "ko-KR", "ja-JP", "zh-CN", "zh-TW", "es-ES", "fr-FR", "de-DE",
];

const TIMEZONE_SUGGESTIONS = [
  Intl.DateTimeFormat().resolvedOptions().timeZone,
  "UTC", "America/New_York", "Europe/London", "Asia/Seoul", "Asia/Tokyo", "Asia/Shanghai",
];

export interface IVendorModelSelectorProps {
  selectedVendorId: string | null;
  selectedModel: string | null;
  locale: string;
  timezone: string;
  onVendorChange: (vendorId: string | null) => void;
  onModelChange: (model: string | null) => void;
  onLocaleChange: (locale: string) => void;
  onTimezoneChange: (timezone: string) => void;
  benchmarks: IAutoBePlaygroundBenchmark[];
  mockMode: boolean;
  onMockModeChange: (enabled: boolean) => void;
  mockVendor: string | null;
  mockProject: string | null;
  onMockVendorChange: (vendor: string | null) => void;
  onMockProjectChange: (project: string | null) => void;
}

export const VendorModelSelector = (props: IVendorModelSelectorProps) => {
  const [vendors, setVendors] = useState<IAutoBePlaygroundVendor[]>([]);
  const [models, setModels] = useState<IAutoBePlaygroundVendorModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [vendorSaving, setVendorSaving] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: "", apiKey: "", baseURL: "", semaphore: 16,
  });

  const loadVendors = () =>
    pApi.functional.autobe.playground.vendors
      .index(getConnection(), {})
      .then((page) => setVendors(page.data))
      .catch(console.error);

  useEffect(() => { loadVendors(); }, []);

  const handleSaveVendor = async () => {
    if (!vendorForm.name || !vendorForm.apiKey) return;
    setVendorSaving(true);
    try {
      const created = await pApi.functional.autobe.playground.vendors.create(
        getConnection(),
        {
          name: vendorForm.name,
          apiKey: vendorForm.apiKey,
          baseURL: vendorForm.baseURL || null,
          semaphore: vendorForm.semaphore,
        },
      );
      setVendorDialogOpen(false);
      await loadVendors();
      props.onVendorChange(created.id);
      props.onModelChange(null);
    } catch (err) {
      console.error("Failed to create vendor:", err);
    } finally {
      setVendorSaving(false);
    }
  };

  useEffect(() => {
    if (!props.selectedVendorId) { setModels([]); return; }
    setLoadingModels(true);
    pApi.functional.autobe.playground.vendors.models
      .index(getConnection(), props.selectedVendorId)
      .then(setModels)
      .catch(console.error)
      .finally(() => setLoadingModels(false));
  }, [props.selectedVendorId]);

  const selectedBenchmark = props.benchmarks.find((b) => b.vendor === props.mockVendor);
  const mockReplays = selectedBenchmark?.replays ?? [];

  const PHASES = ["analyze", "database", "interface", "test", "realize"] as const;
  const getReplayStatus = (r: (typeof mockReplays)[number]) => {
    const done = PHASES.filter((p) => r[p]?.success).length;
    const score = selectedBenchmark?.score[r.project as keyof typeof selectedBenchmark.score];
    return { done, score: typeof score === "number" ? score : null };
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10">
      {/* Hero */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-3">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Start a New Session
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 whitespace-nowrap">
          Select a vendor and model to begin.
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-[400px] rounded-xl border bg-card text-card-foreground shadow-sm text-left">
        {/* Section: AI Provider */}
        <div className="p-4 space-y-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            AI Provider
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">Vendor</Label>
            <Select
              value={props.selectedVendorId ?? ""}
              onValueChange={(v) => {
                if (v === "__create__") {
                  setVendorForm({ name: "", apiKey: "", baseURL: "", semaphore: 16 });
                  setVendorDialogOpen(true);
                  return;
                }
                props.onVendorChange(v || null);
                props.onModelChange(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vendor..." />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value="__create__">
                  <span className="flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Create a new vendor</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Model</Label>
            <Input
              placeholder={loadingModels ? "Loading models..." : "e.g. gpt-4.1"}
              list="model-suggestions"
              value={props.selectedModel ?? ""}
              onChange={(e) => props.onModelChange(e.target.value || null)}
              disabled={!props.selectedVendorId}
            />
            <datalist id="model-suggestions">
              {models.map((m) => (
                <option key={m.model} value={m.model} />
              ))}
            </datalist>
          </div>
        </div>

        <Separator />

        {/* Section: Localization */}
        <div className="p-4 space-y-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Localization
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Locale</Label>
              <Input
                placeholder="en-US"
                list="locale-suggestions"
                value={props.locale}
                onChange={(e) => props.onLocaleChange(e.target.value)}
              />
              <datalist id="locale-suggestions">
                {LOCALE_SUGGESTIONS.map((l) => <option key={l} value={l} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Timezone</Label>
              <Input
                placeholder="Asia/Seoul"
                list="timezone-suggestions"
                value={props.timezone}
                onChange={(e) => props.onTimezoneChange(e.target.value)}
              />
              <datalist id="timezone-suggestions">
                {TIMEZONE_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>
          </div>
        </div>

        {/* Section: Mock Mode (conditional) */}
        {props.benchmarks.length > 0 && (
          <>
            <Separator />
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Simulation
                </p>
                <Switch
                  checked={props.mockMode}
                  onCheckedChange={props.onMockModeChange}
                />
              </div>

              {props.mockMode && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Model</Label>
                    <Select
                      value={props.mockVendor ?? ""}
                      onValueChange={(v) => {
                        props.onMockVendorChange(v || null);
                        props.onMockProjectChange(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model..." />
                      </SelectTrigger>
                      <SelectContent>
                        {props.benchmarks.map((b) => (
                          <SelectItem key={b.vendor} value={b.vendor}>
                            {b.emoji} {b.vendor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Project</Label>
                    <Select
                      value={props.mockProject ?? ""}
                      onValueChange={(v) => props.onMockProjectChange(v || null)}
                      disabled={!props.mockVendor}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mockReplays.map((r) => {
                          const { done, score } = getReplayStatus(r);
                          const dotColor = done === 5 ? "bg-success" : done > 0 ? "bg-warning" : "bg-destructive";
                          const title = r.project.charAt(0).toUpperCase() + r.project.slice(1);
                          return (
                            <SelectItem key={r.project} value={r.project}>
                              <span className="flex items-center gap-2">
                                <span className={cn("inline-block h-2 w-2 rounded-full shrink-0", dotColor)} />
                                <span>{title}</span>
                                {score !== null && (
                                  <span className="text-muted-foreground">({score})</span>
                                )}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* No vendors warning */}
        {vendors.length === 0 && (
          <>
            <Separator />
            <div className="p-4">
              <div className="rounded-lg bg-warning/10 border border-warning/20 px-3 py-2.5 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">No vendors registered</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Go to Settings to add an AI vendor before starting.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Vendor Dialog */}
      <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Vendor</DialogTitle>
            <DialogDescription>
              Add your AI vendor credentials to start generating backends.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Template</Label>
              <div className="flex flex-wrap gap-1.5">
                {VENDOR_TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    className={cn(
                      "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      vendorForm.name === t.name && vendorForm.baseURL === t.baseURL
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground",
                    )}
                    onClick={() => setVendorForm((f) => ({ ...f, name: t.name, baseURL: t.baseURL, apiKey: t.apiKey ?? "" }))}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Vendor Name</Label>
              <Input
                placeholder="My OpenAI"
                value={vendorForm.name}
                onChange={(e) => setVendorForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                placeholder="https://api.openai.com/v1"
                value={vendorForm.baseURL}
                onChange={(e) => setVendorForm((f) => ({ ...f, baseURL: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Concurrency Limit</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={vendorForm.semaphore}
                onChange={(e) => setVendorForm((f) => ({ ...f, semaphore: parseInt(e.target.value) || 16 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={vendorForm.apiKey}
                onChange={(e) => setVendorForm((f) => ({ ...f, apiKey: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVendorDialogOpen(false)} disabled={vendorSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveVendor} disabled={vendorSaving || !vendorForm.name || !vendorForm.apiKey}>
              {vendorSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              {vendorSaving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
