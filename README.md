# 🌿 AI Plant Doctor

AI Plant Doctor is a progressive disease prediction system for plants that uses **Gemini 3 Vision** to detect micro-pattern deviations and forecast health risks before symptoms appear. This application transforms reactive plant care into proactive biological management.

## 🚀 Key Features

### 🩺 Predictive Health Analysis
Unlike traditional apps that identify diseases after they manifest, AI Plant Doctor uses high-resolution visual analysis to detect early-stage chlorosis, turgidity loss, and micro-fungal patterns. It provides a **7-day health trajectory** and specific treatment timelines.

### 🎙️ Live Multimodal Interaction
Experience the future of plant care with **Live Plant Talk**. Powered by the **Gemini Live API**, you can have a real-time, low-latency conversation with your plant. Point your camera, and the AI will analyze the live video feed to respond as if it were the plant itself.

### 📈 Digital Twin Growth Simulation
Our **Growth Simulation Engine** creates a digital twin of your plant. By combining current visual data with environmental factors (soil, light, humidity), it generates 14, 30, and 60-day visual projections of your plant's growth and potential risks.

### 🎭 Plant Mood Inference
The **PlantMood-AI** engine translates biological signals—like leaf posture and stem stiffness—into human-relatable emotions. Understand if your plant is "Happy," "Thirsty," or experiencing "Nutrient Shock" through a fun yet scientifically grounded interface.

### 🔍 Intelligent Identification
Instantly identify species and receive comprehensive care profiles, including ideal temperature ranges, soil types, and common issues specific to that genus.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI Models**: 
  - `gemini-3-pro-preview` (Complex Reasoning & Analysis)
  - `gemini-2.5-flash-native-audio-preview-09-2025` (Live Multimodal API)
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **Build System**: Vite

## ⚙️ Configuration

### Environment Variables
The application requires a Gemini API key to function. Define it in your `.env` file:

```env
GEMINI_API_KEY=your_google_ai_studio_api_key
```

### Permissions
To enable the full experience, the following browser permissions are required:
- **Camera**: Used for plant identification, health scanning, and the Live API video feed.
- **Microphone**: Required for real-time voice interaction in the Live Plant Talk module.

## 📖 Usage Guide

1. **Dashboard**: Your central hub for monitoring all saved plants.
2. **Identify**: Start here to add a new plant to your collection.
3. **Detail View**: Access deep analysis, health scores, and treatment recommendations.
4. **Simulate**: Test different environmental scenarios to see how your plant will grow.
5. **Talk**: Enter the Live Interaction mode for a real-time diagnostic session.

---
