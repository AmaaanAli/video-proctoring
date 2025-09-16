// Configuration constants for the video proctoring system

export const DETECTION_CONFIG = {
  // Face detection thresholds (in milliseconds)
  FACE_ABSENT_THRESHOLD: 10000, // 10 seconds
  LOOKING_AWAY_THRESHOLD: 5000, // 5 seconds

  // Object detection settings
  OBJECT_DETECTION_INTERVAL: 3000, // 3 seconds
  CONFIDENCE_THRESHOLD: 0.6, // 60%

  // Integrity score deductions
  SCORE_DEDUCTIONS: {
    LOOKING_AWAY: 5,
    FACE_ABSENT: 10,
    MULTIPLE_FACES: 15,
    PHONE_DETECTED: 20,
    BOOK_DETECTED: 20,
  },

  // Video settings
  VIDEO_WIDTH: 1280,
  VIDEO_HEIGHT: 720,

  // Event deduplication (in milliseconds)
  EVENT_COOLDOWN: {
    FACE_EVENTS: 5000, // 5 seconds
    OBJECT_EVENTS: 10000, // 10 seconds
  },
};

export const TARGET_OBJECTS = [
  "cell phone",
  "book",
  "laptop",
  "mouse",
  "keyboard",
];

export const EVENT_TYPES = {
  FACE_ABSENT: "face_absent",
  LOOKING_AWAY: "looking_away",
  MULTIPLE_FACES: "multiple_faces",
  PHONE_DETECTED: "phone_detected",
  BOOK_DETECTED: "book_detected",
} as const;

export const SEVERITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;
