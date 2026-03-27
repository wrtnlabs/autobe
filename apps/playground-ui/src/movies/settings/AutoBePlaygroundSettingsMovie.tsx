import {
  IAutoBePlaygroundConfig,
  IAutoBePlaygroundVendor,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/utils";

import { getConnection, getServerUrl } from "../../utils/connection";
import { invalidateGlobalConfigCache } from "../../utils/globalConfig";

const VENDOR_TEMPLATES = [
  { name: "OpenAI", baseURL: "https://api.openai.com/v1" },
  { name: "OpenRouter", baseURL: "https://openrouter.ai/api/v1" },
  { name: "Ollama", baseURL: "http://localhost:11434/v1", apiKey: "autobe" },
  { name: "LM Studio", baseURL: "http://localhost:1234/v1", apiKey: "autobe" },
];

const LOCALE_SUGGESTIONS = [
  "en-US", "ko-KR", "ja-JP", "zh-CN", "zh-TW", "es-ES", "fr-FR", "de-DE",
];

export const AutoBePlaygroundSettingsMovie = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locale, setLocale] = useState("en-US");
  const [timezone, setTimezone] = useState("UTC");
  const [defaultVendorId, setDefaultVendorId] = useState<string | null>(null);
  const [defaultModel, setDefaultModel] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState(getServerUrl());
  const [vendors, setVendors] = useState<IAutoBePlaygroundVendor[]>([]);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<IAutoBePlaygroundVendor | null>(null);
  const [vendorForm, setVendorForm] = useState({ name: "", apiKey: "", baseURL: "", semaphore: 16 });
  const [vendorSaving, setVendorSaving] = useState(false);

  const loadVendors = useCallback(async () => {
    try {
      const page = await pApi.functional.autobe.playground.vendors.index(getConnection(), {});
      setVendors(page.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const conn = getConnection();
        const [cfg] = await Promise.all([
          pApi.functional.autobe.playground.config.get(conn),
          loadVendors(),
        ]);
        setLocale(cfg.locale);
        setTimezone(cfg.timezone);
        setDefaultVendorId(cfg.default_vendor_id);
        setDefaultModel(cfg.default_model);
      } catch (err) {
        console.error("Failed to load settings:", err);
        toast.error("Failed to load settings from server");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loadVendors]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      localStorage.setItem("autobe_server_url", serverUrl);
      const body: IAutoBePlaygroundConfig.IUpdate = {
        locale, timezone,
        default_vendor_id: defaultVendorId as any,
        default_model: defaultModel,
      };
      await pApi.functional.autobe.playground.config.update(getConnection(), body);
      invalidateGlobalConfigCache();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateVendor = () => {
    setEditingVendor(null);
    setVendorForm({ name: "", apiKey: "", baseURL: "", semaphore: 16 });
    setVendorDialogOpen(true);
  };

  const handleOpenEditVendor = (v: IAutoBePlaygroundVendor) => {
    setEditingVendor(v);
    setVendorForm({ name: v.name, apiKey: "", baseURL: "", semaphore: v.semaphore });
    setVendorDialogOpen(true);
  };

  const handleSaveVendor = async () => {
    setVendorSaving(true);
    try {
      if (editingVendor) {
        await pApi.functional.autobe.playground.vendors.update(getConnection(), editingVendor.id as any, {
          name: vendorForm.name,
          apiKey: vendorForm.apiKey || undefined,
          baseURL: vendorForm.baseURL || null,
          semaphore: vendorForm.semaphore,
        });
        toast.success(`Vendor "${vendorForm.name}" updated`);
      } else {
        if (!vendorForm.apiKey) {
          toast.error("API Key is required for new vendors");
          setVendorSaving(false);
          return;
        }
        await pApi.functional.autobe.playground.vendors.create(getConnection(), {
          name: vendorForm.name,
          apiKey: vendorForm.apiKey,
          baseURL: vendorForm.baseURL || null,
          semaphore: vendorForm.semaphore,
        });
        toast.success(`Vendor "${vendorForm.name}" created`);
      }
      setVendorDialogOpen(false);
      await loadVendors();
    } catch {
      toast.error("Failed to save vendor");
    } finally {
      setVendorSaving(false);
    }
  };

  const handleDeleteVendor = async (v: IAutoBePlaygroundVendor) => {
    try {
      await pApi.functional.autobe.playground.vendors.erase(getConnection(), v.id as any);
      toast.success(`Vendor "${v.name}" deleted`);
      if (defaultVendorId === v.id) setDefaultVendorId(null);
      await loadVendors();
    } catch {
      toast.error("Failed to delete vendor");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="w-full h-full overflow-auto bg-background">
      <div className="mx-auto max-w-md px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Playground Settings</h2>

        <div className="space-y-6">
          {/* Server Connection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Server Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Server URL</Label>
                <Input
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://127.0.0.1:5890"
                />
              </div>
            </CardContent>
          </Card>

          {/* Vendors */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Vendors
                </CardTitle>
                <Button size="sm" variant="outline" onClick={handleOpenCreateVendor}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {vendors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No vendors registered. Add one to get started.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {vendors.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Concurrency: {v.semaphore}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleOpenEditVendor(v)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:text-destructive"
                                onClick={() => handleDeleteVendor(v)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Localization */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Localization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Locale</Label>
                <Input
                  placeholder="en-US"
                  list="settings-locale-list"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                />
                <datalist id="settings-locale-list">
                  {LOCALE_SUGGESTIONS.map((l) => <option key={l} value={l} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input
                  placeholder="UTC"
                  list="settings-timezone-list"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
                <datalist id="settings-timezone-list">
                  {[browserTimezone, "UTC", "America/New_York", "Europe/London", "Asia/Seoul", "Asia/Tokyo"].map(
                    (t) => <option key={t} value={t} />,
                  )}
                </datalist>
                <p className="text-xs text-muted-foreground">
                  Browser timezone: {browserTimezone}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Default Vendor & Model */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Default Vendor & Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Pre-fills the vendor and model selection on the chat page for new sessions.
              </p>
              <div className="space-y-2">
                <Label>Default Vendor</Label>
                <Select
                  value={defaultVendorId ?? "__none__"}
                  onValueChange={(v) => setDefaultVendorId(v === "__none__" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Model</Label>
                <Input
                  placeholder="gpt-4.1"
                  value={defaultModel ?? ""}
                  onChange={(e) => setDefaultModel(e.target.value || null)}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Button
            size="lg"
            className="w-full"
            onClick={handleSaveConfig}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Vendor Create / Edit Dialog */}
      <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? `Edit "${editingVendor.name}"` : "Add Vendor"}
            </DialogTitle>
            <DialogDescription>
              {editingVendor
                ? "Update vendor settings."
                : "Add a new AI vendor with API credentials."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editingVendor && (
              <>
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
              </>
            )}
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
              <Label>
                {editingVendor ? "API Key (leave empty to keep current)" : "API Key"}
              </Label>
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
            <Button onClick={handleSaveVendor} disabled={vendorSaving || !vendorForm.name}>
              {vendorSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              {vendorSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
