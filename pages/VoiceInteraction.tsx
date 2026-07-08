import React, { useRef, useState, useEffect } from 'react';
import { Mic, Video, StopCircle, PlayCircle, Volume2, User, Sparkles, SwitchCamera } from 'lucide-react';
import { postJson } from '../groqService';

const SPEECH_THRESHOLD = 0.02;
const SILENCE_DURATION_MS = 900;
const MIN_SPEECH_DURATION_MS = 400;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const VoiceInteraction: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [history, setHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [realtimeUI, setRealtimeUI] = useState<{ user: string; model: string }>({ user: '', model: '' });
  const [audioLevel, setAudioLevel] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const isLiveRef = useRef(false);
  const isProcessingRef = useRef(false);
  const historyRef = useRef<{ role: 'user' | 'model'; text: string }[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const playbackCtxRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const analyserCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadFrameRef = useRef<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const speechStartedAtRef = useRef<number | null>(null);
  const silenceStartedAtRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const stopSession = () => {
    setIsLive(false);
    isLiveRef.current = false;
    isProcessingRef.current = false;
    setStatus('Stopped');

    if (vadFrameRef.current) {
      cancelAnimationFrame(vadFrameRef.current);
      vadFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    isRecordingRef.current = false;

    if (analyserCtxRef.current) {
      analyserCtxRef.current.close();
      analyserCtxRef.current = null;
      analyserRef.current = null;
    }

    if (playbackCtxRef.current) {
      playbackCtxRef.current.close();
      playbackCtxRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    audioSourcesRef.current = [];

    setRealtimeUI({ user: '', model: '' });
    setAudioLevel(0);
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.6);
  };

  const runVadLoop = () => {
    if (!isLiveRef.current || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);
    setAudioLevel(rms * 400);

    const now = performance.now();

    if (!isProcessingRef.current) {
      if (rms > SPEECH_THRESHOLD) {
        silenceStartedAtRef.current = null;
        if (!isRecordingRef.current) {
          startRecording();
        }
      } else if (isRecordingRef.current) {
        if (silenceStartedAtRef.current === null) {
          silenceStartedAtRef.current = now;
        } else if (now - silenceStartedAtRef.current > SILENCE_DURATION_MS) {
          const spokeFor = speechStartedAtRef.current ? now - speechStartedAtRef.current : 0;
          if (spokeFor > MIN_SPEECH_DURATION_MS) {
            stopRecording();
          } else {
            // Too short — likely noise, discard and keep listening
            cancelRecording();
          }
        }
      }
    }

    vadFrameRef.current = requestAnimationFrame(runVadLoop);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    const audioOnlyStream = new MediaStream(streamRef.current.getAudioTracks());
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    const recorder = new MediaRecorder(audioOnlyStream, { mimeType });
    recordedChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    isRecordingRef.current = true;
    speechStartedAtRef.current = performance.now();
    silenceStartedAtRef.current = null;
    setStatus('Listening...');
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    isRecordingRef.current = false;
    speechStartedAtRef.current = null;
    silenceStartedAtRef.current = null;
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    isRecordingRef.current = false;
    isProcessingRef.current = true;

    const recorder = mediaRecorderRef.current;
    recorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType });
      recordedChunksRef.current = [];
      await processTurn(blob);
    };
    recorder.stop();
    mediaRecorderRef.current = null;
  };

  const processTurn = async (audioBlob: Blob) => {
    try {
      setStatus('Transcribing...');
      const audioBase64 = await blobToBase64(audioBlob);
      const { text: rawTranscript } = await postJson<{ text: string }>('/api/voice-transcribe', {
        audioBase64,
        mimeType: audioBlob.type || 'audio/webm',
      });

      const transcript = rawTranscript.trim();
      if (transcript.length < 2) {
        setStatus("Connected! Say 'Hello Plant'");
        isProcessingRef.current = false;
        return;
      }

      setRealtimeUI(prev => ({ ...prev, user: transcript }));
      setStatus('Thinking...');

      const frame = captureFrame();

      const chatMessages: any[] = [
        ...historyRef.current.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text })),
        {
          role: 'user',
          content: [
            { type: 'text', text: transcript },
            ...(frame ? [{ type: 'image_url', image_url: { url: frame } }] : []),
          ],
        },
      ];

      const chatResponse = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages }),
      });

      if (!chatResponse.ok || !chatResponse.body) {
        let message = `Chat request failed (${chatResponse.status})`;
        try {
          const data = await chatResponse.json();
          if (data?.error) message = data.error;
        } catch {
          // response wasn't JSON
        }
        throw new Error(message);
      }

      let replyText = '';
      const reader = chatResponse.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        replyText += decoder.decode(value, { stream: true });
        setRealtimeUI(prev => ({ ...prev, model: replyText }));
      }
      replyText = replyText.trim();

      setHistory(prev => [...prev, { role: 'user', text: transcript }, { role: 'model', text: replyText || '...' }]);
      setRealtimeUI({ user: '', model: '' });

      if (replyText) {
        setStatus('Speaking...');
        await speakReply(replyText);
      }

      setStatus("Connected! Say 'Hello Plant'");
    } catch (err: any) {
      console.error('Turn processing failed:', err);
      setStatus('Error: ' + (err?.message || 'processing failed'));
    } finally {
      isProcessingRef.current = false;
    }
  };

  const speakReply = async (text: string) => {
    if (!playbackCtxRef.current) return;
    try {
      const response = await fetch('/api/voice-speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error(`Speech request failed (${response.status})`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await playbackCtxRef.current.decodeAudioData(arrayBuffer);

      await new Promise<void>((resolve) => {
        const source = playbackCtxRef.current!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(playbackCtxRef.current!.destination);
        audioSourcesRef.current.push(source);
        source.onended = () => {
          audioSourcesRef.current = audioSourcesRef.current.filter(s => s !== source);
          resolve();
        };
        source.start();
      });
    } catch (err) {
      console.error('TTS playback failed (does your Groq account have TTS model terms accepted?):', err);
    }
  };

  const startSession = async () => {
    try {
      setStatus('Initializing Camera & Mic...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true,
        },
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode,
        },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

      const playbackCtx = new AudioContextClass();
      playbackCtxRef.current = playbackCtx;
      await playbackCtx.resume();

      const analyserCtx = new AudioContextClass();
      analyserCtxRef.current = analyserCtx;
      const source = analyserCtx.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));
      const analyser = analyserCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsLive(true);
      isLiveRef.current = true;
      setStatus("Connected! Say 'Hello Plant'");
      vadFrameRef.current = requestAnimationFrame(runVadLoop);
    } catch (err: any) {
      console.error(err);
      setStatus('Error: ' + err.message);
      stopSession();
    }
  };

  const toggleCamera = async () => {
    if (!isLiveRef.current) {
      setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
      return;
    }

    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true,
        },
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: newMode,
        },
      });

      streamRef.current = newStream;
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      if (analyserCtxRef.current && analyserRef.current) {
        const source = analyserCtxRef.current.createMediaStreamSource(new MediaStream(newStream.getAudioTracks()));
        source.connect(analyserRef.current);
      }
    } catch (e) {
      console.error('Camera switch failed', e);
      setStatus('Camera Switch Error');
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-fg flex items-center gap-3">
               <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-accent" />
               Live Plant Talk
            </h1>
            <p className="text-muted">Ask your plant anything. The AI sees what you see.</p>
         </div>
         <div className={`px-4 py-2 rounded-full font-mono text-xs font-bold self-start md:self-center ${isLive ? 'bg-success/15 text-success border border-success/40 animate-pulse' : 'bg-surface text-muted border border-border'}`}>
            STATUS: {status.toUpperCase()}
         </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
         {/* Visual Feed */}
         <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black border border-border shadow-2xl aspect-video group">
               <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
               />
               <canvas ref={canvasRef} className="hidden" />

               {/* Overlay UI */}
               <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 pointer-events-none">
                  <div className="flex justify-between items-start pointer-events-auto">
                     <div className="bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
                        <Video className="w-3 h-3 text-danger animate-pulse" />
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
                     <div className="self-center relative w-20 h-20">
                        {/* Pulsing "listening" orb — signature visual for this screen */}
                        <div
                          className="absolute inset-0 rounded-full bg-accent/40 animate-pulse2"
                          style={{ animationDuration: '1.6s' }}
                        />
                        <div
                          className="absolute inset-0 rounded-full bg-accent/40 animate-pulse2"
                          style={{ animationDuration: '1.6s', animationDelay: '0.6s' }}
                        />
                        <div
                          className="absolute inset-0 m-auto rounded-full bg-accent shadow-[0_0_30px_rgb(var(--accent)/0.7)] transition-transform duration-100"
                          style={{
                            width: `${Math.max(28, Math.min(72, 28 + audioLevel * 6))}%`,
                            height: `${Math.max(28, Math.min(72, 28 + audioLevel * 6))}%`,
                          }}
                        />
                     </div>
                  )}
               </div>

               {!isLive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                     <button
                        onClick={startSession}
                        className="bg-accent text-bg px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold shadow-[0_0_24px_rgb(var(--accent)/0.5)] flex items-center gap-3 transition-transform active:scale-95 group-hover:scale-105"
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
                  className="w-full bg-danger/10 border border-danger/40 text-fg py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-danger/20 transition-colors"
               >
                  <StopCircle className="w-5 h-5 text-danger" />
                  End Session
               </button>
            )}
         </div>

         {/* Conversation Log & Tips */}
         <div className="flex flex-col h-[480px] lg:h-auto lg:min-h-[480px] glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2 flex-shrink-0">
               <Sparkles className="w-5 h-5 text-purple-400" />
               <h3 className="font-bold text-fg">Live Transcript</h3>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto flex flex-col-reverse">
               {/* Current Real-time Bubbles (Typing effect) */}
               {realtimeUI.model && (
                  <div className="flex gap-3 justify-start opacity-70">
                     <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Sparkles className="w-4 h-4 text-accent" />
                     </div>
                     <div className="p-3 rounded-2xl max-w-[80%] text-sm bg-accent/10 border border-accent/20 text-fg rounded-bl-none italic">
                        {realtimeUI.model} <span className="animate-pulse">|</span>
                     </div>
                  </div>
               )}
               {realtimeUI.user && (
                  <div className="flex gap-3 justify-end opacity-70">
                     <div className="p-3 rounded-2xl max-w-[80%] text-sm bg-surface text-fg rounded-br-none italic">
                        {realtimeUI.user}
                     </div>
                     <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0 animate-pulse">
                        <User className="w-4 h-4 text-muted" />
                     </div>
                  </div>
               )}

               {/* History Log */}
               {history.length === 0 && !realtimeUI.user && !realtimeUI.model ? (
                  <div className="text-center text-muted py-10">
                     <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                     <p>Start the session and speak to your plant.</p>
                     <p className="text-xs mt-2 opacity-60">"Are you healthy?" • "Do you need water?"</p>
                  </div>
               ) : (
                  [...history].reverse().map((t, i) => (
                     <div key={i} className={`flex gap-3 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {t.role === 'model' && (
                           <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-4 h-4 text-accent" />
                           </div>
                        )}
                        <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                           t.role === 'user'
                              ? 'bg-surface text-fg rounded-br-none'
                              : 'bg-accent/10 border border-accent/20 text-fg rounded-bl-none'
                        }`}>
                           {t.text}
                        </div>
                        {t.role === 'user' && (
                           <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-muted" />
                           </div>
                        )}
                     </div>
                  ))
               )}
            </div>

            <div className="p-3 bg-bg/40 text-xs text-muted border-t border-border text-center flex-shrink-0">
               Microphone active • AI listening • Video analyzing
            </div>
         </div>
      </div>
    </div>
  );
};
