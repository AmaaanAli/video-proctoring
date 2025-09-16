"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Video,
  Camera,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useObjectDetection } from "@/hooks/useObjectDetection";
import { useEventLogging } from "@/hooks/useEventLogging";
import {
  DETECTION_CONFIG,
  EVENT_TYPES,
  SEVERITY_LEVELS,
} from "@/config/constants";

interface ProctoringEvent {
  id: string;
  type:
    | "face_absent"
    | "looking_away"
    | "multiple_faces"
    | "phone_detected"
    | "book_detected";
  timestamp: Date;
  severity: "low" | "medium" | "high";
  description: string;
}

export default function InterviewPage() {
  const [isProctoring, setIsProctoring] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [integrityScore, setIntegrityScore] = useState(100);
  const [interviewDuration, setInterviewDuration] = useState(0);
  const [detectionStatus, setDetectionStatus] = useState({
    faceDetection: false,
    objectDetection: false,
  });
  const [initializingDetection, setInitializingDetection] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const lastEventTimeRef = useRef<{ [key: string]: number }>({});
  const interviewIdRef = useRef<string>(`interview-${Date.now()}`);

  // Initialize event logging
  const { logEvent } = useEventLogging(interviewIdRef.current);

  // Face detection callback
  const handleFaceDetection = (result: {
    hasFace: boolean;
    faceCount: number;
    isLookingAway: boolean;
  }) => {
    console.log("Face detection result:", result);
    const now = Date.now();

    if (!result.hasFace) {
      const eventKey = "face_absent";
      // Prevent duplicate events within cooldown period
      if (
        lastEventTimeRef.current[eventKey] &&
        now - lastEventTimeRef.current[eventKey] <
          DETECTION_CONFIG.EVENT_COOLDOWN.FACE_EVENTS
      ) {
        return;
      }
      lastEventTimeRef.current[eventKey] = now;
      addEvent("face_absent", "No face detected in frame", "high");
    } else if (result.faceCount > 1) {
      const eventKey = "multiple_faces";
      if (
        lastEventTimeRef.current[eventKey] &&
        now - lastEventTimeRef.current[eventKey] <
          DETECTION_CONFIG.EVENT_COOLDOWN.FACE_EVENTS
      ) {
        return;
      }
      lastEventTimeRef.current[eventKey] = now;
      addEvent("multiple_faces", "Multiple faces detected in frame", "high");
    } else if (result.isLookingAway) {
      const eventKey = "looking_away";
      if (
        lastEventTimeRef.current[eventKey] &&
        now - lastEventTimeRef.current[eventKey] <
          DETECTION_CONFIG.EVENT_COOLDOWN.FACE_EVENTS
      ) {
        return;
      }
      lastEventTimeRef.current[eventKey] = now;
      addEvent("looking_away", "Candidate looked away from screen", "medium");
    }
  };

  // Object detection callback
  const handleObjectDetection = (
    detections: {
      class: string;
      confidence: number;
      bbox: [number, number, number, number];
    }[]
  ) => {
    console.log("Object detection result:", detections);
    const now = Date.now();

    detections.forEach((detection) => {
      if (detection.class === "cell phone") {
        const eventKey = "phone_detected";
        // Prevent duplicate events within cooldown period
        if (
          lastEventTimeRef.current[eventKey] &&
          now - lastEventTimeRef.current[eventKey] <
            DETECTION_CONFIG.EVENT_COOLDOWN.OBJECT_EVENTS
        ) {
          return;
        }
        lastEventTimeRef.current[eventKey] = now;
        addEvent("phone_detected", "Mobile phone detected in frame", "high");
      } else if (detection.class === "book") {
        const eventKey = "book_detected";
        if (
          lastEventTimeRef.current[eventKey] &&
          now - lastEventTimeRef.current[eventKey] <
            DETECTION_CONFIG.EVENT_COOLDOWN.OBJECT_EVENTS
        ) {
          return;
        }
        lastEventTimeRef.current[eventKey] = now;
        addEvent("book_detected", "Book or notes detected in frame", "high");
      }
    });
  };

  // Initialize face detection hook
  const {
    initializeFaceMesh,
    stopDetection: stopFaceDetection,
    faceMeshRef,
  } = useFaceDetection({
    videoRef,
    canvasRef,
    onFaceDetection: handleFaceDetection,
    isActive: isProctoring && cameraActive,
  });

  // Initialize object detection hook
  const {
    loadModel,
    stopDetection: stopObjectDetection,
    runDetection,
  } = useObjectDetection({
    videoRef,
    onObjectDetection: handleObjectDetection,
    isActive: isProctoring && cameraActive,
    detectionInterval: 3000, // Run every 3 seconds
  });

  // Initialize webcam
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  // Start proctoring
  const startProctoring = async () => {
    setIsProctoring(true);
    setInitializingDetection(true);
    startTimeRef.current = new Date();
    setEvents([]);
    setIntegrityScore(100);
    setInterviewDuration(0);

    // Initialize AI models
    try {
      console.log("Initializing AI models...");
      console.log("Video element ready:", !!videoRef.current);
      console.log("Video stream ready:", !!videoRef.current?.srcObject);

      await Promise.all([initializeFaceMesh(), loadModel()]);
      console.log("AI models initialized successfully");
      setDetectionStatus({
        faceDetection: true,
        objectDetection: true,
      });
    } catch (error) {
      console.error("Error initializing AI models:", error);
      setDetectionStatus({
        faceDetection: false,
        objectDetection: false,
      });
    } finally {
      setInitializingDetection(false);
    }
  };

  // Stop proctoring
  const stopProctoring = () => {
    setIsProctoring(false);
    setDetectionStatus({
      faceDetection: false,
      objectDetection: false,
    });

    // Stop AI detection
    stopFaceDetection();
    stopObjectDetection();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      setCameraActive(false);
    }

    // Navigate to report page with current session data
    const reportData = {
      interviewId: interviewIdRef.current,
      events: events,
      integrityScore: integrityScore,
      duration: interviewDuration,
      startTime: startTimeRef.current,
      endTime: new Date(),
    };

    // Store report data in sessionStorage for the report page
    sessionStorage.setItem("currentReport", JSON.stringify(reportData));

    // Navigate to report page
    window.location.href = "/report";
  };

  // Add event to log
  const addEvent = async (
    type: ProctoringEvent["type"],
    description: string,
    severity: ProctoringEvent["severity"] = "medium"
  ) => {
    const newEvent: ProctoringEvent = {
      id: Date.now().toString(),
      type,
      timestamp: new Date(),
      description,
      severity,
    };

    setEvents((prev) => [...prev, newEvent]);

    // Log to Firebase
    await logEvent({
      type,
      description,
      severity,
      timestamp: newEvent.timestamp,
    });

    // Update integrity score
    let scoreDeduction = 0;
    switch (type) {
      case EVENT_TYPES.LOOKING_AWAY:
        scoreDeduction = DETECTION_CONFIG.SCORE_DEDUCTIONS.LOOKING_AWAY;
        break;
      case EVENT_TYPES.FACE_ABSENT:
        scoreDeduction = DETECTION_CONFIG.SCORE_DEDUCTIONS.FACE_ABSENT;
        break;
      case EVENT_TYPES.PHONE_DETECTED:
      case EVENT_TYPES.BOOK_DETECTED:
        scoreDeduction = DETECTION_CONFIG.SCORE_DEDUCTIONS.PHONE_DETECTED;
        break;
      case EVENT_TYPES.MULTIPLE_FACES:
        scoreDeduction = DETECTION_CONFIG.SCORE_DEDUCTIONS.MULTIPLE_FACES;
        break;
    }

    setIntegrityScore((prev) => {
      const newScore = Math.max(0, prev - scoreDeduction);
      console.log(
        `Integrity score: ${prev} -> ${newScore} (deducted ${scoreDeduction} for ${type})`
      );
      return newScore;
    });
  };

  // Add demo event (bypasses deduplication)
  const addDemoEvent = async (
    type: ProctoringEvent["type"],
    description: string,
    severity: ProctoringEvent["severity"] = "medium"
  ) => {
    console.log(`Adding demo event: ${type} - ${description}`);
    await addEvent(type, description, severity);
  };

  // Update interview duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProctoring && startTimeRef.current) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor(
          (now.getTime() - startTimeRef.current!.getTime()) / 1000
        );
        setInterviewDuration(duration);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isProctoring]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Get event icon
  const getEventIcon = (type: ProctoringEvent["type"]) => {
    switch (type) {
      case "face_absent":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "looking_away":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "multiple_faces":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "phone_detected":
      case "book_detected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: ProctoringEvent["severity"]) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const Spinner = () => (
    <span className="inline-block h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Video Proctoring System
              </h1>
              <p className="text-gray-600">
                Real-time monitoring for interview integrity
              </p>
            </div>
            <Link href="/report">
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                View Reports
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Interview Monitor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-96 object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  />

                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div className="text-center text-white">
                        <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Camera not active</p>
                        <p className="text-sm opacity-75">
                          Click &quot;Initialize Camera&quot; to start
                        </p>
                      </div>
                    </div>
                  )}

                  {isProctoring && initializingDetection && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <div className="text-white text-center space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <Spinner />
                          <span className="text-sm">
                            Initializing AI models…
                          </span>
                        </div>
                        <p className="text-xs opacity-75">
                          Preparing face and object detection
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  {!cameraActive ? (
                    <Button
                      onClick={initializeCamera}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Initialize Camera
                    </Button>
                  ) : (
                    <>
                      {!isProctoring ? (
                        <Button
                          onClick={startProctoring}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Start Proctoring
                        </Button>
                      ) : (
                        <Button
                          onClick={stopProctoring}
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Stop Proctoring
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {/* Status Indicators */}
                {isProctoring && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Face Detection</p>
                        <div className="flex items-center justify-center gap-2">
                          {detectionStatus.faceDetection ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : initializingDetection ? (
                            <Spinner />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="text-sm font-medium">
                            {detectionStatus.faceDetection
                              ? "Active"
                              : initializingDetection
                              ? "Initializing…"
                              : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">
                          Object Detection
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          {detectionStatus.objectDetection ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : initializingDetection ? (
                            <Spinner />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="text-sm font-medium">
                            {detectionStatus.objectDetection
                              ? "Active"
                              : initializingDetection
                              ? "Initializing…"
                              : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Events Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Proctoring Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No events detected</p>
                    <p className="text-sm">All good so far!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {events.map((event) => (
                      <Alert key={event.id} className="p-3">
                        <div className="flex items-start gap-3">
                          {getEventIcon(event.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                className={getSeverityColor(event.severity)}
                              >
                                {event.severity}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {event.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <AlertDescription className="text-sm">
                              {event.description}
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Demo Controls */}
        {isProctoring && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Demo Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    addDemoEvent(
                      "face_absent",
                      "No face detected in frame",
                      "high"
                    )
                  }
                >
                  Simulate Face Absent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    addDemoEvent(
                      "phone_detected",
                      "Mobile phone detected in frame",
                      "high"
                    )
                  }
                >
                  Simulate Phone Detected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    addDemoEvent(
                      "book_detected",
                      "Book or notes detected in frame",
                      "high"
                    )
                  }
                >
                  Simulate Book Detected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    addDemoEvent(
                      "multiple_faces",
                      "Multiple faces detected in frame",
                      "high"
                    )
                  }
                >
                  Simulate Multiple Faces
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
