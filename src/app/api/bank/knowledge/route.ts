import { NextResponse } from "next/server";
import { BankKnowledgeService } from "@/services/bank-knowledge-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || undefined;
  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required." }, { status: 400 });
  }
  const results = BankKnowledgeService.search(query, category as any);
  return NextResponse.json({ results, helplines: BankKnowledgeService.getOfficialHelplines() });
}
