/**
 * @file Gzip utility for reading gzipped JSON files
 *
 *   For insert replay when develop this codes. if you want to the example
 *   conversate histories, you can use the this codes.
 */
import { AutoBeTokenUsage } from "@autobe/agent";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import zlib from "zlib";

import { Logger } from "../Logger";
import { Session } from "../core/autobe";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Compress string data to gzip buffer
 *
 * @param {string} value - String data to compress
 * @returns {Promise<Buffer>} Compressed gzip buffer
 */
export const compress = async (value: string): Promise<Buffer> => {
  const input: Buffer = Buffer.from(value);
  return gzip(input, {
    level: 9,
  });
};

/**
 * Decompress gzip buffer to string
 *
 * @param {Buffer} buffer - Gzip compressed buffer
 * @returns {Promise<string>} Decompressed string
 */
export const decompress = async (buffer: Buffer): Promise<string> => {
  const result: Buffer = await gunzip(buffer);
  return result.toString("utf8");
};

// ============================================================================
// REPLAY UTILITIES
// ============================================================================

/** Replay data types for AutoBe development */
export interface IReplaySessionData {
  history?: any[];
  events?: any[];
  tokenUsage?: any;
}

/** Replay session structure */
export interface IReplaySession {
  sessionId: string;
  history: any[];
  events: any[];
  tokenUsage: any;
}

/** File pair structure */
interface IFilePair {
  prefix: string;
  mainFile?: { filename: string; data: any };
  snapshotsFile?: { filename: string; data: any };
}

/**
 * Step 1: Filter files that match the conditions
 *
 * @param {string} directoryPath - Directory path to scan
 * @param {string} [filenameFilter] - Optional filename filter
 * @returns {Promise<string[]>} Array of matching filenames
 */
async function filterMatchingFiles(
  directoryPath: string,
  filenameFilter?: string,
): Promise<string[]> {
  try {
    const files = await fs.readdir(directoryPath);

    // Filter .json.gz files
    const jsonGzFiles = files
      .filter(
        (filename) =>
          filename.endsWith(".json.gz") ||
          filename.endsWith(".snapshots.json.gz"),
      )
      .filter(
        (filename) =>
          filename.replace(".json.gz", "").replace(".snapshots", "").split(".")
            .length === 2,
      );

    // Apply additional filename filter if provided
    if (filenameFilter) {
      return jsonGzFiles.filter((filename) =>
        filename.toLowerCase().includes(filenameFilter.toLowerCase()),
      );
    }

    return jsonGzFiles;
  } catch (error) {
    Logger.debug(`Failed to filter files in ${directoryPath}: ${error}`);
    return [];
  }
}

/**
 * Step 2: Unzip and collect file data
 *
 * @param {string} directoryPath - Directory path
 * @param {string[]} filenames - Array of filenames to process
 * @returns {Promise<Record<string, any>>} Object with filename as key and
 *   parsed data as value
 */
async function unzipAndCollectFiles(
  directoryPath: string,
  filenames: string[],
): Promise<Record<string, any>> {
  const fileData: Record<string, any> = {};

  for (const filename of filenames) {
    try {
      const filePath = path.join(directoryPath, filename);
      const buffer = await fs.readFile(filePath);
      const content = await decompress(buffer);
      const data = JSON.parse(content);

      fileData[filename] = data;
      Logger.debug(`Unzipped and parsed: ${filename}`);
    } catch (error) {
      Logger.debug(`Failed to process file ${filename}: ${error}`);
    }
  }

  return fileData;
}

/**
 * Step 3: Match history and events pairs
 *
 * @param {Record<string, any>} fileData - Object with filename as key and data
 *   as value
 * @returns {IFilePair[]} Array of file pairs
 */
function matchHistoryAndEventsPairs(
  fileData: Record<string, any>,
): IFilePair[] {
  const filePairs: IFilePair[] = [];
  const processedPrefixes = new Set<string>();

  for (const [filename, data] of Object.entries(fileData)) {
    // Extract prefix from filename
    const prefix = filename.replace(/\.(json\.gz|snapshots\.json\.gz)$/, "");

    // Skip if already processed
    if (processedPrefixes.has(prefix)) {
      continue;
    }

    const pair: IFilePair = { prefix };

    // Find main file (.json.gz but not .snapshots.json.gz)
    const mainFilename = `${prefix}.json.gz`;
    if (fileData[mainFilename]) {
      pair.mainFile = { filename: mainFilename, data: fileData[mainFilename] };
    }

    // Find snapshots file (.snapshots.json.gz)
    const snapshotsFilename = `${prefix}.snapshots.json.gz`;
    if (fileData[snapshotsFilename]) {
      pair.snapshotsFile = {
        filename: snapshotsFilename,
        data: fileData[snapshotsFilename],
      };
    }

    // Only add if at least one file exists
    if (pair.mainFile || pair.snapshotsFile) {
      filePairs.push(pair);
      processedPrefixes.add(prefix);
      Logger.debug(
        `Matched pair for prefix: ${prefix} [main: ${!!pair.mainFile}, snapshots: ${!!pair.snapshotsFile}]`,
      );
    }
  }

  return filePairs;
}

/**
 * Step 4: Create single session object from file pair
 *
 * @param {IFilePair} filePair - File pair with main and snapshots data
 * @returns {IReplaySession | null} Created session object or null if creation
 *   fails
 */
function createSessionObject(filePair: IFilePair): IReplaySession | null {
  const { prefix, mainFile, snapshotsFile } = filePair;

  // Extract history from main file only
  let history: any[] = [];

  if (mainFile) {
    const mainData = mainFile.data;
    if (mainData.histories && Array.isArray(mainData.histories)) {
      history = mainData.histories;
    } else if (mainData.history && Array.isArray(mainData.history)) {
      history = mainData.history;
    } else if (Array.isArray(mainData)) {
      history = mainData;
    }
  }

  // Extract events and tokenUsage from snapshots file only
  let events: any[] = [];
  let tokenUsage: any = null;

  if (snapshotsFile) {
    const snapshotsData = snapshotsFile.data;

    // Handle snapshots data structure: Array<{ event: IEvent, tokenUsage: ITokenUsage }>
    if (Array.isArray(snapshotsData)) {
      // Extract events and tokenUsage from each snapshot object
      events = snapshotsData
        .filter((item) => item && typeof item === "object")
        .map((item) => item.event)
        .filter((event) => event !== undefined);

      // Use the last tokenUsage from snapshots (most recent)
      const lastSnapshot = snapshotsData
        .filter((item) => item && typeof item === "object")
        .pop();
      tokenUsage = lastSnapshot?.tokenUsage || null;

      Logger.debug(
        `Parsed snapshots: ${events.length} events, tokenUsage: ${tokenUsage ? "found" : "not found"}`,
      );
    } else {
      // Fallback to old structure (though snapshots shouldn't have history)
      events = snapshotsData.events || [];
      tokenUsage = snapshotsData.tokenUsage || null;
    }

    history = [];
  }

  // Create session object
  const session: IReplaySession = {
    sessionId: `replay-${prefix}`,
    history,
    events,
    tokenUsage,
  };

  Logger.debug(
    `Created session: ${session.sessionId} (history: ${session.history.length}, events: ${session.events.length})`,
  );
  return session;
}

/**
 * Load all replay files from directory and create sessions from file pairs
 *
 * @param {string} replayDataPath - The path to the replay data directory
 * @param {string} [filenameFilter] - Optional string to filter files by
 *   filename (case-insensitive)
 * @returns {Promise<IReplaySession[]>} A promise that resolves to created
 *   replay sessions
 */
export async function loadReplaySessions(
  replayDataPath: string,
  filenameFilter?: string,
): Promise<IReplaySession[]> {
  try {
    Logger.debug(`Starting replay session loading from: ${replayDataPath}`);

    // Step 1: Filter files that match the conditions
    const matchingFiles = await filterMatchingFiles(
      replayDataPath,
      filenameFilter,
    );
    Logger.debug(`Step 1: Found ${matchingFiles.length} matching files`);

    if (matchingFiles.length === 0) {
      Logger.debug("No matching files found");
      return [];
    }

    // Step 2: Unzip and collect file data
    const fileData = await unzipAndCollectFiles(replayDataPath, matchingFiles);
    Logger.debug(
      `Step 2: Successfully processed ${Object.keys(fileData).length} files`,
    );

    // Step 3: Match history and events pairs
    const filePairs = matchHistoryAndEventsPairs(fileData);
    Logger.debug(`Step 3: Created ${filePairs.length} file pairs`);

    // Step 4: Create session objects
    const sessions: IReplaySession[] = [];
    for (const filePair of filePairs) {
      const session = createSessionObject(filePair);
      if (session) {
        sessions.push(session);
      }
    }

    Logger.debug(
      `Step 4: Created ${sessions.length} session objects${filenameFilter ? ` (filtered by: "${filenameFilter}")` : ""}`,
    );
    return sessions;
  } catch (error) {
    Logger.debug(
      `Failed to load replay sessions from ${replayDataPath}: ${error}`,
    );
    return [];
  }
}

/**
 * Load AutoBe replay sessions from the default test directory
 *
 * @example
 *   ```typescript
 *   // Load all sessions
 *   const allSessions = await loadAutoBeReplaySessions();
 *
 *   // Load only todo-backend sessions
 *   const todoSessions = await loadAutoBeReplaySessions("todo-backend");
 *
 *   // Load only test files
 *   const testSessions = await loadAutoBeReplaySessions("test");
 *   ```;
 *
 * @param {string} [filenameFilter] - Optional string to filter files by
 *   filename (case-insensitive)
 * @returns {Promise<IReplaySession[]>} A promise that resolves to created
 *   replay sessions
 */
export async function loadAutoBeReplaySessions(
  filenameFilter?: string,
): Promise<IReplaySession[]> {
  // Try .replay folder first (created during build)
  const replayFolderPath = path.join(__dirname, "../.replay");

  // Check if .replay folder exists
  if (
    await fs
      .access(replayFolderPath)
      .then(() => true)
      .catch(() => false)
  ) {
    Logger.debug(`Loading from .replay folder: ${replayFolderPath}`);
    try {
      const sessions = await loadReplaySessions(
        replayFolderPath,
        filenameFilter,
      );
      if (sessions.length > 0) {
        Logger.debug(
          `Successfully loaded ${sessions.length} sessions from .replay folder`,
        );
        return sessions;
      }
    } catch (error) {
      Logger.debug(`Failed to load from .replay folder: ${error}`);
    }
  }

  // Fall back to default test directory
  throw new Error("Failed to load replay sessions");
}

/**
 * Load replay data from gzipped JSON files Loads interface and test replay data
 * for development purposes Prioritizes .replay folder in extension directory,
 * falls back to default test directory
 *
 * @param {string} [filenameFilter] - Optional string to filter files by
 *   filename (case-insensitive)
 * @internal
 */
export async function loadReplayData(
  chatSessionMap: Map<string, Session>,
  filenameFilter?: string,
): Promise<void> {
  try {
    const replaySessions = await loadAutoBeReplaySessions(filenameFilter);

    replaySessions.forEach((replaySession: IReplaySession) => {
      chatSessionMap.set(replaySession.sessionId, {
        sessionId: replaySession.sessionId,
        history: replaySession.history || [],
        events: replaySession.events || [],
        tokenUsage: replaySession.tokenUsage || new AutoBeTokenUsage().toJSON(),
      });
    });

    Logger.debug(
      `Replay data loaded: ${replaySessions.length} sessions${filenameFilter ? ` (filtered by: "${filenameFilter}")` : ""}`,
    );
  } catch (error) {
    Logger.debug(`Failed to load replay data: ${error}`);
  }
}
