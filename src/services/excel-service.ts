import ExcelJS from "exceljs";
import { Lead, Meeting } from "@/types";

export interface ExcelAppointmentRow {
  AppointmentID: string;
  ClientName: string;
  PhoneNumber: string;
  PhoneVerified: string;
  Email: string;
  PropertyType: string;
  CityLocation: string;
  ProjectScope: string;
  Budget: string;
  BudgetQualified: string;
  ConsultationDateTime: string;
  Timezone: string;
  MeetingStatus: string;
  GoogleMeetUrl: string;
  CallSummary: string;
  BookedAt: string;
}

// ─── In-memory store (survives the serverless warm instance) ─────────────────
// On Vercel each function instance is ephemeral; this is the best we can do
// without an external DB. Supabase integration can persist across instances.
const IN_MEMORY_STORE: ExcelAppointmentRow[] = [
  {
    AppointmentID: "APT-VIP-001",
    ClientName: "Hardik Pandya (Portfolio Reference)",
    PhoneNumber: "+919811002233",
    PhoneVerified: "YES",
    Email: "hardik@penthouse.in",
    PropertyType: "Penthouse",
    CityLocation: "Vadodara / Mumbai",
    ProjectScope: "6,000 sq ft Turnkey Architecture & Interiors",
    Budget: "₹5 Cr+ Benchmark",
    BudgetQualified: "QUALIFIED (₹5 Cr+)",
    ConsultationDateTime: "Thursday, Nov 05 at 11:30 AM IST",
    Timezone: "Asia/Kolkata",
    MeetingStatus: "CONFIRMED",
    GoogleMeetUrl: "https://meet.google.com/sample-meet-link",
    CallSummary: "Luxury penthouse concept session with Studio Olives Cre partners.",
    BookedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  },
];

// ─── Disk helpers (local dev only) ──────────────────────────────────────────
function isWritableEnv(): boolean {
  // Vercel / Lambda environments set this; local dev doesn't
  return process.env.VERCEL !== "1" && process.env.AWS_LAMBDA_FUNCTION_NAME === undefined;
}

function tryDiskRead(): ExcelAppointmentRow[] | null {
  if (!isWritableEnv()) return null;
  try {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const jsonPath = path.join(process.cwd(), "data", "appointments_store.json");
    if (!fs.existsSync(jsonPath)) return null;
    return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch {
    return null;
  }
}

function tryDiskWrite(rows: ExcelAppointmentRow[]): void {
  if (!isWritableEnv()) return;
  try {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(
      path.join(dataDir, "appointments_store.json"),
      JSON.stringify(rows, null, 2),
      "utf-8"
    );
  } catch {
    // Silent fail — read-only filesystem (Vercel)
  }
}

// ─── ExcelService ────────────────────────────────────────────────────────────
export class ExcelService {
  /** Always returns in-memory rows; merges disk store in local dev */
  static getAllAppointments(): ExcelAppointmentRow[] {
    const disk = tryDiskRead();
    if (disk && disk.length > 0) {
      // Sync disk data back into memory store (local dev)
      IN_MEMORY_STORE.length = 0;
      IN_MEMORY_STORE.push(...disk);
    }
    return [...IN_MEMORY_STORE];
  }

  /** Kept for API compatibility — returns a placeholder path on Vercel */
  public static getExcelFilePath(): string {
    if (!isWritableEnv()) return "/tmp/studio_olives_cre_appointments.xlsx";
    try {
      const path = require("path") as typeof import("path");
      return path.join(process.cwd(), "data", "studio_olives_cre_appointments.xlsx");
    } catch {
      return "/tmp/studio_olives_cre_appointments.xlsx";
    }
  }

  /**
   * Records or updates an appointment in memory (+ disk in local dev).
   * Never throws on read-only filesystem.
   */
  static async recordAppointment(params: {
    lead: Partial<Lead>;
    meeting?: Partial<Meeting>;
    meetUrl?: string;
  }): Promise<{ success: boolean; filePath: string }> {
    const { lead, meeting, meetUrl } = params;
    const rows = this.getAllAppointments();

    const appointmentId = meeting?.id || `APT-${Date.now()}`;
    const newRow: ExcelAppointmentRow = {
      AppointmentID: appointmentId,
      ClientName: lead.full_name || "Private Luxury Client",
      PhoneNumber: lead.phone || "",
      PhoneVerified: lead.phone_verified ? "YES" : "PENDING",
      Email: lead.email || "client@studioolivescre.com",
      PropertyType: lead.property_type || "Luxury Villa / Residence",
      CityLocation:
        [lead.property_location, lead.property_city].filter(Boolean).join(", ") || "Delhi NCR",
      ProjectScope: lead.project_scope || "Turnkey Interiors & Architecture",
      Budget: lead.budget_notes || "₹5 Cr+ Benchmark",
      BudgetQualified: lead.budget_fit ? "QUALIFIED (₹5 Cr+)" : "UNDER EVALUATION",
      ConsultationDateTime: meeting?.start_time
        ? new Date(meeting.start_time).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        : lead.preferred_meeting_times || "Requested Next Available Slot",
      Timezone: meeting?.timezone || lead.timezone || "Asia/Kolkata",
      MeetingStatus:
        meeting?.booking_status?.toUpperCase() || (meetUrl ? "CONFIRMED" : "BOOKING_PENDING"),
      GoogleMeetUrl: meetUrl || meeting?.meeting_url || "Pending Concierge Link",
      CallSummary:
        lead.call_summary || "Booked through Tisha Voice Consultation Phone System",
      BookedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    };

    const existingIndex = rows.findIndex(
      (r) =>
        r.AppointmentID === appointmentId ||
        (r.PhoneNumber && r.PhoneNumber === lead.phone && r.PhoneNumber.length > 5)
    );

    if (existingIndex >= 0) {
      rows[existingIndex] = { ...rows[existingIndex], ...newRow };
    } else {
      rows.unshift(newRow); // Most recent at top
    }

    // Update in-memory store
    IN_MEMORY_STORE.length = 0;
    IN_MEMORY_STORE.push(...rows);

    // Best-effort disk write (only works in local dev)
    tryDiskWrite(rows);

    return { success: true, filePath: this.getExcelFilePath() };
  }

  /**
   * Generates a fully formatted Microsoft Excel (.xlsx) Buffer — pure in-memory,
   * no disk I/O required. Works on Vercel and all serverless environments.
   */
  static async generateExcelBuffer(rows: ExcelAppointmentRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Studio Olives Cre";
    workbook.lastModifiedBy = "Tisha AI Consultation Coordinator";
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet("Appointments", {
      properties: { tabColor: { argb: "C5A059" } },
      views: [{ state: "frozen", ySplit: 1 }],
    });

    worksheet.columns = [
      { header: "Appointment ID", key: "AppointmentID", width: 18 },
      { header: "Client Name", key: "ClientName", width: 24 },
      { header: "Phone Number", key: "PhoneNumber", width: 18 },
      { header: "Phone Verified", key: "PhoneVerified", width: 16 },
      { header: "Email Address", key: "Email", width: 28 },
      { header: "Property Type", key: "PropertyType", width: 20 },
      { header: "City & Location", key: "CityLocation", width: 22 },
      { header: "Project Scope", key: "ProjectScope", width: 30 },
      { header: "Budget", key: "Budget", width: 20 },
      { header: "Budget Status", key: "BudgetQualified", width: 22 },
      { header: "Consultation Date & Time", key: "ConsultationDateTime", width: 28 },
      { header: "Timezone", key: "Timezone", width: 14 },
      { header: "Meeting Status", key: "MeetingStatus", width: 18 },
      { header: "Google Meet URL", key: "GoogleMeetUrl", width: 36 },
      { header: "Call Summary", key: "CallSummary", width: 44 },
      { header: "Booked At", key: "BookedAt", width: 24 },
    ];

    // Header row — charcoal bg, brass/gold text
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "18191A" } };
      cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "DFC085" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = { bottom: { style: "medium", color: { argb: "C5A059" } } };
    });

    // Data rows with zebra striping
    rows.forEach((row, index) => {
      const dataRow = worksheet.addRow(row);
      dataRow.height = 22;
      const isEven = index % 2 === 0;
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { name: "Segoe UI", size: 10, color: { argb: "111827" } };
        cell.alignment = { vertical: "middle" };
        if (isEven) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F9FAFB" } };
        }
        if ([1, 3, 4, 10, 12, 13].includes(colNumber)) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }
        if (colNumber === 13 && cell.value === "CONFIRMED") {
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "047857" } };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * @deprecated Use generateExcelBuffer() instead.
   * Kept for backwards compatibility — ignores outputPath on Vercel.
   */
  static async generateExcelFile(
    rows: ExcelAppointmentRow[],
    outputPath: string
  ): Promise<Buffer> {
    const buffer = await this.generateExcelBuffer(rows);

    // Best-effort local disk write
    if (isWritableEnv()) {
      try {
        const fs = require("fs") as typeof import("fs");
        await fs.promises.writeFile(outputPath, buffer);
      } catch {
        // Silent — read-only env
      }
    }

    return buffer;
  }
}
