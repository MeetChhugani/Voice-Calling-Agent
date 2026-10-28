import { NextResponse } from "next/server";
import { BankKnowledgeService } from "@/services/bank-knowledge-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || searchParams.get("pincode") || "";
  const type = searchParams.get("type") || "branch";
  return NextResponse.json({
    locator_url: `https://www.hdfcbank.com/branch-atm-locator?query=${encodeURIComponent(city)}`,
    type,
    city,
    helplines: BankKnowledgeService.getOfficialHelplines(),
    message: `Visit hdfcbank.com/branch-atm-locator or use the MobileBanking app 'Locate Us' feature for ${type} in ${city || "your area"}.`,
  });
}
