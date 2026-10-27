import fs from "fs";
import path from "path";
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

export class ExcelService {
  private static ensureDataDir(): string {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return dataDir;
  }

  public static getExcelFilePath(): string {
    return path.join(this.ensureDataDir(), "studio_olives_cre_appointments.xlsx");
  }

  private static getJsonFilePath(): string {
    return path.join(this.ensureDataDir(), "appointments_store.json");
  }

  /**
   * Retrieves all appointment records from disk store
   */
  static getAllAppointments(): ExcelAppointmentRow[] {
    const jsonPath = this.getJsonFilePath();
    if (!fs.existsSync(jsonPath)) {
      // Default seed sample
      return [
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
    }

    try {
      const data = fs.readFileSync(jsonPath, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Records or updates an appointment row and rebuilds the true Excel OpenXML workbook (.xlsx)
   */
  static async recordAppointment(params: {
    lead: Partial<Lead>;
    meeting?: Partial<Meeting>;
    meetUrl?: string;
  }): Promise<{ success: boolean; filePath: string }> {
    const filePath = this.getExcelFilePath();
    const jsonPath = this.getJsonFilePath();
    const { lead, meeting, meetUrl } = params;

    let rows: ExcelAppointmentRow[] = this.getAllAppointments();

    const appointmentId = meeting?.id || `APT-${Date.now()}`;
    const newRow: ExcelAppointmentRow = {
      AppointmentID: appointmentId,
      ClientName: lead.full_name || "Private Luxury Client",
      PhoneNumber: lead.phone || "",
      PhoneVerified: lead.phone_verified ? "YES" : "PENDING",
      Email: lead.email || "client@studioolivescre.com",
      PropertyType: lead.property_type || "Luxury Villa / Residence",
      CityLocation: [lead.property_location, lead.property_city].filter(Boolean).join(", ") || "Delhi NCR",
      ProjectScope: lead.project_scope || "Turnkey Interiors & Architecture",
      Budget: lead.budget_notes || "₹5 Cr+ Benchmark",
      BudgetQualified: lead.budget_fit ? "QUALIFIED (₹5 Cr+)" : "UNDER EVALUATION",
      ConsultationDateTime: meeting?.start_time
        ? new Date(meeting.start_time).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        : lead.preferred_meeting_times || "Requested Next Available Slot",
      Timezone: meeting?.timezone || lead.timezone || "Asia/Kolkata",
      MeetingStatus: meeting?.booking_status?.toUpperCase() || (meetUrl ? "CONFIRMED" : "BOOKING_PENDING"),
      GoogleMeetUrl: meetUrl || meeting?.meeting_url || "Pending Concierge Link",
      CallSummary: lead.call_summary || "Booked through Tisha Voice Consultation Phone System",
      BookedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    };

    const existingIndex = rows.findIndex(
      (r) => r.AppointmentID === appointmentId || (r.PhoneNumber && r.PhoneNumber === lead.phone && r.PhoneNumber.length > 5)
    );

    if (existingIndex >= 0) {
      rows[existingIndex] = { ...rows[existingIndex], ...newRow };
    } else {
      rows.unshift(newRow); // Most recent at top
    }

    // Save JSON backing store
    fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), "utf-8");

    // Rebuild real Microsoft Excel (.xlsx) file using ExcelJS
    await this.generateExcelFile(rows, filePath);

    return { success: true, filePath };
  }

  /**
   * Generates a fully formatted, genuine Microsoft Excel (.xlsx) file
   */
  static async generateExcelFile(rows: ExcelAppointmentRow[], outputPath: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Studio Olives Cre";
    workbook.lastModifiedBy = "Tisha AI Consultation Coordinator";
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet("Appointments", {
      properties: { tabColor: { argb: "C5A059" } },
      views: [{ state: "frozen", ySplit: 1 }],
    });

    // Define table columns
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

    // Format Header Row (Studio Olives Cre luxury theme: Charcoal background & Gold text)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "18191A" },
      };
      cell.font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: "DFC085" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        bottom: { style: "medium", color: { argb: "C5A059" } },
      };
    });

    // Populate Data Rows
    rows.forEach((row, index) => {
      const dataRow = worksheet.addRow(row);
      dataRow.height = 22;

      // Subtle zebra striping
      const isEven = index % 2 === 0;
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { name: "Segoe UI", size: 10, color: { argb: "111827" } };
        cell.alignment = { vertical: "middle" };
        if (isEven) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F9FAFB" },
          };
        }

        // Center align status & ID columns
        if ([1, 3, 4, 10, 12, 13].includes(colNumber)) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }

        // Highlight verified / confirmed
        if (colNumber === 13 && cell.value === "CONFIRMED") {
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "047857" } };
        }
      });
    });

    // Write file to disk
    await workbook.xlsx.writeFile(outputPath);
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
