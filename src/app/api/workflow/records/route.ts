import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "leads_workflow_records.csv");

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ records: [], count: 0, fileExists: false });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n");
    if (lines.length <= 1) {
      return NextResponse.json({ records: [], count: 0, fileExists: true });
    }

    const headers = lines[0].split(",").map((h) => h.replace(/(^"|"$)/g, ""));
    const records = lines.slice(1).map((line) => {
      // Basic CSV split
      const values = line.split(",").map((v) => v.replace(/(^"|"$)/g, ""));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || "";
      });
      return obj;
    });

    return NextResponse.json({
      records: records.reverse(), // most recent first
      count: records.length,
      filePath,
      fileExists: true,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Failed to read records", message: String(err) },
      { status: 500 }
    );
  }
}
