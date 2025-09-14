import { useState, useRef, useEffect } from 'react';
import { Button } from './Primitives';
import { Icon } from './Icons';
import { clsx } from 'clsx';

interface RecorderProps {
  onTranscript?: (transcript: string) => void;
  disabled?: boolean;
  loading?: boolean;
  maxDuration?: number; // in seconds
  className?: string;
  
  /** NEW: allow parent to control transcript box */
  value?: string;
  onChangeTranscript?: (v: string) => void;
  onTranscribe?: (text: string) => void;
  showLanguageToggle?: boolean;
  
  /** NEW: enable transcription */
  enableTranscription?: boolean;
}

export function Recorder({ 
  onTranscript, 
  disabled = false,
  loading = false,
  maxDuration = 60,
  className,
  value,
  onChangeTranscript,
  onTranscribe,
  showLanguageToggle = true, // TODO: Implement language toggle feature
  enableTranscription = true
}: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [localText, setLocalText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioQuality, setAudioQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [speechDetected, setSpeechDetected] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingTimerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused, maxDuration]);

  // Enhanced audio level monitoring with speech and noise detection
  const monitorAudioLevel = () => {
    if (analyserRef.current && isRecording && !isPaused) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average audio level with better normalization
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = Math.min(average / 255, 1); // Better normalization using 255
      setAudioLevel(normalizedLevel);
      
      // Enhanced speech detection using frequency analysis
      const speechFreqRange = dataArray.slice(0, Math.floor(dataArray.length * 0.4)); // Focus on speech frequencies (0-4kHz)
      const speechLevel = speechFreqRange.reduce((sum, value) => sum + value, 0) / speechFreqRange.length;
      
      // Noise detection using higher frequencies
      const noiseFreqRange = dataArray.slice(Math.floor(dataArray.length * 0.6)); // Focus on noise frequencies (6kHz+)
      const noiseLevel = noiseFreqRange.reduce((sum, value) => sum + value, 0) / noiseFreqRange.length;
      
      setNoiseLevel(noiseLevel / 255);
      
      // Improved speech detection threshold
      const speechThreshold = 0.05; // Lower threshold for better detection
      const isSpeechDetected = speechLevel > speechThreshold && speechLevel > noiseLevel * 1.2;
      setSpeechDetected(isSpeechDetected);
      
      // Improved audio quality determination with more realistic thresholds
      let quality: 'good' | 'fair' | 'poor' = 'good'; // Start with good as default
      
      // Only mark as poor if there are real issues
      if (normalizedLevel < 0.005) {
        quality = 'good'; // Very low audio is normal in silent room
      } else if (normalizedLevel < 0.02 && !isSpeechDetected) {
        quality = 'good'; // Low audio without speech is normal
      } else if (noiseLevel > normalizedLevel * 3) {
        quality = 'fair'; // High noise relative to signal
      } else if (normalizedLevel > 0.02 && isSpeechDetected) {
        quality = 'good'; // Good signal with speech detected
      } else if (normalizedLevel > 0.1) {
        quality = 'good'; // Any significant audio level is good
      }
      
      setAudioQuality(quality);
      
      animationRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  };

  // Start/stop audio monitoring
  useEffect(() => {
    if (isRecording && !isPaused) {
      monitorAudioLevel();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setAudioLevel(0);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // Determine which transcript to display
  const transcriptText = value !== undefined ? value : localText;
  const displayText = interimTranscript || transcriptText;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      setErr(null);
      
      // Check if microphone is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone not supported in this browser');
      }
      
      // Use audio recording + backend transcription (primary method)
      console.log('Using audio recording + backend transcription');
      await startAudioRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      
      let errorMessage = 'Failed to start recording. ';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Microphone access denied. Please allow microphone access and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'Microphone not supported in this browser.';
        } else if (error.message.includes('not supported')) {
          errorMessage += 'Microphone not supported in this browser.';
        } else {
          errorMessage += error.message;
        }
      }
      
      setErr(errorMessage);
    }
  };


  const startAudioRecording = async () => {
    let stream: MediaStream;
    
    try {
      // Request high-quality audio with enhanced noise suppression
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100, // Higher sample rate for better quality
          channelCount: 1,
          // Add additional constraints for better quality
          sampleSize: 16
        }
      });
      console.log('Got enhanced media stream:', stream);
      streamRef.current = stream;
      
      // Set up enhanced audio analysis for real-time monitoring
      const audioContext = new AudioContext({ sampleRate: 44100 });
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024; // Higher FFT size for better frequency analysis
      analyser.smoothingTimeConstant = 0.8; // More responsive to changes
      analyser.minDecibels = -100; // Lower threshold for better sensitivity
      analyser.maxDecibels = -10;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      // Initialize audio quality as good when stream starts
      setAudioQuality('good');
      setAudioLevel(0);
      setNoiseLevel(0);
      setSpeechDetected(false);
      
      // Start monitoring immediately to get accurate readings
      setTimeout(() => {
        if (analyserRef.current) {
          monitorAudioLevel();
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setErr('Microphone access denied or not available. Please check permissions and try again.');
      throw error;
    }
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      console.log('Data available:', { size: event.data.size });
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      console.log('MediaRecorder stopped, chunks:', audioChunksRef.current.length);
      // Use the actual MIME type from MediaRecorder
      const mimeType = mediaRecorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      console.log('Audio blob created:', { size: audioBlob.size, type: mimeType });
      processAudio(audioBlob);
    };

    mediaRecorder.start(100); // Collect data every 100ms for better quality
    setIsRecording(true);
    setDuration(0);
  };

  const stopRecording = () => {
    console.log('Stopping recording...', { hasRecorder: !!mediaRecorderRef.current, isRecording });
    
    if (mediaRecorderRef.current && isRecording) {
      // Stop audio recording
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };


  // Safe JSON parsing function
  async function safeJson(res: Response) {
    const t = await res.text();
    try { 
      return JSON.parse(t); 
    } catch { 
      return { text: "", _raw: t }; 
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    console.log('🔵 Recorder: Starting processAudio function');
    setIsProcessing(true);
    setErr(null);
    setProcessingTime(0);
    
    try {
      console.log('🔵 Recorder: Processing audio blob:', { size: audioBlob.size, type: audioBlob.type });
      
      if (audioBlob.size === 0) {
        console.error('🔴 Recorder: Audio blob is empty');
        throw new Error('Audio blob is empty - no audio was recorded');
      }
      
      
      // Skip transcription if disabled
      if (!enableTranscription) {
        console.log('🔵 Recorder: Transcription disabled - skipping API call');
        const placeholderText = "Audio recorded (transcription disabled)";
        onTranscript?.(placeholderText);
        onTranscribe?.(placeholderText);
        setLocalText(placeholderText);
        setIsProcessing(false);
        return;
      }
      
      // Create FormData to send audio file
      const formData = new FormData();
      formData.append('file', audioBlob, 'rec.webm');
      formData.append('language', 'auto'); // Auto-detect language
      
      console.log('🔵 Recorder: Sending request to transcription API...');
      const base = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
      const apiUrl = `${base}/api/transcribe`;
      console.log('🔵 Recorder: API URL:', apiUrl);
      
      // Start processing timer
      processingTimerRef.current = setInterval(() => {
        setProcessingTime(prev => prev + 1);
      }, 1000);

      // Call real transcription API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('🟡 Recorder: Request timeout after 120 seconds');
        controller.abort();
        setErr('Transcription timed out (120s). Please try recording again with clearer audio.');
        setIsProcessing(false);
      }, 120000); // 120 second timeout - Whisper needs more time for complex audio
      
      console.log('🔵 Recorder: Making fetch request...');
      console.log('🔵 Recorder: FormData contents:', Array.from(formData.entries()));
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('🔵 Recorder: Fetch response received:', { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔴 Recorder: Transcription API error:', { status: response.status, text: errorText });
        
        // Provide more helpful error messages
        let errorMsg = `Transcription failed (${response.status})`;
        if (response.status === 500) {
          errorMsg = "Backend error - check if ffmpeg is installed";
        } else if (response.status === 404) {
          errorMsg = "Transcription service not found - check backend";
        } else if (response.status === 0) {
          errorMsg = "Cannot connect to backend - is it running?";
        }
        
        setErr(errorMsg);
        setIsProcessing(false);
        return;
      }
      
      console.log('🔵 Recorder: Parsing JSON response...');
      const result = await safeJson(response);
      console.log('🔵 Recorder: Raw API response:', result);
      
      // Handle different response formats safely
      let transcript = '';
      if (typeof result === 'string') {
        transcript = result;
      } else if (result && typeof result === 'object') {
        transcript = result.text || result.transcript || result.result || '';
      }
      
      console.log('🔵 Recorder: Extracted transcript:', transcript);
      
      if (transcript && transcript.trim()) {
        console.log('🔵 Recorder: Setting transcript state (parent)');
        const trimmedTranscript = transcript.trim();
        onTranscript?.(trimmedTranscript);
        onTranscribe?.(trimmedTranscript);
        // keep internal display in sync even if parent is uncontrolled
        setLocalText(trimmedTranscript);
        console.log('🔵 Recorder: Transcript state changed (local)');
      } else {
        console.error('🔴 Recorder: No transcript found in response');
        onTranscript?.('');
        onTranscribe?.('');
        setLocalText('No transcript received from server');
      }
      
      console.log('🟢 Recorder: processAudio completed successfully');
    } catch (error) {
      console.error('🔴 Recorder: Error processing audio:', error);
      // Show more detailed error to user
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Transcription timed out. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      console.log('🔴 Recorder: Setting error message:', errorMessage);
      
      // Enhanced error messages for better user guidance
      if (error instanceof Error && error.name === 'AbortError') {
        setErr(`Transcription timed out (120s). Please try recording again with clearer audio.`);
      } else if (error instanceof Error && error.message.includes('fetch')) {
        setErr(`Network error: Cannot connect to backend. Please check your connection and try again.`);
      } else {
        setErr(`Transcription error: ${errorMessage}. Please try speaking more clearly.`);
      }
      
      onTranscript?.('');
      onTranscribe?.('');
    } finally {
      console.log('🔵 Recorder: Setting isProcessing to false');
      setIsProcessing(false);
      setProcessingTime(0);
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
        processingTimerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  return (
    <div className={clsx('space-y-2', className)}>
      {/* Auto Language Detection Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Icon name="Globe" size={16} />
          <span>Auto-detecting language (English/Hindi)</span>
        </div>
        
      </div>

      {/* Recording Controls */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || loading || isProcessing}
          variant={isRecording ? 'danger' : 'primary'}
          size="lg"
        >
          {isRecording ? (
            <Icon name="Square" size={20} className="mr-2" />
          ) : (
            <Icon name="Mic" size={20} className="mr-2" />
          )}
          {isRecording ? 'Stop' : 'Record'}
        </Button>

        {isRecording && (
          <Button
            onClick={pauseRecording}
            variant="secondary"
            size="lg"
          >
            <Icon name={isPaused ? "Mic" : "MicOff"} size={20} className="mr-2" />
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        )}


        {/* Timer */}
        <div className="flex items-center space-x-2">
          <Icon name="Clock" size={16} className="text-slate-500" />
          <span className="text-sm font-mono text-slate-700">
            {formatTime(duration)} / {formatTime(maxDuration)}
          </span>
        </div>


      </div>

      {/* Enhanced Audio Visualization */}
      <div className="space-y-3">
        <div className="h-20 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg flex items-center justify-center p-4">
          <div className="flex space-x-1 items-end h-full">
            {Array.from({ length: 24 }).map((_, i) => {
              // Create more dynamic visualization based on actual audio levels
              let height = 4; // Minimum height
              
              if (isRecording && audioLevel > 0.01) {
                // Use actual audio level with some variation for visual appeal
                const baseHeight = audioLevel * 60; // Scale up for better visibility
                const variation = Math.sin(Date.now() * 0.01 + i * 0.5) * 5; // Subtle animation
                height = Math.max(4, baseHeight + variation);
              } else if (isRecording) {
                // Show minimal idle animation when recording but no significant audio
                height = Math.sin(Date.now() * 0.003 + i * 0.2) * 2 + 4;
              }
              
              return (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-100 ${
                    isRecording ? (
                      audioQuality === 'good' ? 'bg-gradient-to-t from-green-400 to-green-600' :
                      audioQuality === 'fair' ? 'bg-gradient-to-t from-yellow-400 to-yellow-600' : 
                      'bg-gradient-to-t from-red-400 to-red-600'
                    ) : 'bg-slate-300'
                  }`}
                  style={{
                    height: `${Math.min(height, 60)}px`, // Cap at container height
                  }}
                />
              );
            })}
          </div>
        </div>
        
        {/* Enhanced Audio Quality Indicator */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isRecording ? (
                audioQuality === 'good' ? 'bg-green-500 animate-pulse' :
                audioQuality === 'fair' ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500 animate-pulse'
              ) : 'bg-slate-300'
            }`} />
            <span className="font-medium text-slate-700">
              {isRecording ? (
                <>
                  <span className="capitalize">{audioQuality}</span> Quality
                  {speechDetected && <span className="ml-2 text-green-600">• Speech Detected</span>}
                  {!speechDetected && audioLevel < 0.01 && <span className="ml-2 text-slate-500">• Listening...</span>}
                </>
              ) : 'Ready to Record'}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-slate-600">
            {isRecording && (
              <>
                <span>Level: {Math.round(audioLevel * 100)}%</span>
                <span>Noise: {Math.round(noiseLevel * 100)}%</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center space-y-3 py-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
            <span className="text-sm text-slate-600">Processing audio with Whisper...</span>
            <div className="text-xs text-slate-500">
              ({processingTime}s elapsed - may take 30-120 seconds)
            </div>
          </div>
        </div>
      )}

      {/* Recording Method Info */}
      {!err && !isRecording && !isProcessing && (
        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2">
          <div className="flex items-center space-x-2">
            <Icon name="Mic" size={12} />
            <span>Using audio recording + AI transcription</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {err && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span>{err}</span>
            <div className="flex space-x-2">
              {err.includes('timed out') && (
                <Button
                  onClick={() => {
                    setErr(null);
                    // Retry the last recording if available
                    if (audioChunksRef.current.length > 0) {
                      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                      processAudio(audioBlob);
                    }
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transcript */}
      <div className="space-y-3">
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <div className="text-xs text-slate-500">Transcript</div>
              {interimTranscript && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-xs text-blue-600">Live</span>
                </div>
              )}
            </div>
          </div>
          <textarea
            className="w-full resize-none bg-transparent outline-none text-sm text-slate-700"
            rows={4}
            value={displayText}
            onChange={(e) => {
              onChangeTranscript?.(e.target.value);
              if (value === undefined) setLocalText(e.target.value);
            }}
            placeholder="Recording transcript will appear here..."
          />
        </div>
      </div>
      
    </div>
  );
}
