import { ExcelService } from "@/services/excel-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "download";

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
          'attachment; filename="studio_olives_cre_appointments.xlsx"',
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
