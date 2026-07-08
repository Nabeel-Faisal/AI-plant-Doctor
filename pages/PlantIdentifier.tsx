import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, ScanLine, CheckCircle, Droplets, Sun, Thermometer, Wind, Sprout, PlusCircle, SwitchCamera } from 'lucide-react';
import { fileToBase64, resizeImage, identifyPlant } from '../groqService';
import { PlantIdentificationResult, Plant } from '../types';
import { usePlantStore } from '../store';
import { useToast } from '../components/ToastProvider';

export const PlantIdentifier: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { addPlant } = usePlantStore();
  const { showToast } = useToast();
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
      showToast('Could not access camera. Check permissions or use Upload instead.', 'error');
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

  // Lock background scroll while the full-screen camera overlay is open
  useEffect(() => {
    document.body.style.overflow = step === 'camera' ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [step]);

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
      showToast('Identification failed. Please try again.', 'error');
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
    showToast(`${result.commonName} added to your garden.`, 'success');
    navigate(`/plant/${newPlant.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-4">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-blue-500/15 rounded-xl">
           <ScanLine className="w-6 h-6 text-blue-400" />
        </div>
        <div>
           <h1 className="font-display text-2xl font-bold text-fg">Plant Identifier</h1>
           <p className="text-muted text-sm">Snap a photo to get a full plant profile instantly.</p>
        </div>
      </div>

      {step === 'start' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <button
             onClick={startCamera}
             className="h-56 rounded-3xl glass hover:-translate-y-1 transition-transform flex flex-col items-center justify-center gap-4 group"
           >
             <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-white" />
             </div>
             <div className="text-center">
                <h3 className="font-display text-xl font-bold text-fg">Take Photo</h3>
                <p className="text-muted text-sm mt-1">Scan using your camera</p>
             </div>
           </button>

           <button
             onClick={() => fileInputRef.current?.click()}
             className="h-56 rounded-3xl glass hover:-translate-y-1 transition-transform flex flex-col items-center justify-center gap-4 group"
           >
             <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-white" />
             </div>
             <div className="text-center">
                <h3 className="font-display text-xl font-bold text-fg">Upload Photo</h3>
                <p className="text-muted text-sm mt-1">From your gallery</p>
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
             <button onClick={() => { stopCamera(); setStep('start'); }} className="absolute top-6 right-6 safe-top p-3 bg-black/50 rounded-full text-white z-10"><X /></button>
             <button onClick={switchCamera} className="absolute top-6 left-6 safe-top p-3 bg-black/50 rounded-full text-white z-10"><SwitchCamera /></button>
          </div>
          <div className="min-h-32 bg-black safe-bottom flex items-center justify-center py-6">
            <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
               <div className="w-16 h-16 bg-white rounded-full active:scale-90 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && image && (
         <div className="flex flex-col items-center gap-6">
            <img src={image} alt="Preview" className="w-full max-w-md rounded-2xl shadow-2xl border border-border" />
            <div className="flex gap-4 w-full max-w-md">
               <button onClick={() => { setImage(null); setStep('start'); }} className="flex-1 py-3 rounded-xl bg-surface border border-border text-fg font-bold">Retake</button>
               <button onClick={handleIdentify} className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30">Identify Plant</button>
            </div>
         </div>
      )}

      {step === 'analyzing' && (
         <div className="flex flex-col items-center justify-center py-20 animate-pulse text-center">
            <ScanLine className="w-20 h-20 text-blue-400 mb-6 animate-bounce" />
            <h2 className="font-display text-2xl font-bold text-fg">Scanning Features...</h2>
            <p className="text-muted mt-2">Identifying species, leaf patterns, and health indicators.</p>
         </div>
      )}

      {step === 'result' && result && (
         <div className="space-y-6 animate-fade-in">
            {/* Identity Card */}
            <div className="glass rounded-3xl p-5 md:p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

               <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                  <div className="w-full md:w-1/3">
                     <img src={image!} alt="Plant" className="w-full rounded-2xl border border-border shadow-lg" />
                     <button
                        onClick={handleSaveToGarden}
                        className="w-full mt-4 bg-accent text-bg py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgb(var(--accent)/0.35)] active:scale-95"
                     >
                        <PlusCircle className="w-5 h-5" /> Save to Garden
                     </button>
                  </div>

                  <div className="w-full md:w-2/3 space-y-4">
                     <div>
                        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-fg mb-1">{result.commonName}</h2>
                        <p className="text-lg text-accent italic font-serif">{result.scientificName}</p>
                     </div>
                     <p className="text-fg/80 leading-relaxed text-base sm:text-lg border-l-4 border-border pl-4">
                        {result.description}
                     </p>

                     {/* Quick Stats Grid */}
                     <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-bg/60 p-3 rounded-lg flex items-center gap-3">
                           <Droplets className="text-blue-400 w-5 h-5 flex-shrink-0" />
                           <span className="text-sm text-fg/80">{result.care.watering}</span>
                        </div>
                        <div className="bg-bg/60 p-3 rounded-lg flex items-center gap-3">
                           <Sun className="text-warning w-5 h-5 flex-shrink-0" />
                           <span className="text-sm text-fg/80">{result.care.sunlight}</span>
                        </div>
                        <div className="bg-bg/60 p-3 rounded-lg flex items-center gap-3">
                           <Thermometer className="text-danger w-5 h-5 flex-shrink-0" />
                           <span className="text-sm text-fg/80">{result.care.temperature}</span>
                        </div>
                        <div className="bg-bg/60 p-3 rounded-lg flex items-center gap-3">
                           <Wind className="text-cyan-400 w-5 h-5 flex-shrink-0" />
                           <span className="text-sm text-fg/80">{result.care.humidity}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Health & Tips Section */}
            <div className="grid md:grid-cols-2 gap-5">
               <div className="glass rounded-2xl p-6">
                  <h3 className="font-display text-xl font-bold text-fg mb-4 flex items-center gap-2">
                     <CheckCircle className="text-success w-5 h-5" /> Visual Health Check
                  </h3>
                  <p className="text-fg/80 mb-4">{result.healthStatusFromImage}</p>

                  <h4 className="font-bold text-fg mt-4 mb-2">Common Issues</h4>
                  <p className="text-muted text-sm">{result.commonIssues}</p>
               </div>

               <div className="glass rounded-2xl p-6">
                  <h3 className="font-display text-xl font-bold text-fg mb-4 flex items-center gap-2">
                     <Sprout className="text-accent w-5 h-5" /> Care Guide
                  </h3>
                  <div className="space-y-3">
                     <div>
                        <span className="text-xs font-bold text-muted uppercase">Soil</span>
                        <p className="text-fg/80">{result.care.soil}</p>
                     </div>
                     <div>
                        <span className="text-xs font-bold text-muted uppercase">Fertilizer</span>
                        <p className="text-fg/80">{result.care.fertilizer}</p>
                     </div>
                     <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 mt-4">
                        <span className="text-xs font-bold text-blue-400 uppercase mb-1 block">Pro Tip</span>
                        <p className="text-fg/80 text-sm">{result.beginnerTips}</p>
                     </div>
                  </div>
               </div>
            </div>

            <button onClick={() => { setImage(null); setResult(null); setStep('start'); }} className="w-full py-4 rounded-xl border border-border text-muted hover:bg-surface transition-colors">
               Identify Another Plant
            </button>
         </div>
      )}
    </div>
  );
};
