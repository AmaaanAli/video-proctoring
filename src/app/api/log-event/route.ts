import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    // Check if request has body
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { type, description, severity, interviewId, timestamp } = body;

    // Validate required fields
    if (!type || !description || !severity) {
      return NextResponse.json(
        { error: "Missing required fields: type, description, severity" },
        { status: 400 }
      );
    }

    // Temporarily log to console instead of Firestore to avoid permission errors
    console.log("Event logged:", {
      type,
      description,
      severity,
      interviewId: interviewId || "default-interview",
      timestamp: timestamp || new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      id: `event-${Date.now()}`,
      message: "Event logged successfully",
    });
  } catch (error) {
    console.error("Error logging event:", error);
    return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get("interviewId") || "default-interview";

    // Temporarily return empty events array to avoid Firestore permission errors
    return NextResponse.json({
      success: true,
      events: [],
      interviewId,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
