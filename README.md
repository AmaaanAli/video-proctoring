# Video Proctoring System

A comprehensive web-based video proctoring system built with Next.js, MediaPipe, and TensorFlow.js for real-time interview monitoring and integrity assessment.

## Features

### 🎥 Real-time Video Monitoring

- Webcam access and live video streaming
- High-quality video capture (1280x720)
- Real-time video analysis overlay

### 🧠 AI-Powered Detection

- **Face Detection**: MediaPipe Face Mesh for accurate face tracking
- **Focus Analysis**: Head pose estimation to detect looking away
- **Object Detection**: TensorFlow.js COCO-SSD for unauthorized items
- **Multiple Face Detection**: Identifies multiple people in frame

### 📊 Event Logging & Reporting

- Real-time event detection and logging
- Firebase Firestore integration for data persistence
- Comprehensive proctoring reports with integrity scores
- Export functionality (PDF/CSV ready)

### 🎯 Integrity Scoring System

- **Looking Away**: -5 points (5+ seconds)
- **Face Absent**: -10 points (10+ seconds)
- **Multiple Faces**: -15 points
- **Phone Detected**: -20 points
- **Book/Notes Detected**: -20 points

### 🎨 Modern UI/UX

- Clean, responsive design with Tailwind CSS
- Real-time status indicators
- Interactive event timeline
- Professional reporting interface

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **AI/ML**: MediaPipe Face Mesh, TensorFlow.js COCO-SSD
- **Database**: Firebase Firestore
- **Deployment**: Vercel-ready

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Modern web browser with camera access

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd video-proctoring
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Firebase** (Optional - for event logging)

   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore database
   - Copy your Firebase config to `src/lib/firebase.ts`
   - Replace the placeholder values with your actual config

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### Starting a Proctoring Session

1. **Initialize Camera**: Click "Initialize Camera" to access your webcam
2. **Start Proctoring**: Click "Start Proctoring" to begin AI monitoring
3. **Monitor Events**: Watch the real-time event log for any suspicious activity
4. **View Reports**: Click "View Reports" to see detailed analysis

### Demo Controls

For testing purposes, the system includes demo controls to simulate various events:

- Simulate Looking Away
- Simulate Face Absent
- Simulate Phone Detected
- Simulate Book Detected
- Simulate Multiple Faces

## Project Structure

```
src/
├── app/
│   ├── api/log-event/          # API routes for event logging
│   ├── report/                 # Reporting page
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main interview page
├── components/ui/              # shadcn/ui components
├── hooks/
│   ├── useFaceDetection.ts    # MediaPipe face detection
│   ├── useObjectDetection.ts  # TensorFlow.js object detection
│   └── useEventLogging.ts     # Firebase event logging
└── lib/
    ├── firebase.ts            # Firebase configuration
    └── utils.ts               # Utility functions
```

## API Endpoints

### POST /api/log-event

Log a proctoring event to the database.

**Request Body:**

```json
{
  "type": "looking_away",
  "description": "Candidate looked away from screen",
  "severity": "medium",
  "interviewId": "interview-123",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### GET /api/log-event?interviewId=interview-123

Retrieve events for a specific interview session.

## Configuration

### Firebase Setup

1. Create a new Firebase project
2. Enable Firestore Database
3. Update `src/lib/firebase.ts` with your config:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};
```

### Detection Thresholds

You can adjust detection sensitivity in the hook files:

- **Face Absent Threshold**: 10 seconds (in `useFaceDetection.ts`)
- **Looking Away Threshold**: 5 seconds (in `useFaceDetection.ts`)
- **Object Detection Interval**: 3 seconds (in `useObjectDetection.ts`)
- **Confidence Threshold**: 60% (in `useObjectDetection.ts`)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with default settings

### Other Platforms

The app is a standard Next.js application and can be deployed to any platform that supports Node.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 14.3+)
- **Edge**: Full support

**Note**: Camera access requires HTTPS in production.

## Performance Considerations

- **Face Detection**: Runs at ~30 FPS for smooth tracking
- **Object Detection**: Runs every 3 seconds to balance accuracy and performance
- **Memory Usage**: Optimized with proper cleanup and tensor disposal
- **Network**: Events are batched and logged asynchronously

## Security & Privacy

- All processing happens client-side (no video data sent to servers)
- Only event metadata is logged to Firebase
- Camera access requires explicit user permission
- No video recording or storage

## Troubleshooting

### Camera Not Working

- Ensure HTTPS in production
- Check browser permissions
- Try refreshing the page
- Test with different browsers

### AI Models Not Loading

- Check internet connection (models load from CDN)
- Verify browser supports WebGL
- Check browser console for errors

### Firebase Connection Issues

- Verify Firebase configuration
- Check Firestore rules allow writes
- Ensure project is properly set up

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Check the troubleshooting section
- Review the browser console for errors

---

**Built with ❤️ for secure online interviews**
