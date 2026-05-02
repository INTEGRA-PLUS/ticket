import { NextResponse } from "next/server";
import { saveUploads } from "@/lib/uploads";

export async function GET() {
  try {
    // Create a dummy file
    const file = new File(["dummy content"], "dummy.txt", { type: "text/plain" });
    const saved = await saveUploads([file]);
    
    return NextResponse.json({ success: true, saved });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
