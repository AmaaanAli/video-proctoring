"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

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

interface InterviewReport {
  interviewId: string;
  duration: number;
  events: ProctoringEvent[];
  integrityScore: number;
  startTime: Date;
  endTime: Date;
}

export default function ReportPage() {
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);

      try {
        // Try to get current session data from sessionStorage
        const currentReportData = sessionStorage.getItem("currentReport");

        if (currentReportData) {
          const sessionData = JSON.parse(currentReportData);

          // Convert the session data to the report format
          const reportData: InterviewReport = {
            interviewId: sessionData.interviewId,
            duration: sessionData.duration,
            events: sessionData.events.map(
              (event: {
                id: string;
                type: string;
                timestamp: string;
                severity: string;
                description: string;
              }) => ({
                ...event,
                timestamp: new Date(event.timestamp),
              })
            ),
            integrityScore: sessionData.integrityScore,
            startTime: new Date(sessionData.startTime),
            endTime: new Date(sessionData.endTime),
          };

          setReport(reportData);

          // Clear the session data after loading
          sessionStorage.removeItem("currentReport");
        } else {
          // Fallback to demo data if no session data
          const demoReport: InterviewReport = {
            interviewId: "demo-interview",
            duration: 0,
            startTime: new Date(),
            endTime: new Date(),
            events: [],
            integrityScore: 100,
          };
          setReport(demoReport);
        }
      } catch (error) {
        console.error("Error loading report:", error);
        // Fallback to empty report
        const emptyReport: InterviewReport = {
          interviewId: "error-interview",
          duration: 0,
          startTime: new Date(),
          endTime: new Date(),
          events: [],
          integrityScore: 100,
        };
        setReport(emptyReport);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

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

  const getIntegrityScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getIntegrityScoreLabel = (score: number) => {
    if (score >= 80) return "Good";
    if (score >= 60) return "Fair";
    return "Poor";
  };

  const exportToPDF = () => {
    // In a real app, you would implement PDF export
    alert("PDF export functionality would be implemented here");
  };

  const exportToCSV = () => {
    // In a real app, you would implement CSV export
    alert("CSV export functionality would be implemented here");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No report found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Proctoring Report
              </h1>
              <p className="text-gray-600">
                Interview ID: {report.interviewId}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Interview
                </Button>
              </Link>
              <Link href="/">
                <Button className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Start New Session
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Report Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatDuration(report.duration)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {report.events.length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Integrity Score</p>
                  <p
                    className={`text-2xl font-bold ${getIntegrityScoreColor(
                      report.integrityScore
                    )}`}
                  >
                    {report.integrityScore}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {getIntegrityScoreLabel(report.integrityScore)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Integrity Score Details */}
            <Card>
              <CardHeader>
                <CardTitle>Integrity Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span
                        className={`text-sm font-bold ${getIntegrityScoreColor(
                          report.integrityScore
                        )}`}
                      >
                        {report.integrityScore}%
                      </span>
                    </div>
                    <Progress value={report.integrityScore} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Start Time</p>
                      <p className="font-medium">
                        {report.startTime.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">End Time</p>
                      <p className="font-medium">
                        {report.endTime.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Events Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Event Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {report.events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-medium text-green-600">
                      No suspicious events detected
                    </p>
                    <p className="text-sm">Perfect interview session!</p>
                    {report.duration > 0 ? (
                      <p className="text-xs mt-2 text-gray-400">
                        Duration: {formatDuration(report.duration)}
                      </p>
                    ) : (
                      <p className="text-xs mt-2 text-gray-400">
                        This is a demo report. Start a proctoring session to see
                        real data.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {report.events.map((event) => (
                      <Alert key={event.id} className="p-4">
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
                                {event.timestamp.toLocaleString()}
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

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={exportToPDF}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to PDF
                </Button>
                <Button
                  onClick={exportToCSV}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              </CardContent>
            </Card>

            {/* Event Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Event Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "face_absent",
                    // "looking_away",
                    "multiple_faces",
                    "phone_detected",
                    "book_detected",
                  ].map((type) => {
                    const count = report.events.filter(
                      (e) => e.type === type
                    ).length;
                    return (
                      <div
                        key={type}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm capitalize">
                          {type.replace("_", " ")}
                        </span>
                        <Badge
                          variant={count > 0 ? "destructive" : "secondary"}
                        >
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            {/* Recommendations */}
            <Card>
              <CardHeader> 
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {report.integrityScore >= 80 ? (
                  <div className="text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Interview appears to be conducted with integrity.
                  </div>
                ) : report.integrityScore >= 60 ? (
                  <div className="text-yellow-600 text-sm">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Some concerns detected. Review events for context.
                  </div>
                ) : (
                  <div className="text-red-600 text-sm">
                    <XCircle className="h-4 w-4 inline mr-1" />
                    Multiple integrity violations detected. Manual review
                    recommended.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
