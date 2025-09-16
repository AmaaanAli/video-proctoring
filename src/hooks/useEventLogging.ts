"use client";

import { useCallback } from "react";

interface ProctoringEvent {
  type:
    | "face_absent"
    | "looking_away"
    | "multiple_faces"
    | "phone_detected"
    | "book_detected";
  description: string;
  severity: "low" | "medium" | "high";
  interviewId?: string;
  timestamp?: Date;
}

export const useEventLogging = (interviewId: string = "default-interview") => {
  const logEvent = useCallback(
    async (event: ProctoringEvent) => { 
      try {
        const response = await fetch("/api/log-event", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...event,
            interviewId,
            timestamp: event.timestamp || new Date(),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to log event");
        }

        const result = await response.json();
        console.log("Event logged successfully:", result);
        return result;
      } catch (error) {
        console.error("Error logging event:", error);
        // Don't throw error to prevent breaking the UI
        return null;
      }
    },
    [interviewId]
  );

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch(`/api/log-event?interviewId=${interviewId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const result = await response.json();
      return result.events || [];
    } catch (error) {
      console.error("Error fetching events:", error);
      return [];
    }
  }, [interviewId]);

  return {
    logEvent,
    fetchEvents,
  };
};

