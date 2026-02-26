import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, ScanLine, Loader2, CheckCircle, Droplets, Sun, Thermometer, Wind, Sprout, PlusCircle, SwitchCamera } from 'lucide-react';
import { fileToBase64, resizeImage, identifyPlant } from '../geminiService';
import { PlantIdentificationResult, Plant } from '../types';
import { usePlantStore } from '../store';

export const PlantIdentifier: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { addPlant } = usePlantStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<'start' | 'camera' | 'preview' | 'analyzing' | 'result'>('start');
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<PlantIdentificationResult | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep('camera');
    } catch (err) {
      console.error(err);
      alert("Could not access camera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (facingMode === 'user') {
        ctx?.translate(canvas.width, 0);
        ctx?.scale(-1, 1);
      }
      ctx?.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      setImage(base64);
      stopCamera();
      setStep('preview');
    }
  };

  const switchCamera = async () => {
      stopCamera();
      const newMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(newMode);
      // Wait a tick for state update then restart
      setTimeout(async () => {
         try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: newMode }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
         } catch(e) { console.error(e) }
      }, 100);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setImage(base64);
      setStep('preview');
    }
  };

  const handleIdentify = async () => {
    if (!image) return;
    setStep('analyzing');
    try {
      const resized = await resizeImage(image, 800);
      const data = await identifyPlant(resized);
      setResult(data);
      setStep('result');
    } catch (e) {
      console.error(e);
      alert("Identification failed. Please try again.");
      setStep('preview');
    }
  };

  const handleSaveToGarden = () => {
    if (!result || !image) return;
    const newPlant: Plant = {
      id: crypto.randomUUID(),
      name: result.commonName,
      species: result.scientificName,
      dateAdded: new Date().toISOString(),
      logs: [{
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        imageUrl: image,
        thumbnailUrl: image, // Use same for now, or resize
        notes: "Identified via Plant Scanner"
      }]
    };
    addPlant(newPlant);
    navigate(`/plant/${newPlant.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-900/30 rounded-xl">
           <ScanLine className="w-6 h-6 text-blue-400" />
        </div>
        <div>
           <h1 className="text-2xl font-bold text-white">Plant Identifier</h1>
           <p className="text-slate-400 text-sm">Snap a photo to get a full plant profile instantly.</p>
        </div>
      </div>

      {step === 'start' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <button 
             onClick={startCamera}
             className="h-64 rounded-3xl bg-slate-800 border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center gap-4 group"
           >
             <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-white" />
             </div>
             <div className="text-center">
                <h3 className="text-xl font-bold text-white">Take Photo</h3>
                <p className="text-slate-400 text-sm mt-1">Scan using your camera</p>
             </div>
           </button>

           <button 
             onClick={() => fileInputRef.current?.click()}
             className="h-64 rounded-3xl bg-slate-800 border-2 border-dashed border-slate-700 hover:border-purple-500 hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center gap-4 group"
           >
             <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-white" />
             </div>
             <div className="text-center">
                <h3 className="text-xl font-bold text-white">Upload Photo</h3>
                <p className="text-slate-400 text-sm mt-1">From your gallery</p>
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
           </button>
        </div>
      )}

      {step === 'camera' && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
             <video 
               ref={videoRef}
               autoPlay 
               playsInline 
               className={`absolute w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
             />
             <div className="absolute inset-0 pointer-events-none opacity-30 grid grid-cols-3 grid-rows-3">
                 <div className="border-r border-b border-white/50"></div><div className="border-r border-b border-white/50"></div><div className="border-b border-white/50"></div>
                 <div className="border-r border-b border-white/50"></div><div className="border-r border-b border-white/50"></div><div className="border-b border-white/50"></div>
                 <div className="border-r border-white/50"></div><div className="border-r border-white/50"></div><div></div>
             </div>
             <button onClick={() => { stopCamera(); setStep('start'); }} className="absolute top-6 right-6 p-3 bg-black/50 rounded-full text-white z-10"><X /></button>
             <button onClick={switchCamera} className="absolute top-6 left-6 p-3 bg-black/50 rounded-full text-white z-10"><SwitchCamera /></button>
          </div>
          <div className="h-32 bg-slate-900 flex items-center justify-center">
            <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
               <div className="w-16 h-16 bg-white rounded-full active:scale-90 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && image && (
         <div className="flex flex-col items-center gap-6">
            <img src={image} alt="Preview" className="w-full max-w-md rounded-2xl shadow-2xl border border-slate-700" />
            <div className="flex gap-4 w-full max-w-md">
               <button onClick={() => { setImage(null); setStep('start'); }} className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-bold">Retake</button>
               <button onClick={handleIdentify} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/50">Identify Plant</button>
            </div>
         </div>
      )}

      {step === 'analyzing' && (
         <div className="flex flex-col items-center justify-center py-20 animate-pulse text-center">
            <ScanLine className="w-20 h-20 text-blue-500 mb-6 animate-bounce" />
            <h2 className="text-2xl font-bold text-white">Scanning Features...</h2>
            <p className="text-slate-400 mt-2">Identifying species, leaf patterns, and health indicators.</p>
         </div>
      )}

      {step === 'result' && result && (
         <div className="space-y-8 animate-fade-in">
            {/* Identity Card */}
            <div className="bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-700 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
               
               <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-full md:w-1/3">
                     <img src={image!} alt="Plant" className="w-full rounded-2xl border border-slate-600 shadow-lg" />
                     <button 
                        onClick={handleSaveToGarden}
                        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/40"
                     >
                        <PlusCircle className="w-5 h-5" /> Save to Garden
                     </button>
                  </div>
                  
                  <div className="w-full md:w-2/3 space-y-4">
                     <div>
                        <h2 className="text-4xl font-black text-white mb-1">{result.commonName}</h2>
                        <p className="text-lg text-emerald-400 italic font-serif">{result.scientificName}</p>
                     </div>
                     <p className="text-slate-300 leading-relaxed text-lg border-l-4 border-slate-600 pl-4">
                        {result.description}
                     </p>

                     {/* Quick Stats Grid */}
                     <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-slate-900/50 p-3 rounded-lg flex items-center gap-3">
                           <Droplets className="text-blue-400" />
                           <span className="text-sm text-slate-300">{result.care.watering}</span>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg flex items-center gap-3">
                           <Sun className="text-yellow-400" />
                           <span className="text-sm text-slate-300">{result.care.sunlight}</span>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg flex items-center gap-3">
                           <Thermometer className="text-red-400" />
                           <span className="text-sm text-slate-300">{result.care.temperature}</span>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg flex items-center gap-3">
                           <Wind className="text-cyan-400" />
                           <span className="text-sm text-slate-300">{result.care.humidity}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Health & Tips Section */}
            <div className="grid md:grid-cols-2 gap-6">
               <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                     <CheckCircle className="text-green-400" /> Visual Health Check
                  </h3>
                  <p className="text-slate-300 mb-4">{result.healthStatusFromImage}</p>
                  
                  <h4 className="font-bold text-slate-200 mt-4 mb-2">Common Issues</h4>
                  <p className="text-slate-400 text-sm">{result.commonIssues}</p>
               </div>

               <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                     <Sprout className="text-emerald-400" /> Care Guide
                  </h3>
                  <div className="space-y-3">
                     <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Soil</span>
                        <p className="text-slate-300">{result.care.soil}</p>
                     </div>
                     <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Fertilizer</span>
                        <p className="text-slate-300">{result.care.fertilizer}</p>
                     </div>
                     <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/20 mt-4">
                        <span className="text-xs font-bold text-blue-400 uppercase mb-1 block">Pro Tip</span>
                        <p className="text-blue-100 text-sm">{result.beginnerTips}</p>
                     </div>
                  </div>
               </div>
            </div>
            
            <button onClick={() => { setImage(null); setResult(null); setStep('start'); }} className="w-full py-4 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
               Identify Another Plant
            </button>
         </div>
      )}
    </div>
  );
};