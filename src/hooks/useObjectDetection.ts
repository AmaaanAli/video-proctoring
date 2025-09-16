"use client";

import { useEffect, useRef, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { DETECTION_CONFIG, TARGET_OBJECTS } from "@/config/constants";

interface DetectionResult {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

interface UseObjectDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onObjectDetection: (detections: DetectionResult[]) => void;
  isActive: boolean;
  detectionInterval?: number; // milliseconds between detections
}

// COCO-SSD class names that we're interested in
const TARGET_CLASSES = TARGET_OBJECTS;

export const useObjectDetection = ({
  videoRef,
  onObjectDetection,
  isActive,
  detectionInterval = 2000, // Run detection every 2 seconds
}: UseObjectDetectionProps) => {
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDetectingRef = useRef(false);
  const isModelReadyRef = useRef<boolean>(false);

  // Load COCO-SSD model
  const loadModel = useCallback(async () => {
    if (modelRef.current) return;

    try {
      console.log("Loading TensorFlow.js COCO-SSD model...");

      // Set backend with memory management
      await tf.setBackend("webgl");
      await tf.ready();

      // Enable memory management
      tf.env().set("WEBGL_DELETE_TEXTURE_THRESHOLD", 0);
      tf.env().set("WEBGL_PACK", false);

      console.log("TensorFlow.js backend ready with memory optimization");

      // Load the COCO-SSD model
      modelRef.current = await cocoSsd.load();
      isModelReadyRef.current = true;
      console.log("COCO-SSD model loaded successfully");
    } catch (error) {
      console.error("Error loading COCO-SSD model:", error);
      console.log(
        "Object detection will be disabled due to model loading failure"
      );
    }
  }, []);

  // Run object detection on current video frame
  const runDetection = useCallback(async () => {
    if (
      !modelRef.current ||
      !videoRef.current ||
      isDetectingRef.current ||
      !isModelReadyRef.current
    )
      return;

    isDetectingRef.current = true;
    console.log("Running COCO-SSD object detection...");

    try {
      // Run COCO-SSD detection on the video frame
      const predictions = await modelRef.current.detect(videoRef.current);
      console.log(
        "COCO-SSD detection completed, found",
        predictions.length,
        "objects"
      );

      // Filter predictions for target objects only
      const targetDetections = predictions
        .filter(
          (prediction) =>
            TARGET_CLASSES.includes(prediction.class) &&
            prediction.score >= DETECTION_CONFIG.CONFIDENCE_THRESHOLD
        )
        .map(
          (prediction): DetectionResult => ({
            class: prediction.class,
            confidence: prediction.score,
            bbox: [
              prediction.bbox[0], // x
              prediction.bbox[1], // y
              prediction.bbox[2], // width
              prediction.bbox[3], // height
            ] as [number, number, number, number],
          })
        );

      // Call callback with detections
      if (targetDetections.length > 0) {
        console.log(
          `Object detection found: ${targetDetections
            .map((d) => d.class)
            .join(", ")}`
        );
        onObjectDetection(targetDetections);
      }

      // Force garbage collection to prevent memory leaks
      if (typeof window !== "undefined" && (window as any).gc) {
        (window as any).gc();
      }
    } catch (error) {
      console.error("Error running object detection:", error);
    } finally {
      isDetectingRef.current = false;
    }
  }, [videoRef, onObjectDetection]);

  // Start periodic detection
  const startDetection = useCallback(() => {
    if (detectionIntervalRef.current) return;

    // Add delay before starting detection to ensure model is ready
    setTimeout(() => {
      detectionIntervalRef.current = setInterval(() => {
        if (isActive && !isDetectingRef.current && isModelReadyRef.current) {
          runDetection();
        }
      }, detectionInterval);
    }, 2000); // 2 second delay
  }, [isActive, runDetection, detectionInterval]);

  // Stop detection
  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Initialize model and start detection when active
  useEffect(() => {
    console.log(
      "Object detection useEffect - isActive:",
      isActive,
      "videoRef:",
      !!videoRef.current
    );
    if (isActive) {
      loadModel()
        .then(() => {
          console.log("Object detection model loaded, starting detection...");
          if (modelRef.current && videoRef.current) {
            startDetection();
          } else {
            console.log(
              "Cannot start object detection - missing model or video"
            );
          }
        })
        .catch((error) => {
          console.error("Failed to load object detection model:", error);
        });
    } else {
      stopDetection();
    }

    return () => {
      stopDetection();
    };
  }, [isActive, loadModel, startDetection, stopDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }
    };
  }, [stopDetection]);

  return {
    loadModel,
    startDetection,
    stopDetection,
    runDetection,
  };
};
