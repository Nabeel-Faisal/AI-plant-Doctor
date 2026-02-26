import React, { useRef, useState, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { b64ToUint8Array, uint8ArrayToBase64 } from '../geminiService';
import { Mic, Video, StopCircle, PlayCircle, Volume2, User, Sparkles, SwitchCamera } from 'lucide-react';

export const VoiceInteraction: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for UI
  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState('Ready');
  
  // Committed transcript history
  const [history, setHistory] = useState<{role: 'user'|'model', text: string}[]>([]);
  
  // Real-time accumulating text (for UI display while speaking/generating)
  const [realtimeUI, setRealtimeUI] = useState<{user: string, model: string}>({ user: '', model: '' });

  const [audioLevel, setAudioLevel] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Refs for logic (stale closure prevention & accumulation)
  const isLiveRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const intervalRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Accumulation Refs (Sources of Truth for transcription)
  const currentUserTextRef = useRef('');
  const currentModelTextRef = useRef('');

  // Update ref when state changes
  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  const stopSession = () => {
    setIsLive(false);
    isLiveRef.current = false;
    setStatus('Stopped');
    
    // 1. Stop Audio Input Processing
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    // 2. Close Audio Context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // 3. Stop Video Loop
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 4. Stop Camera Stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // 5. Stop Playing Audio
    audioSourcesRef.current.forEach(source => {
        try { source.stop(); } catch (e) {}
    });
    audioSourcesRef.current = [];
    
    // 6. Clean up session
    sessionRef.current = null;

    // 7. Clear Realtime UI
    setRealtimeUI({ user: '', model: '' });
    currentUserTextRef.current = '';
    currentModelTextRef.current = '';
  };

  const startSession = async () => {
    try {
      setStatus('Initializing Camera & Mic...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true
        }, 
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: facingMode
        } 
      });
      streamRef.current = stream;

      // Setup Video Preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }

      setStatus('Connecting to Plant AI...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Setup Audio Context for Output
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      nextStartTimeRef.current = audioCtx.currentTime;

      // Resume context immediately (resilience against browser suspension)
      await audioCtx.resume();

      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: `
            You are a Sentient Plant AI. You communicate via voice and vision.
            
            *** CRITICAL VISUAL VALIDATION PROTOCOL ***
            Your first task is always to analyze the video feed.
            
            CASE 1: NO PLANT VISIBLE
            If you see:
            - A human face (selfie mode)
            - A blank wall, ceiling, or floor
            - A car, street, or random objects
            - Darkness or blur
            
            YOU MUST STOP ROLEPLAYING IMMEDIATELY.
            Say exactly: "I don't see a plant here. Please point the camera at the plant so I can help."
            Do NOT attempt to guess the health or answer questions if you cannot see the plant.

            CASE 2: PLANT IS VISIBLE
            If you clearly see a plant, leaves, or a garden:
            - Adopt the persona of that specific plant.
            - Personality: Friendly, slightly witty, deeply caring about your own health.
            - Answer the user's questions based on your visual condition (color, droopiness, soil).
            - Keep answers concise (1-2 sentences) and conversational.
          `,
          inputAudioTranscription: {}, // Enable user transcription
          outputAudioTranscription: {}  // Enable model transcription
        },
        callbacks: {
          onopen: () => {
            setStatus("Connected! Say 'Hello Plant'");
            setIsLive(true);
            isLiveRef.current = true; // Immediate update
            
            // Use the promise to access the session safely
            sessionPromise.then(sess => {
                sessionRef.current = sess;
                startAudioInput(stream, sess);
                startVideoInput(sess);
            });
          },
          onmessage: async (msg: LiveServerMessage) => {
            const content = msg.serverContent;
            if (!content) return;

            // 1. Handle Audio Output
            const audioData = content.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
                playAudioChunk(audioData, audioContextRef.current);
            }

            // 2. Handle User Transcription (Accumulate)
            const inputTx = content.inputTranscription?.text;
            if (inputTx) {
               currentUserTextRef.current += inputTx;
               setRealtimeUI(prev => ({ ...prev, user: currentUserTextRef.current }));
            }

            // 3. Handle Model Transcription (Accumulate)
            const outputTx = content.outputTranscription?.text;
            if (outputTx) {
               currentModelTextRef.current += outputTx;
               setRealtimeUI(prev => ({ ...prev, model: currentModelTextRef.current }));
            }

            // 4. Handle Turn Complete (Commit to History)
            if (content.turnComplete) {
               setHistory(prev => {
                   const newItems: {role: 'user'|'model', text: string}[] = [];
                   if (currentUserTextRef.current.trim()) {
                       newItems.push({ role: 'user', text: currentUserTextRef.current.trim() });
                   }
                   if (currentModelTextRef.current.trim()) {
                       newItems.push({ role: 'model', text: currentModelTextRef.current.trim() });
                   }
                   return [...prev, ...newItems];
               });

               // Reset accumulators
               currentUserTextRef.current = '';
               currentModelTextRef.current = '';
               setRealtimeUI({ user: '', model: '' });
            }
          },
          onclose: () => {
            if (isLiveRef.current) {
                setStatus("Disconnected");
                stopSession();
            }
          },
          onerror: (err) => {
            console.error(err);
            setStatus("Error: " + err.message);
            stopSession();
          }
        }
      });
      
      sessionPromise.catch(err => {
        console.error("Connection Failed:", err);
        setStatus("Connection Failed. Retrying...");
        setIsLive(false); 
      });

    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + err.message);
      stopSession();
    }
  };

  const startAudioInput = (stream: MediaStream, session: any) => {
    if (!audioContextRef.current) return;

    // Create a specific context for input processing at 16kHz
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const inputCtx = new AudioContextClass({ sampleRate: 16000 });
    const source = inputCtx.createMediaStreamSource(stream);
    
    // ScriptProcessor for PCM extraction
    const processor = inputCtx.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
        if (!isLiveRef.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Visualizer level
        let sum = 0;
        for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
        const avg = sum / inputData.length;
        setAudioLevel(avg * 100);

        // PCM Conversion (Float32 -> Int16)
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        const base64Audio = uint8ArrayToBase64(new Uint8Array(pcmData.buffer));
        
        session.sendRealtimeInput({
            media: {
                mimeType: "audio/pcm;rate=16000",
                data: base64Audio
            }
        });
    };

    // Mute local feedback
    const gainNode = inputCtx.createGain();
    gainNode.gain.value = 0;

    source.connect(processor);
    processor.connect(gainNode);
    gainNode.connect(inputCtx.destination);
    
    sourceRef.current = source;
    processorRef.current = processor;
  };

  const startVideoInput = (session: any) => {
     intervalRef.current = window.setInterval(() => {
        if (!isLiveRef.current || !videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Send lower resolution for bandwidth optimization
        canvas.width = 320;
        canvas.height = 240;
        
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Remove data URL prefix
        const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
        
        session.sendRealtimeInput({
            media: {
                mimeType: "image/jpeg",
                data: base64
            }
        });
     }, 1000); 
  };

  const playAudioChunk = async (base64: string, ctx: AudioContext) => {
     try {
         const pcmData = b64ToUint8Array(base64);
         const float32Data = new Float32Array(pcmData.length / 2);
         const dataView = new DataView(pcmData.buffer);

         for (let i = 0; i < pcmData.length / 2; i++) {
            const int16 = dataView.getInt16(i * 2, true);
            float32Data[i] = int16 / 32768.0;
         }

         const buffer = ctx.createBuffer(1, float32Data.length, 24000);
         buffer.getChannelData(0).set(float32Data);

         const source = ctx.createBufferSource();
         source.buffer = buffer;
         source.connect(ctx.destination);
         
         const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
         source.start(startTime);
         nextStartTimeRef.current = startTime + buffer.duration;
         
         audioSourcesRef.current.push(source);
         source.onended = () => {
             audioSourcesRef.current = audioSourcesRef.current.filter(s => s !== source);
         };
     } catch (e) {
         console.error("Error decoding audio chunk", e);
     }
  };

  const toggleCamera = async () => {
      // If we are not live, just toggle the state preference
      if (!isLiveRef.current) {
          setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
          return;
      }

      // If live, we need to restart the stream
      const newMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(newMode);

      try {
          // Cleanup old stream
          if (streamRef.current) {
              const tracks = streamRef.current.getTracks();
              tracks.forEach(t => t.stop());
          }
          if (sourceRef.current) {
             sourceRef.current.disconnect();
          }
          if (processorRef.current) {
              processorRef.current.disconnect();
          }

          const newStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                autoGainControl: true,
                noiseSuppression: true
              },
              video: {
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                  facingMode: newMode
              }
          });

          streamRef.current = newStream;
          if (videoRef.current) {
              videoRef.current.srcObject = newStream;
          }
          
          if (sessionRef.current) {
              startAudioInput(newStream, sessionRef.current);
          }

      } catch (e) {
          console.error("Camera switch failed", e);
          setStatus("Camera Switch Error");
      }
  };

  useEffect(() => {
    return () => {
        stopSession();
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
               <Mic className="w-8 h-8 text-emerald-400" />
               Live Plant Talk
            </h1>
            <p className="text-slate-400">Ask your plant anything. The AI sees what you see.</p>
         </div>
         <div className={`px-4 py-2 rounded-full font-mono text-xs font-bold self-start md:self-center ${isLive ? 'bg-green-900/50 text-green-400 border border-green-500 animate-pulse' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
            STATUS: {status.toUpperCase()}
         </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
         {/* Visual Feed */}
         <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-2xl aspect-video group">
               <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
               />
               <canvas ref={canvasRef} className="hidden" />
               
               {/* Overlay UI */}
               <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
                  <div className="flex justify-between items-start pointer-events-auto">
                     <div className="bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
                        <Video className="w-3 h-3 text-red-500 animate-pulse" />
                        Live Feed
                     </div>
                     <button 
                        onClick={toggleCamera}
                        className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur transition-all"
                     >
                        <SwitchCamera className="w-5 h-5" />
                     </button>
                  </div>
                  
                  {isLive && (
                     <div className="self-center">
                        <div className="flex items-center gap-1 h-12">
                           {[...Array(5)].map((_, i) => (
                              <div 
                                 key={i} 
                                 className="w-2 bg-emerald-400 rounded-full transition-all duration-75"
                                 style={{ 
                                    height: `${Math.max(10, Math.min(100, audioLevel * (i+1) * 2))}%`,
                                    opacity: 0.8 
                                 }}
                              />
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               {!isLive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                     <button 
                        onClick={startSession}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-emerald-900/50 flex items-center gap-3 transition-transform active:scale-95 group-hover:scale-105"
                     >
                        <PlayCircle className="w-6 h-6" />
                        Start Conversation
                     </button>
                  </div>
               )}
            </div>

            {isLive && (
               <button 
                  onClick={stopSession}
                  className="w-full bg-red-900/20 border border-red-500/50 text-red-200 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-900/30 transition-colors"
               >
                  <StopCircle className="w-5 h-5" />
                  End Session
               </button>
            )}
         </div>

         {/* Conversation Log & Tips */}
         <div className="flex flex-col h-[500px] lg:h-auto lg:min-h-[500px] bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-800 flex items-center gap-2">
               <Sparkles className="w-5 h-5 text-purple-400" />
               <h3 className="font-bold text-white">Live Transcript</h3>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar flex flex-col-reverse">
               {/* Current Real-time Bubbles (Typing effect) */}
               {realtimeUI.model && (
                  <div className="flex gap-3 justify-start opacity-70">
                     <div className="w-8 h-8 rounded-full bg-emerald-900/50 border border-emerald-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                     </div>
                     <div className="p-3 rounded-2xl max-w-[80%] text-sm bg-emerald-900/10 border border-emerald-500/10 text-emerald-100 rounded-bl-none italic">
                        {realtimeUI.model} <span className="animate-pulse">|</span>
                     </div>
                  </div>
               )}
               {realtimeUI.user && (
                  <div className="flex gap-3 justify-end opacity-70">
                     <div className="p-3 rounded-2xl max-w-[80%] text-sm bg-slate-700/50 text-white rounded-br-none italic">
                        {realtimeUI.user} <span className="animate-pulse">|</span>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center flex-shrink-0 animate-pulse">
                        <User className="w-4 h-4 text-slate-300" />
                     </div>
                  </div>
               )}

               {/* History Log */}
               {history.length === 0 && !realtimeUI.user && !realtimeUI.model ? (
                  <div className="text-center text-slate-500 py-10">
                     <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                     <p>Start the session and speak to your plant.</p>
                     <p className="text-xs mt-2 opacity-60">"Are you healthy?" • "Do you need water?"</p>
                  </div>
               ) : (
                  [...history].reverse().map((t, i) => (
                     <div key={i} className={`flex gap-3 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {t.role === 'model' && (
                           <div className="w-8 h-8 rounded-full bg-emerald-900/50 border border-emerald-500 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-4 h-4 text-emerald-400" />
                           </div>
                        )}
                        <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                           t.role === 'user' 
                              ? 'bg-slate-700 text-white rounded-br-none' 
                              : 'bg-emerald-900/20 border border-emerald-500/20 text-emerald-100 rounded-bl-none'
                        }`}>
                           {t.text}
                        </div>
                        {t.role === 'user' && (
                           <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-slate-300" />
                           </div>
                        )}
                     </div>
                  ))
               )}
            </div>
            
            <div className="p-4 bg-slate-900/50 text-xs text-slate-500 border-t border-slate-800 text-center">
               Microphone active • AI listening • Video analyzing
            </div>
         </div>
      </div>
    </div>
  );
};