import {
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundVendor,
  IAutoBePlaygroundVendorModel,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { Add, Save } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { getConnection } from "../../utils/connection";

const LOCALE_SUGGESTIONS = [
  "en-US",
  "ko-KR",
  "ja-JP",
  "zh-CN",
  "zh-TW",
  "es-ES",
  "fr-FR",
  "de-DE",
];

const TIMEZONE_SUGGESTIONS = [
  Intl.DateTimeFormat().resolvedOptions().timeZone,
  "UTC",
  "America/New_York",
  "Europe/London",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Asia/Shanghai",
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

  // Mock mode
  benchmarks: IAutoBePlaygroundBenchmark[];
  mockMode: boolean;
  onMockModeChange: (enabled: boolean) => void;
  mockVendor: string | null;
  mockProject: string | null;
  onMockVendorChange: (vendor: string | null) => void;
  onMockProjectChange: (project: string | null) => void;
}

const CREATE_NEW_VENDOR_VALUE = "__create_new_vendor__";

export const VendorModelSelector = (props: IVendorModelSelectorProps) => {
  const [vendors, setVendors] = useState<IAutoBePlaygroundVendor[]>([]);
  const [models, setModels] = useState<IAutoBePlaygroundVendorModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Vendor creation dialog
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [vendorSaving, setVendorSaving] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: "",
    apiKey: "",
    baseURL: "",
    semaphore: 16,
  });

  const loadVendors = () =>
    pApi.functional.autobe.playground.vendors
      .index(getConnection(), {})
      .then((page) => setVendors(page.data))
      .catch(console.error);

  // Load vendors on mount
  useEffect(() => {
    loadVendors();
  }, []);

  const handleOpenCreateVendor = () => {
    setVendorForm({ name: "", apiKey: "", baseURL: "", semaphore: 16 });
    setVendorDialogOpen(true);
  };

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

  // Load models when vendor changes
  useEffect(() => {
    if (!props.selectedVendorId) {
      setModels([]);
      return;
    }
    setLoadingModels(true);
    pApi.functional.autobe.playground.vendors.models
      .index(getConnection(), props.selectedVendorId)
      .then(setModels)
      .catch(console.error)
      .finally(() => setLoadingModels(false));
  }, [props.selectedVendorId]);

  // Derive project list from selected mock vendor
  const selectedBenchmark = props.benchmarks.find(
    (b) => b.vendor === props.mockVendor,
  );
  const mockProjects = selectedBenchmark?.replays.map((r) => r.project) ?? [];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "3rem",
        textAlign: "center",
        gap: "1rem",
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, color: "#333", mb: 0.5 }}
      >
        Start a New Session
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "#666", maxWidth: 420, lineHeight: 1.6 }}
      >
        Select a vendor and model, then type your first message to begin.
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 360, width: "100%", mt: 1 }}>
        {/* Vendor */}
        <FormControl fullWidth size="small">
          <InputLabel>Vendor</InputLabel>
          <Select
            value={props.selectedVendorId ?? ""}
            label="Vendor"
            onChange={(e) => {
              const value = e.target.value;
              if (value === CREATE_NEW_VENDOR_VALUE) {
                handleOpenCreateVendor();
                return;
              }
              props.onVendorChange(value || null);
              props.onModelChange(null);
            }}
          >
            <MenuItem value="">
              <em>Select a vendor...</em>
            </MenuItem>
            {vendors.map((v) => (
              <MenuItem key={v.id} value={v.id}>
                {v.name}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem value={CREATE_NEW_VENDOR_VALUE}>
              <Add sx={{ fontSize: 18, mr: 1 }} />
              Create a new vendor
            </MenuItem>
          </Select>
        </FormControl>

        {/* Model */}
        <Autocomplete
          freeSolo
          size="small"
          disabled={!props.selectedVendorId}
          options={models.map((m) => m.model)}
          loading={loadingModels}
          value={props.selectedModel ?? ""}
          onInputChange={(_, value) => props.onModelChange(value || null)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Model"
              placeholder="e.g. gpt-4.1"
            />
          )}
        />

        <Divider sx={{ my: 0.5 }} />

        {/* Locale */}
        <Autocomplete
          freeSolo
          size="small"
          options={LOCALE_SUGGESTIONS}
          value={props.locale}
          onInputChange={(_, value) => props.onLocaleChange(value)}
          renderInput={(params) => (
            <TextField {...params} label="Locale" placeholder="en-US" />
          )}
        />

        {/* Timezone */}
        <Autocomplete
          freeSolo
          size="small"
          options={TIMEZONE_SUGGESTIONS}
          value={props.timezone}
          onInputChange={(_, value) => props.onTimezoneChange(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Timezone"
              placeholder="Asia/Seoul"
            />
          )}
        />

        {/* Mock example data toggle */}
        {props.benchmarks.length > 0 && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={props.mockMode}
                  onChange={(_, checked) => props.onMockModeChange(checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: "#555" }}>
                  Use example data (mock)
                </Typography>
              }
            />

            {props.mockMode && (
              <>
                {/* Example Vendor */}
                <FormControl fullWidth size="small">
                  <InputLabel>Example Vendor</InputLabel>
                  <Select
                    value={props.mockVendor ?? ""}
                    label="Example Vendor"
                    onChange={(e) => {
                      props.onMockVendorChange(e.target.value || null);
                      props.onMockProjectChange(null);
                    }}
                  >
                    <MenuItem value="">
                      <em>Select a vendor...</em>
                    </MenuItem>
                    {props.benchmarks.map((b) => (
                      <MenuItem key={b.vendor} value={b.vendor}>
                        {b.emoji} {b.vendor}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Example Project */}
                <FormControl
                  fullWidth
                  size="small"
                  disabled={!props.mockVendor}
                >
                  <InputLabel>Example Project</InputLabel>
                  <Select
                    value={props.mockProject ?? ""}
                    label="Example Project"
                    onChange={(e) =>
                      props.onMockProjectChange(e.target.value || null)
                    }
                  >
                    <MenuItem value="">
                      <em>Select a project...</em>
                    </MenuItem>
                    {mockProjects.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </>
        )}
      </Stack>

      {vendors.length === 0 && (
        <Typography
          variant="caption"
          sx={{ color: "#999", mt: 1, display: "block" }}
        >
          No vendors registered. Go to the Settings tab to add one.
        </Typography>
      )}

      {/* Create Vendor Dialog */}
      <Dialog
        open={vendorDialogOpen}
        onClose={() => setVendorDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create a New Vendor</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Vendor Name"
              value={vendorForm.name}
              onChange={(e) =>
                setVendorForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="My OpenAI"
              required
            />
            <TextField
              fullWidth
              size="small"
              label="Base URL"
              value={vendorForm.baseURL}
              onChange={(e) =>
                setVendorForm((f) => ({ ...f, baseURL: e.target.value }))
              }
              placeholder="https://api.openai.com/v1"
            />
            <TextField
              fullWidth
              size="small"
              label="Concurrency Limit"
              type="number"
              value={vendorForm.semaphore}
              onChange={(e) =>
                setVendorForm((f) => ({
                  ...f,
                  semaphore: parseInt(e.target.value) || 16,
                }))
              }
              slotProps={{ htmlInput: { min: 1, max: 100 } }}
            />
            <TextField
              fullWidth
              size="small"
              label="API Key"
              value={vendorForm.apiKey}
              onChange={(e) =>
                setVendorForm((f) => ({ ...f, apiKey: e.target.value }))
              }
              placeholder="sk-..."
              required
              type="password"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setVendorDialogOpen(false)}
            disabled={vendorSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveVendor}
            variant="contained"
            disabled={vendorSaving || !vendorForm.name || !vendorForm.apiKey}
            startIcon={
              vendorSaving ? <CircularProgress size={16} /> : <Save />
            }
          >
            {vendorSaving ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
