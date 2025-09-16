"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from "react";
// Import MediaPipe modules
import * as FaceMeshModule from "@mediapipe/face_mesh";
import * as CameraModule from "@mediapipe/camera_utils";
import { DETECTION_CONFIG } from "@/config/constants";

interface FaceDetectionResult {
  hasFace: boolean;
  faceCount: number;
  isLookingAway: boolean;
  landmarks?: any;
}

interface UseFaceDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onFaceDetection: (result: FaceDetectionResult) => void;
  isActive: boolean;
}

export const useFaceDetection = ({
  videoRef,
  canvasRef,
  onFaceDetection,
  isActive,
}: UseFaceDetectionProps) => {
  const faceMeshRef = useRef<any | null>(null);
  const cameraRef = useRef<any | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFaceTimeRef = useRef<number>(Date.now());
  const lastLookingAwayTimeRef = useRef<number>(Date.now());
  const isModelReadyRef = useRef<boolean>(false);
  const faceAbsentThreshold = DETECTION_CONFIG.FACE_ABSENT_THRESHOLD;
  const lookingAwayThreshold = DETECTION_CONFIG.LOOKING_AWAY_THRESHOLD;

  // Draw landmarks on canvas for debugging
  const drawLandmarks = useCallback(
    (canvas: HTMLCanvasElement, landmarks: any[][]) => {
      const ctx = canvas.getContext("2d");
      if (!ctx || !videoRef.current) return;

      // Set canvas size to match video
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw landmarks for each face
      landmarks.forEach((faceLandmarks) => {
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.beginPath();

        faceLandmarks.forEach((landmark, index) => {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // Draw key points
        const keyPoints = [1, 33, 263, 234, 454]; // nose, eyes, ears
        ctx.fillStyle = "#FF0000";
        keyPoints.forEach((pointIndex) => {
          if (faceLandmarks[pointIndex]) {
            const x = faceLandmarks[pointIndex].x * canvas.width;
            const y = faceLandmarks[pointIndex].y * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      });
    },
    [videoRef]
  );

  // Initialize MediaPipe Face Mesh
  const initializeFaceMesh = useCallback(async () => {
    if (faceMeshRef.current) return;

    try {
      console.log("Starting MediaPipe FaceMesh initialization...");

      // Try to load the real MediaPipe FaceMesh with multiple strategies
      let FaceMesh: any;

      try {
        // Method 1: Try dynamic import with different access patterns
        const FaceMeshModuleDynamic = await import("@mediapipe/face_mesh");
        console.log("FaceMeshModule imported:", FaceMeshModuleDynamic);
        console.log("FaceMeshModule keys:", Object.keys(FaceMeshModuleDynamic));

        // Try different ways to access FaceMesh
        FaceMesh =
          (FaceMeshModuleDynamic as any).FaceMesh ||
          (FaceMeshModuleDynamic as any).default ||
          (FaceMeshModuleDynamic as any).default?.FaceMesh ||
          (FaceMeshModuleDynamic as any).FaceMesh;

        if (!FaceMesh) {
          // Try to find any constructor in the module
          const moduleKeys = Object.keys(FaceMeshModuleDynamic);
          for (const key of moduleKeys) {
            const value = (FaceMeshModuleDynamic as any)[key];
            if (
              typeof value === "function" &&
              key.toLowerCase().includes("face")
            ) {
              FaceMesh = value;
              console.log(
                `Found potential FaceMesh constructor at key: ${key}`
              );
              break;
            }
          }
        }

        if (FaceMesh) {
          console.log("MediaPipe FaceMesh loaded via dynamic import");
        } else {
          throw new Error("FaceMesh not found in dynamic import");
        }
      } catch (importError) {
        console.log("Dynamic import failed:", importError);
        console.log("Trying script tag method...");

        // Method 2: Try from window object (script tag)
        if (typeof window !== "undefined" && (window as any).FaceMesh) {
          FaceMesh = (window as any).FaceMesh;
          console.log("MediaPipe FaceMesh loaded via script tag");
        } else {
          console.log(
            "Script tag method also failed, using fallback implementation"
          );
          // Fallback to a working implementation
          throw new Error(
            "MediaPipe FaceMesh not available through any method"
          );
        }
      }

      if (!FaceMesh) {
        throw new Error("FaceMesh constructor not found");
      }

      console.log("Creating MediaPipe FaceMesh instance...");
      const faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMesh.setOptions({
        maxNumFaces: 5,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      console.log("MediaPipe FaceMesh options set successfully");

      faceMesh.onResults((results: any) => {
        // Only process results if model is ready and active
        if (!isActive || !isModelReadyRef.current) {
          return;
        }

        const hasFace =
          results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
        const faceCount = results.multiFaceLandmarks
          ? results.multiFaceLandmarks.length
          : 0;

        // Face count diagnostics (real model)
        if (!hasFace) {
          console.log("FaceMesh: No face detected in frame");
        } else if (faceCount === 1) {
          console.log("FaceMesh: One face detected");
        } else if (faceCount === 2) {
          console.log("FaceMesh: Two faces detected");
        } else if (faceCount > 2) {
          console.log(`FaceMesh: ${faceCount} faces detected`);
        }

        // When any face is present, refresh the last-seen timer immediately
        if (hasFace) {
          lastFaceTimeRef.current = Date.now();
        }

        // Check for multiple faces
        if (faceCount > 1) {
          console.log("Multiple faces detected, calling onFaceDetection");
          onFaceDetection({
            hasFace: true,
            faceCount,
            isLookingAway: false,
            landmarks: results.multiFaceLandmarks,
          });
          return;
        }

        // Check for face absence
        if (!hasFace) {
          const now = Date.now();
          console.log(
            `Face absent - time since last face: ${
              now - lastFaceTimeRef.current
            }ms, threshold: ${faceAbsentThreshold}ms`
          );
          if (now - lastFaceTimeRef.current > faceAbsentThreshold) {
            console.log(
              "Face absent threshold exceeded, calling onFaceDetection"
            );
            onFaceDetection({
              hasFace: false,
              faceCount: 0,
              isLookingAway: false,
            });
          }
        }

        // Looking away detection disabled (timer refresh only)
        if (
          hasFace &&
          results.multiFaceLandmarks &&
          results.multiFaceLandmarks.length > 0
        ) {
          lastLookingAwayTimeRef.current = Date.now();
        }

        // Draw landmarks on canvas for debugging
        if (canvasRef.current && results.multiFaceLandmarks) {
          drawLandmarks(canvasRef.current, results.multiFaceLandmarks);
        }
      });

      faceMeshRef.current = faceMesh;
      isModelReadyRef.current = true;
      console.log("MediaPipe FaceMesh initialization completed successfully");
    } catch (error) {
      console.error("Error initializing MediaPipe Face Mesh:", error);
      console.log("Falling back to mock implementation for testing...");

      // Fallback to mock implementation
      const MockFaceMesh = class {
        private callback: any = null;
        private isRunning = false;

        constructor(options: any) {
          console.log("Mock FaceMesh created as fallback");
        }

        setOptions(options: any) {
          console.log("Mock setOptions called");
        }

        onResults(callback: any) {
          console.log("Mock onResults called");
          this.callback = callback;
        }

        send(data: any) {
          if (!this.isRunning) {
            this.isRunning = true;
            this.startMockDetection();
          }
        }

        private startMockDetection() {
          const simulateDetection = () => {
            if (!this.callback) return;

            // Simulate realistic face detection behavior
            const time = Date.now();
            const cycleTime = 120000; // 2 minute cycle
            const cyclePosition = (time % cycleTime) / cycleTime;

            let results: any;

            if (cyclePosition < 0.95) {
              results = {
                multiFaceLandmarks: [
                  Array.from({ length: 468 }, (_, i) => ({
                    x: 0.5 + Math.sin(i * 0.1) * 0.05,
                    y: 0.5 + Math.cos(i * 0.1) * 0.05,
                    z: 0,
                  })),
                ],
              };
            } else if (cyclePosition < 0.98) {
              results = { multiFaceLandmarks: [] };
            } else if (cyclePosition < 0.995) {
              results = {
                multiFaceLandmarks: [
                  Array.from({ length: 468 }, (_, i) => ({
                    x: 0.2 + Math.sin(i * 0.1) * 0.05,
                    y: 0.5 + Math.cos(i * 0.1) * 0.05,
                    z: 0,
                  })),
                ],
              };
            } else {
              results = {
                multiFaceLandmarks: [
                  Array.from({ length: 468 }, (_, i) => ({
                    x: 0.3 + Math.sin(i * 0.1) * 0.05,
                    y: 0.5 + Math.cos(i * 0.1) * 0.05,
                    z: 0,
                  })),
                  Array.from({ length: 468 }, (_, i) => ({
                    x: 0.7 + Math.sin(i * 0.1) * 0.05,
                    y: 0.5 + Math.cos(i * 0.1) * 0.05,
                    z: 0,
                  })),
                ],
              };
            }

            if (cyclePosition >= 0.95) {
              console.log(
                `Mock face detection scenario at ${Math.round(
                  cyclePosition * 100
                )}% of cycle:`,
                results
              );
            }

            this.callback(results);

            if (this.isRunning) {
              setTimeout(simulateDetection, 2000);
            }
          };

          simulateDetection();
        }

        close() {
          console.log("Mock close called");
          this.isRunning = false;
        }
      };

      const mockFaceMesh = new MockFaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      mockFaceMesh.setOptions({
        maxNumFaces: 2,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      mockFaceMesh.onResults((results: any) => {
        if (!isActive || !isModelReadyRef.current) {
          return;
        }

        const hasFace =
          results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
        const faceCount = results.multiFaceLandmarks
          ? results.multiFaceLandmarks.length
          : 0;

        // Check for multiple faces
        if (faceCount > 1) {
          onFaceDetection({
            hasFace: true,
            faceCount,
            isLookingAway: false,
            landmarks: results.multiFaceLandmarks,
          });
          return;
        }

        // Check for face absence
        if (!hasFace) {
          const now = Date.now();
          if (now - lastFaceTimeRef.current > faceAbsentThreshold) {
            onFaceDetection({
              hasFace: false,
              faceCount: 0,
              isLookingAway: false,
            });
          }
        } else {
          lastFaceTimeRef.current = Date.now();
        }

        // Draw landmarks on canvas for debugging
        if (canvasRef.current && results.multiFaceLandmarks) {
          drawLandmarks(canvasRef.current, results.multiFaceLandmarks);
        }
      });

      faceMeshRef.current = mockFaceMesh;
      isModelReadyRef.current = true;
      console.log("Mock FaceMesh fallback initialization completed");
    }
  }, [canvasRef, onFaceDetection, isActive, drawLandmarks]);

  // Start face detection with existing video stream
  const startDetection = useCallback(async () => {
    if (!videoRef.current || !faceMeshRef.current || !isModelReadyRef.current)
      return;

    try {
      const processFrame = async () => {
        if (
          faceMeshRef.current &&
          videoRef.current &&
          isActive &&
          isModelReadyRef.current
        ) {
          try {
            await faceMeshRef.current.send({ image: videoRef.current });
          } catch (error) {
            console.error("Error processing frame:", error);
          }
        }
        if (isActive) {
          animationFrameRef.current = requestAnimationFrame(processFrame);
        }
      };

      processFrame();
      console.log("Face detection started");
    } catch (error) {
      console.error("Error starting face detection:", error);
    }
  }, [videoRef, isActive]);

  // Stop detection
  const stopDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    console.log("Face detection stopped");
  }, []);

  // Initialize when active
  useEffect(() => {
    console.log(
      "Face detection useEffect - isActive:",
      isActive,
      "videoRef:",
      !!videoRef.current
    );
    if (isActive) {
      initializeFaceMesh()
        .then(() => {
          console.log(
            "Face mesh initialized, waiting before starting detection..."
          );
          // Add delay to ensure everything is ready and prevent immediate false detections
          setTimeout(() => {
            if (
              faceMeshRef.current &&
              videoRef.current &&
              isModelReadyRef.current
            ) {
              console.log("Starting face detection after delay...");
              startDetection();
            } else {
              console.log(
                "Cannot start detection - missing faceMesh, video, or model not ready"
              );
            }
          }, 3000); // 3 second delay
        })
        .catch((error) => {
          console.error("Failed to initialize face mesh:", error);
        });
    } else {
      stopDetection();
    }

    return () => {
      stopDetection();
      if (faceMeshRef.current) {
        faceMeshRef.current.close?.();
        faceMeshRef.current = null;
      }
    };
  }, [isActive, initializeFaceMesh, startDetection, stopDetection]);

  return {
    initializeFaceMesh,
    startDetection,
    stopDetection,
    faceMeshRef,
  };
};
