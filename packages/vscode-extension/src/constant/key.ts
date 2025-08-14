import { AutoBeEvent } from "@autobe/interface";
import { misc } from "typia";

export const AUTOBE_API_KEY = "auto-be-api-key";
export const AUTOBE_CONFIG = "auto-be-config";
export const AUTOBE_EVENT_TYPES = misc.literals<AutoBeEvent.Type>();
export const AUTOBE_SESSION_STORAGE_FILE_NAME = "auto-be-session-storage.json";
