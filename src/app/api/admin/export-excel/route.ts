import { ExcelService } from "@/services/excel-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "download";

    // Strict Admin Authorization Check
    const authHeader = request.headers.get("authorization");
    const queryToken = searchParams.get("token");
    const configuredPassword = process.env.ADMIN_PASSWORD || "studio-olives-cre-2026";

    let isAuthorized = false;
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (token === configuredPassword) isAuthorized = true;
    }
    if (queryToken && queryToken === configuredPassword) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return Response.json(
        {
          error: "Unauthorized",
          message: "Internal staff credentials are required to export the Studio Olives Cre client database.",
        },
        { status: 401 }
      );
    }

    const filePath = ExcelService.getExcelFilePath();
    const rows = ExcelService.getAllAppointments();

    if (format === "json") {
      return Response.json({ appointments: rows, count: rows.length });
    }

    // Generate genuine OpenXML Buffer via ExcelJS
    const excelBuffer = await ExcelService.generateExcelFile(rows, filePath);
    // Convert Node.js Buffer → ArrayBuffer so it's valid as BodyInit in Next.js 16
    const arrayBuffer = excelBuffer.buffer.slice(
      excelBuffer.byteOffset,
      excelBuffer.byteOffset + excelBuffer.byteLength
    ) as ArrayBuffer;

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="studio_olives_cre_master_appointments.xlsx"',
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: unknown) {
    console.error("[API admin/export-excel] error:", err);
    return Response.json(
      { error: "Failed to export Excel file", message: String(err) },
      { status: 500 }
    );
  }
}
