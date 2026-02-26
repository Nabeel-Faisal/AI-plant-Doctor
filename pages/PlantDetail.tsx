import React, { useState, useRef, useEffect } from 'react';
import { usePlantStore } from '../store';
import { AnalysisView } from '../components/AnalysisView';
import { Camera, ChevronLeft, Upload, Loader2, History, AlertCircle, X, SwitchCamera, Check, RefreshCw, Sparkles, ArrowRight, Smile, Zap } from 'lucide-react';
import { analyzePlantImage, fileToBase64, resizeImage } from '../geminiService';

interface Props {
  plantId: string;
  onBack: () => void;
  }

export const PlantDetail: React.FC<Props> = ({ plantId, onBack }) => {
  const { getPlant, addLogToPlant } = usePlantStore();
  const plant = getPlant(plantId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // State to show the latest analysis result
  const [selectedLogIndex, setSelectedLogIndex] = useState<number>(0);

  // Moved stopCamera definition up before useEffect
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Handle camera stream cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // If plant not found
  if (!plant) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Plant Not Found</h2>
        <p className="text-slate-400 mb-6">The plant you are looking for does not exist or has been deleted.</p>
        <button 
          onClick={() => window.location.hash = '#/dashboard'}
          className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const logs = plant.logs || [];
  const currentLog = logs[selectedLogIndex];

  const processImage = async (rawBase64: string) => {
    setIsAnalyzing(true);
    setError(null);
    setShowCamera(false);
    setCapturedImage(null);

    try {
      // 1. Resize Image
      const optimizedImage = await resizeImage(rawBase64, 600); // Resize max 600px
      const thumbImage = await resizeImage(rawBase64, 200); // For list

      // 2. Get previous image for comparison
      const previousImage = logs.length > 0 ? logs[0].imageUrl : undefined;

      // 3. Call Gemini
      const analysis = await analyzePlantImage(optimizedImage, previousImage, `${plant.name} (${plant.species})`);

      // 4. Save Log
      const newLog = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        imageUrl: optimizedImage,
        thumbnailUrl: thumbImage,
        analysis
      };

      addLogToPlant(plant.id, newLog);
      setSelectedLogIndex(0); // View the new log

    } catch (err: any) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rawBase64 = await fileToBase64(file);
      await processImage(rawBase64);
    } catch (err: any) {
      setError(err.message);
      setIsAnalyzing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      setShowCamera(true);
      setCapturedImage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: cameraFacingMode } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Could not access camera. Please check permissions or use Upload.");
      setShowCamera(false);
    }
  };

  const closeCamera = () => {
    stopCamera();
    setShowCamera(false);
    setCapturedImage(null);
  }

  const handleSwitchCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    const newMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(newMode);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: newMode } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera switch failed", err);
      setError("Could not switch camera.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      // Flip horizontal if user facing mode for better UX (mirror)
      if (cameraFacingMode === 'user') {
        ctx?.translate(canvas.width, 0);
        ctx?.scale(-1, 1);
      }
      ctx?.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(base64);
      // We don't stop the camera yet, in case they want to retake
    }
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      stopCamera();
      processImage(capturedImage);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const navigateToSimulation = () => {
    window.location.hash = `#/plant/${plantId}/simulate`;
  };

  const navigateToMood = () => {
    window.location.hash = `#/plant/${plantId}/mood`;
  };

  return (
    <div className="relative">
      
      {/* Main Content */}
      <div className="space-y-6 animate-fade-in">
        
        {/* Navigation & Title */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
          >
            <ChevronLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{plant.name}</h1>
            <p className="text-slate-400 text-sm">{plant.species}</p>
          </div>
        </div>

        {/* Core Actions (Camera/Upload) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={startCamera}
            disabled={isAnalyzing}
            className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl shadow-lg shadow-green-900/40 flex flex-col items-center justify-center gap-2 font-bold transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <Loader2 className="animate-spin w-6 h-6" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
            <span>Live Camera</span>
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl shadow-lg flex flex-col items-center justify-center gap-2 font-bold transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Upload className="w-6 h-6" />
            <span>Upload File</span>
          </button>

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload}
          />
        </div>

        {/* AI Advanced Tools Section */}
        {logs.length > 0 && !isAnalyzing && (
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">AI Diagnostics</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {/* Digital Twin Button */}
               <button 
                  onClick={navigateToSimulation}
                  className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between shadow-lg hover:border-purple-500/60 transition-all group"
               >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-900/50 p-2 rounded-lg group-hover:bg-purple-900 transition-colors">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-bold text-sm">Growth Simulator</h3>
                      <p className="text-slate-400 text-xs">Predict future health</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-400" />
               </button>

               {/* Plant Mood Button */}
               <button 
                  onClick={navigateToMood}
                  className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between shadow-lg hover:border-orange-500/60 transition-all group"
               >
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-900/50 p-2 rounded-lg group-hover:bg-orange-900 transition-colors">
                      <Smile className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-bold text-sm">Check Mood</h3>
                      <p className="text-slate-400 text-xs">Emotional inference</p>
                    </div>
                  </div>
                  <Zap className="w-4 h-4 text-orange-400 fill-orange-400" />
               </button>
             </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
            <AlertCircle className="flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {logs.length === 0 && !isAnalyzing && (
          <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
            <div className="relative inline-block mb-4">
              <Camera className="w-12 h-12 text-slate-600" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping" />
            </div>
            <h3 className="text-xl font-semibold text-slate-300">Start Health Tracking</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">
              Use the <b>Live Camera</b> to scan your plant. 
              The AI will detect early signs of disease invisible to the naked eye.
            </p>
          </div>
        )}
        
        {isAnalyzing && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 p-8 rounded-2xl text-center animate-pulse">
                <Loader2 className="w-10 h-10 text-emerald-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-bold text-emerald-100">AI Plant Doctor is Analyzing...</h3>
                <p className="text-emerald-400/70 mt-2">Checking for micro-patterns, color deviations, and structural stress.</p>
            </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {currentLog && currentLog.analysis && !isAnalyzing ? (
              <AnalysisView result={currentLog.analysis} />
            ) : null}
          </div>

          {/* Sidebar / History */}
          {logs.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-400 flex items-center gap-2">
                <History className="w-4 h-4" /> History
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {logs.map((log, idx) => (
                  <div 
                    key={log.id}
                    onClick={() => setSelectedLogIndex(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex gap-3 items-center ${
                      selectedLogIndex === idx 
                        ? 'bg-slate-700 border-green-500 shadow-md' 
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700/50'
                    }`}
                  >
                    <img 
                      src={log.thumbnailUrl} 
                      alt="Thumbnail" 
                      className="w-16 h-16 rounded-lg object-cover bg-slate-900" 
                    />
                    <div>
                      <div className="text-sm font-bold text-white">
                        {new Date(log.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-400">
                        Score: <span className={
                          (log.analysis?.healthScore || 0) > 80 ? 'text-green-400' : 'text-yellow-400'
                        }>{log.analysis?.healthScore}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
             {!capturedImage ? (
                <>
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    className={`absolute w-full h-full object-cover ${cameraFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />
                  
                  {/* Grid overlay for framing */}
                  <div className="absolute inset-0 pointer-events-none opacity-30 grid grid-cols-3 grid-rows-3">
                      <div className="border-r border-b border-white/50"></div>
                      <div className="border-r border-b border-white/50"></div>
                      <div className="border-b border-white/50"></div>
                      <div className="border-r border-b border-white/50"></div>
                      <div className="border-r border-b border-white/50"></div>
                      <div className="border-b border-white/50"></div>
                      <div className="border-r border-white/50"></div>
                      <div className="border-r border-white/50"></div>
                      <div></div>
                  </div>

                  {/* Scanning Animation Line */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="w-full h-1 bg-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.8)] animate-[scan_3s_ease-in-out_infinite]" />
                  </div>
                  <style>{`
                    @keyframes scan {
                      0% { transform: translateY(-10%); opacity: 0; }
                      10% { opacity: 1; }
                      90% { opacity: 1; }
                      100% { transform: translateY(110%); opacity: 0; }
                    }
                  `}</style>
                </>
             ) : (
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="absolute w-full h-full object-contain bg-black" 
                />
             )}

             <button 
               onClick={closeCamera}
               className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 z-10"
             >
               <X className="w-6 h-6" />
             </button>
             
             {!capturedImage && (
               <button 
                 onClick={handleSwitchCamera}
                 className="absolute top-6 left-6 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 z-10"
               >
                 <SwitchCamera className="w-6 h-6" />
               </button>
             )}
          </div>

          <div className="h-32 bg-[#0f172a] flex items-center justify-center gap-8 relative z-20 px-6">
            {!capturedImage ? (
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group focus:outline-none hover:bg-white/10 transition-colors"
              >
                <div className="w-16 h-16 bg-white rounded-full transition-transform group-active:scale-90" />
              </button>
            ) : (
              <div className="flex w-full justify-between items-center max-w-sm mx-auto">
                 <button 
                  onClick={retakePhoto}
                  className="flex flex-col items-center gap-1 text-slate-300 hover:text-white"
                >
                  <div className="p-3 bg-slate-800 rounded-full">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <span className="text-sm">Retake</span>
                </button>

                <button 
                  onClick={confirmPhoto}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-green-900/50 active:scale-95 transition-all"
                >
                  <Check className="w-6 h-6" />
                  Analyze
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};