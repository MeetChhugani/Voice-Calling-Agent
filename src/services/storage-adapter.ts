import fs from "fs";
import path from "path";
import { StorageProvider } from "@/types/workflow";

export interface AppendRowResult {
  success: boolean;
  providerUsed: StorageProvider;
  recordId: string;
  destination: string;
  isRealStorage: boolean;
  rowAppended: Record<string, unknown>;
  message: string;
}

export class StorageService {
  private static ensureDataDir(): string {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return dataDir;
  }

  /**
   * Append a row to local CSV storage
   */
  static appendToLocalCsv(filename: string, row: Record<string, unknown>): AppendRowResult {
    const dataDir = this.ensureDataDir();
    const filePath = path.join(dataDir, filename.endsWith(".csv") ? filename : `${filename}.csv`);

    const headers = Object.keys(row);
    const values = headers.map((k) => {
      const val = row[k];
      const str = typeof val === "object" ? JSON.stringify(val) : String(val ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    });

    const fileExists = fs.existsSync(filePath);
    let csvContent = "";

    if (!fileExists) {
      csvContent += headers.map((h) => `"${h}"`).join(",") + "\n";
    }
    csvContent += values.join(",") + "\n";

    fs.appendFileSync(filePath, csvContent, "utf-8");

    const recordId = `csv-row-${Date.now()}`;
    return {
      success: true,
      providerUsed: "local_csv",
      recordId,
      destination: filePath,
      isRealStorage: true,
      rowAppended: row,
      message: `Appended row to local CSV file at ${filePath}`,
    };
  }

  /**
   * Append row through configured provider adapter
   */
  static async appendRow(
    provider: StorageProvider,
    target: string,
    row: Record<string, unknown>,
    googleConfig?: { spreadsheetId?: string; sheetName?: string }
  ): Promise<AppendRowResult> {
    if (provider === "google_sheets") {
      // Check if real Google credentials exist
      const hasGoogleKey = Boolean(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
      );

      if (!hasGoogleKey || !googleConfig?.spreadsheetId) {
        // Honest refusal / fallback notice as per system rules
        return {
          success: false,
          providerUsed: "google_sheets",
          recordId: "",
          destination: googleConfig?.spreadsheetId || "unconfigured_google_sheet",
          isRealStorage: false,
          rowAppended: row,
          message:
            "Google Sheets integration requires GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and a valid spreadsheetId. Please configure these or select local_csv adapter.",
        };
      }

      // If credentials exist, append using googleapis
      try {
        const { google } = await import("googleapis");
        const auth = new google.auth.JWT({
          email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });
        const values = [Object.values(row).map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v ?? "")))];

        const res = await sheets.spreadsheets.values.append({
          spreadsheetId: googleConfig.spreadsheetId,
          range: `${googleConfig.sheetName || "Sheet1"}!A:Z`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values },
        });

        return {
          success: true,
          providerUsed: "google_sheets",
          recordId: res.data.updates?.updatedRange || `gsheet-${Date.now()}`,
          destination: `Google Spreadsheet ${googleConfig.spreadsheetId}`,
          isRealStorage: true,
          rowAppended: row,
          message: `Successfully appended row to Google Sheet ${googleConfig.spreadsheetId}`,
        };
      } catch (err: unknown) {
        return {
          success: false,
          providerUsed: "google_sheets",
          recordId: "",
          destination: googleConfig.spreadsheetId,
          isRealStorage: false,
          rowAppended: row,
          message: `Google Sheets API Error: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    // Default to robust local CSV storage adapter
    return this.appendToLocalCsv(target || "leads_workflow_records.csv", row);
  }
}
