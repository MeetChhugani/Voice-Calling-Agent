import ExcelJS from "exceljs";
import { Lead, Meeting, SupportRequest } from "@/types";

export interface ExcelSupportRequestRow {
  TicketID: string;
  CustomerName: string;
  PhoneNumber: string;
  PhoneVerified: string;
  Email: string;
  Category: string;
  ProductType: string;
  UrgencyAlert: string;
  Status: string;
  PreferredCallback: string;
  OfficialChannel: string;
  IssueSummary: string;
  CreatedAt: string;
}

// ─── Default In-Memory HDFC Bank Store ───────────────────────────────────────
const IN_MEMORY_HDFC_STORE: ExcelSupportRequestRow[] = [
  {
    TicketID: "HDFC-SR-100234",
    CustomerName: "Rohan Verma",
    PhoneNumber: "+919811002233",
    PhoneVerified: "YES",
    Email: "rohan.verma@example.com",
    Category: "Cards",
    ProductType: "Millennia Credit Card",
    UrgencyAlert: "STANDARD",
    Status: "REGISTERED",
    PreferredCallback: "Today between 2 PM - 4 PM",
    OfficialChannel: "HDFC Bank Credit Cards Customer Care",
    IssueSummary: "Inquiry regarding cashback redemption and annual fee waiver on Millennia card.",
    CreatedAt: new Date(Date.now() - 3600000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  },
  {
    TicketID: "HDFC-SR-100235",
    CustomerName: "Pooja Sharma",
    PhoneNumber: "+919876543210",
    PhoneVerified: "YES",
    Email: "pooja.sharma@example.com",
    Category: "Loans",
    ProductType: "Home Loan",
    UrgencyAlert: "STANDARD",
    Status: "IN_PROGRESS",
    PreferredCallback: "Tomorrow morning",
    OfficialChannel: "HDFC Bank Retail Asset Branch",
    IssueSummary: "Wants consultation on Home Loan balance transfer and top-up eligibility.",
    CreatedAt: new Date(Date.now() - 7200000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  },
];

function isWritableEnv(): boolean {
  return process.env.VERCEL !== "1" && process.env.AWS_LAMBDA_FUNCTION_NAME === undefined;
}

function tryDiskReadHDFC(): ExcelSupportRequestRow[] | null {
  if (!isWritableEnv()) return null;
  try {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const jsonPath = path.join(process.cwd(), "data", "hdfc_excel_store.json");
    if (!fs.existsSync(jsonPath)) return null;
    return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch {
    return null;
  }
}

function tryDiskWriteHDFC(rows: ExcelSupportRequestRow[]): void {
  if (!isWritableEnv()) return;
  try {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, "hdfc_excel_store.json"), JSON.stringify(rows, null, 2), "utf-8");
  } catch {
    // Silent on read-only environments
  }
}

export class ExcelService {
  public static getAllHDFCRequests(): ExcelSupportRequestRow[] {
    const disk = tryDiskReadHDFC();
    if (disk && disk.length > 0) {
      IN_MEMORY_HDFC_STORE.length = 0;
      IN_MEMORY_HDFC_STORE.push(...disk);
    }
    return [...IN_MEMORY_HDFC_STORE];
  }

  public static getExcelFilePath(): string {
    if (!isWritableEnv()) return "/tmp/hdfc_bank_customer_requests.xlsx";
    try {
      const path = require("path") as typeof import("path");
      return path.join(process.cwd(), "data", "hdfc_bank_customer_requests.xlsx");
    } catch {
      return "/tmp/hdfc_bank_customer_requests.xlsx";
    }
  }

  /**
   * Records or updates a customer assistance request into HDFC Bank Excel workbook
   */
  public static async recordHDFCSupportRequest(ticket: SupportRequest): Promise<{ success: boolean; filePath: string }> {
    const rows = this.getAllHDFCRequests();

    const newRow: ExcelSupportRequestRow = {
      TicketID: ticket.id,
      CustomerName: ticket.customer_name,
      PhoneNumber: ticket.phone,
      PhoneVerified: ticket.phone_verified ? "YES" : "PENDING",
      Email: ticket.email || "Not Provided",
      Category: ticket.category.toUpperCase(),
      ProductType: ticket.product_type || "General Banking",
      UrgencyAlert: ticket.is_fraud_or_urgent ? "URGENT FRAUD ALERT" : "STANDARD",
      Status: ticket.status.toUpperCase(),
      PreferredCallback: ticket.preferred_callback_time || "Standard Hours",
      OfficialChannel: ticket.official_reference_channel,
      IssueSummary: ticket.issue_summary,
      CreatedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    };

    const existingIdx = rows.findIndex((r) => r.TicketID === ticket.id);
    if (existingIdx >= 0) {
      rows[existingIdx] = { ...rows[existingIdx], ...newRow };
    } else {
      rows.unshift(newRow);
    }

    IN_MEMORY_HDFC_STORE.length = 0;
    IN_MEMORY_HDFC_STORE.push(...rows);
    tryDiskWriteHDFC(rows);

    return { success: true, filePath: this.getExcelFilePath() };
  }

  /**
   * Generates genuine OpenXML (.xlsx) buffer with official HDFC Bank styling:
   * Navy Blue header (#004C8F), Red accents (#ED1C24), white text, frozen row 1.
   */
  public static async generateExcelBuffer(rows?: ExcelSupportRequestRow[]): Promise<Buffer> {
    const dataRows = rows || this.getAllHDFCRequests();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "HDFC Bank";
    workbook.lastModifiedBy = "Tisha AI Customer Assistance Voice Agent";
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet("Customer_Requests", {
      properties: { tabColor: { argb: "004C8F" } },
      views: [{ state: "frozen", ySplit: 1 }],
    });

    worksheet.columns = [
      { header: "Ticket ID", key: "TicketID", width: 18 },
      { header: "Customer Name", key: "CustomerName", width: 22 },
      { header: "Contact Number", key: "PhoneNumber", width: 18 },
      { header: "Phone Verified", key: "PhoneVerified", width: 15 },
      { header: "Email Address", key: "Email", width: 26 },
      { header: "Category", key: "Category", width: 18 },
      { header: "Product / Service", key: "ProductType", width: 24 },
      { header: "Urgency Level", key: "UrgencyAlert", width: 22 },
      { header: "Ticket Status", key: "Status", width: 16 },
      { header: "Preferred Callback", key: "PreferredCallback", width: 24 },
      { header: "Official Support Channel", key: "OfficialChannel", width: 34 },
      { header: "Issue Summary (Redacted)", key: "IssueSummary", width: 44 },
      { header: "Created At (IST)", key: "CreatedAt", width: 22 },
    ];

    // Format Header Row (HDFC Bank Navy Blue & White text)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "004C8F" }, // HDFC Navy
      };
      cell.font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        bottom: { style: "medium", color: { argb: "ED1C24" } }, // HDFC Red Accent
      };
    });

    // Populate Data Rows with Zebra striping
    dataRows.forEach((row, index) => {
      const dataRow = worksheet.addRow(row);
      dataRow.height = 22;

      const isEven = index % 2 === 0;
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { name: "Segoe UI", size: 10, color: { argb: "1F2937" } };
        cell.alignment = { vertical: "middle" };

        if (isEven) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F8FAFC" },
          };
        }

        // Center align ID, Phone, Verified, Status, Urgency
        if ([1, 3, 4, 6, 8, 9].includes(colNumber)) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }

        // Highlight urgent fraud alert in red
        if (colNumber === 8 && cell.value === "URGENT FRAUD ALERT") {
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "DC2626" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEE2E2" } };
        }

        // Highlight resolved in green
        if (colNumber === 9 && cell.value === "RESOLVED") {
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "15803D" } };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ─── Legacy Compatibility Methods ──────────────────────────────────────────
  public static getAllAppointments(): any[] {
    return this.getAllHDFCRequests().map((r) => ({
      AppointmentID: r.TicketID,
      ClientName: r.CustomerName,
      PhoneNumber: r.PhoneNumber,
      PhoneVerified: r.PhoneVerified,
      Email: r.Email,
      PropertyType: r.ProductType,
      CityLocation: r.Category,
      ProjectScope: r.IssueSummary,
      Budget: r.UrgencyAlert,
      BudgetQualified: r.UrgencyAlert,
      ConsultationDateTime: r.PreferredCallback,
      Timezone: "Asia/Kolkata",
      MeetingStatus: r.Status,
      GoogleMeetUrl: r.OfficialChannel,
      CallSummary: r.IssueSummary,
      BookedAt: r.CreatedAt,
    }));
  }

  public static async generateExcelFile(rows: any[], outputPath: string): Promise<Buffer> {
    const buffer = await this.generateExcelBuffer();
    if (isWritableEnv()) {
      try {
        const fs = require("fs") as typeof import("fs");
        await fs.promises.writeFile(outputPath, buffer);
      } catch {
        // Silent on read-only environments
      }
    }
    return buffer;
  }

  public static async recordAppointment(params: {
    lead: Partial<Lead>;
    meeting?: Partial<Meeting>;
    meetUrl?: string;
  }): Promise<{ success: boolean; filePath: string }> {
    const ticketId = `HDFC-SR-${Math.floor(100000 + Math.random() * 900000)}`;
    const ticket: SupportRequest = {
      id: ticketId,
      customer_name: params.lead.full_name || "Customer",
      phone: params.lead.phone || "",
      phone_verified: Boolean(params.lead.phone_verified),
      email: params.lead.email || null,
      category: "general",
      product_type: params.lead.property_type || "Banking Service",
      issue_summary: params.lead.call_summary || "Callback requested via voice assistant",
      is_fraud_or_urgent: false,
      preferred_callback_time: params.lead.preferred_meeting_times || "Standard Hours",
      consent_given: true,
      status: "registered",
      official_reference_channel: "HDFC Bank Customer Support (1800 1600)",
      agent_notes: null,
      created_at: new Date().toISOString(),
    };
    return this.recordHDFCSupportRequest(ticket);
  }
}
