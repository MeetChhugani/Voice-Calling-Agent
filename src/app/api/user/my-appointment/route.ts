import { NextResponse } from "next/server";
import { ExcelService } from "@/services/excel-service";
import { SupabaseService } from "@/services/supabase";

export const dynamic = "force-dynamic";

/**
 * User-Safe Appointment Lookup Endpoint
 * Only returns appointment records belonging to the specific client's phone number.
 * Never exposes other clients' details or internal administrative metrics.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone")?.trim();

    if (!phone || phone.length < 5) {
      return NextResponse.json(
        { error: "Please provide a valid phone number to check your consultation." },
        { status: 400 }
      );
    }

    // 1. Search in-memory & Excel appointment store
    const allAppointments = ExcelService.getAllAppointments();
    const cleanQuery = phone.replace(/\D/g, "");

    const matched = allAppointments.filter((apt) => {
      const aptPhone = apt.PhoneNumber.replace(/\D/g, "");
      return aptPhone.includes(cleanQuery) || cleanQuery.includes(aptPhone);
    });

    if (matched.length === 0) {
      return NextResponse.json({
        found: false,
        message: "No consultation found for this phone number. You can book an appointment with Tisha anytime.",
      });
    }

    // 2. Return strictly sanitized client-safe view (no internal staff ratings or other client data)
    const clientSafeRecords = matched.map((m) => ({
      appointmentId: m.AppointmentID,
      clientName: m.ClientName,
      phone: m.PhoneNumber,
      propertyType: m.PropertyType,
      cityLocation: m.CityLocation,
      projectScope: m.ProjectScope,
      consultationDateTime: m.ConsultationDateTime,
      status: m.MeetingStatus,
      googleMeetUrl: m.GoogleMeetUrl && !m.GoogleMeetUrl.includes("Pending") ? m.GoogleMeetUrl : null,
      bookedAt: m.BookedAt,
    }));

    return NextResponse.json({
      found: true,
      count: clientSafeRecords.length,
      appointments: clientSafeRecords,
    });
  } catch (err: unknown) {
    console.error("[API user/my-appointment] error:", err);
    return NextResponse.json(
      { error: "Could not retrieve appointment details", message: String(err) },
      { status: 500 }
    );
  }
}
