import {
  IAutoBePlaygroundConfig,
  IAutoBePlaygroundVendor,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import {
  Add,
  Delete,
  Edit,
  Save,
} from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { getConnection, getServerUrl } from "../../utils/connection";
import { invalidateGlobalConfigCache } from "../../utils/globalConfig";

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

export const AutoBePlaygroundSettingsMovie = () => {
  const theme = useTheme();

  // Loading
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Config form state
  const [locale, setLocale] = useState("en-US");
  const [timezone, setTimezone] = useState("UTC");
  const [defaultVendorId, setDefaultVendorId] = useState<string | null>(null);
  const [defaultModel, setDefaultModel] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState(getServerUrl());

  // Vendors
  const [vendors, setVendors] = useState<IAutoBePlaygroundVendor[]>([]);

  // Vendor dialog
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<IAutoBePlaygroundVendor | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: "",
    apiKey: "",
    baseURL: "",
    semaphore: 16,
  });
  const [vendorSaving, setVendorSaving] = useState(false);

  // Feedback
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const showMessage = (message: string, severity: "success" | "error") =>
    setSnackbar({ open: true, message, severity });

  const loadVendors = useCallback(async () => {
    try {
      const page = await pApi.functional.autobe.playground.vendors.index(
        getConnection(),
        {},
      );
      setVendors(page.data);
    } catch {
      /* ignore */
    }
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
        showMessage("Failed to load settings from server", "error");
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
        locale,
        timezone,
        default_vendor_id: defaultVendorId as any,
        default_model: defaultModel,
      };
      await pApi.functional.autobe.playground.config.update(
        getConnection(),
        body,
      );
      invalidateGlobalConfigCache();
      showMessage("Settings saved", "success");
    } catch {
      showMessage("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // ---- Vendor CRUD ----
  const handleOpenCreateVendor = () => {
    setEditingVendor(null);
    setVendorForm({ name: "", apiKey: "", baseURL: "", semaphore: 16 });
    setVendorDialogOpen(true);
  };

  const handleOpenEditVendor = (v: IAutoBePlaygroundVendor) => {
    setEditingVendor(v);
    setVendorForm({
      name: v.name,
      apiKey: "",
      baseURL: "",
      semaphore: v.semaphore,
    });
    setVendorDialogOpen(true);
  };

  const handleSaveVendor = async () => {
    setVendorSaving(true);
    try {
      if (editingVendor) {
        await pApi.functional.autobe.playground.vendors.update(
          getConnection(),
          editingVendor.id as any,
          {
            name: vendorForm.name,
            apiKey: vendorForm.apiKey || undefined,
            baseURL: vendorForm.baseURL || null,
            semaphore: vendorForm.semaphore,
          },
        );
        showMessage(`Vendor "${vendorForm.name}" updated`, "success");
      } else {
        if (!vendorForm.apiKey) {
          showMessage("API Key is required for new vendors", "error");
          setVendorSaving(false);
          return;
        }
        await pApi.functional.autobe.playground.vendors.create(
          getConnection(),
          {
            name: vendorForm.name,
            apiKey: vendorForm.apiKey,
            baseURL: vendorForm.baseURL || null,
            semaphore: vendorForm.semaphore,
          },
        );
        showMessage(`Vendor "${vendorForm.name}" created`, "success");
      }
      setVendorDialogOpen(false);
      await loadVendors();
    } catch {
      showMessage("Failed to save vendor", "error");
    } finally {
      setVendorSaving(false);
    }
  };

  const handleDeleteVendor = async (v: IAutoBePlaygroundVendor) => {
    try {
      await pApi.functional.autobe.playground.vendors.erase(
        getConnection(),
        v.id as any,
      );
      showMessage(`Vendor "${v.name}" deleted`, "success");
      if (defaultVendorId === v.id) setDefaultVendorId(null);
      await loadVendors();
    } catch {
      showMessage("Failed to delete vendor", "error");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 12,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        bgcolor: theme.palette.background.default,
      }}
    >
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Playground Settings
        </Typography>

        <Stack spacing={3}>
          {/* Server Connection */}
          <Card variant="outlined">
            <CardContent>
              <SectionTitle>Server Connection</SectionTitle>
              <TextField
                fullWidth
                size="small"
                label="Server URL"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://127.0.0.1:5890"
              />
            </CardContent>
          </Card>

          {/* Vendors */}
          <Card variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <SectionTitle sx={{ mb: 0 }}>Vendors</SectionTitle>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={handleOpenCreateVendor}
                >
                  Add
                </Button>
              </Stack>
              {vendors.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", py: 2, textAlign: "center" }}
                >
                  No vendors registered. Add one to get started.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {vendors.map((v) => (
                    <ListItem
                      key={v.id}
                      secondaryAction={
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditVendor(v)}
                            >
                              <Edit sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteVendor(v)}
                              sx={{
                                "&:hover": {
                                  color: theme.palette.error.main,
                                },
                              }}
                            >
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      }
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        bgcolor: alpha(theme.palette.action.hover, 0.04),
                      }}
                    >
                      <ListItemText
                        primary={v.name}
                        secondary={`Concurrency: ${v.semaphore}`}
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: 500,
                        }}
                        secondaryTypographyProps={{
                          variant: "caption",
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Localization */}
          <Card variant="outlined">
            <CardContent>
              <SectionTitle>Localization</SectionTitle>
              <Stack spacing={2}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={LOCALE_SUGGESTIONS}
                  value={locale}
                  onInputChange={(_, value) => setLocale(value)}
                  renderInput={(params) => (
                    <TextField {...params} label="Locale" placeholder="en-US" />
                  )}
                />
                <Autocomplete
                  freeSolo
                  size="small"
                  options={[
                    browserTimezone,
                    "UTC",
                    "America/New_York",
                    "Europe/London",
                    "Asia/Seoul",
                    "Asia/Tokyo",
                  ]}
                  value={timezone}
                  onInputChange={(_, value) => setTimezone(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Timezone"
                      placeholder="UTC"
                      helperText={`Browser timezone: ${browserTimezone}`}
                    />
                  )}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Default Vendor & Model */}
          <Card variant="outlined">
            <CardContent>
              <SectionTitle>Default Vendor & Model</SectionTitle>
              <Typography
                variant="caption"
                sx={{ display: "block", mb: 2, color: "text.secondary" }}
              >
                Pre-fills the vendor and model selection on the chat page for new sessions.
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Default Vendor</InputLabel>
                  <Select
                    value={defaultVendorId ?? ""}
                    label="Default Vendor"
                    onChange={(e) =>
                      setDefaultVendorId(e.target.value || null)
                    }
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {vendors.map((v) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  size="small"
                  label="Default Model"
                  value={defaultModel ?? ""}
                  onChange={(e) => setDefaultModel(e.target.value || null)}
                  placeholder="gpt-4.1"
                />
              </Stack>
            </CardContent>
          </Card>

          <Divider />

          {/* Save Config */}
          <Button
            variant="contained"
            size="large"
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Save />
              )
            }
            onClick={handleSaveConfig}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </Stack>
      </Container>

      {/* Vendor Create / Edit Dialog */}
      <Dialog
        open={vendorDialogOpen}
        onClose={() => setVendorDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editingVendor ? `Edit "${editingVendor.name}"` : "Add Vendor"}
        </DialogTitle>
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
              label={
                editingVendor
                  ? "API Key (leave empty to keep current)"
                  : "API Key"
              }
              value={vendorForm.apiKey}
              onChange={(e) =>
                setVendorForm((f) => ({ ...f, apiKey: e.target.value }))
              }
              placeholder="sk-..."
              required={!editingVendor}
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
            disabled={vendorSaving || !vendorForm.name}
            startIcon={
              vendorSaving ? <CircularProgress size={16} /> : <Save />
            }
          >
            {vendorSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const SectionTitle = (
  props: { children: React.ReactNode } & Record<string, any>,
) => (
  <Typography
    variant="subtitle2"
    {...props}
    sx={{
      mb: 2,
      color: "text.secondary",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      ...props.sx,
    }}
  />
);
