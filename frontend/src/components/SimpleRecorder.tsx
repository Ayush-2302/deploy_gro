import { useState, useRef } from 'react';
import { Button } from './Primitives';
// import { Icon } from './Icons'; // eslint-disable-line @typescript-eslint/no-unused-vars

interface SimpleRecorderProps {
  onTranscript: (transcript: string) => void;
  onMapToFields?: () => void;
}

export function SimpleRecorder({ onTranscript, onMapToFields }: SimpleRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      console.log('SimpleRecorder: Starting recording...');
      setError('');
      setTranscript('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('SimpleRecorder: Data available, size:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('SimpleRecorder: Recording stopped, processing...');
        setIsProcessing(true);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('SimpleRecorder: Audio blob created, size:', audioBlob.size);
          
          if (audioBlob.size === 0) {
            throw new Error('No audio recorded');
          }
          
          const formData = new FormData();
          formData.append('file', audioBlob, 'recording.webm');
          formData.append('language', 'auto');
          
          console.log('SimpleRecorder: Sending to API...');
          const response = await fetch('http://localhost:8000/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
          }
          
          const result = await response.json();
          console.log('SimpleRecorder: Raw API response:', result);
          
          const transcribedText = result.text || result;
          console.log('SimpleRecorder: Extracted transcript:', transcribedText);
          
          if (transcribedText && transcribedText.trim()) {
            console.log('SimpleRecorder: Setting transcript state to:', transcribedText);
            setTranscript(transcribedText);
            console.log('SimpleRecorder: Calling onTranscript with:', transcribedText);
            onTranscript(transcribedText);
          } else {
            console.error('SimpleRecorder: No transcript found in response');
            setError('No transcript received from server');
          }
          
        } catch (err: any) {
          console.error('SimpleRecorder: Error:', err);
          setError(err.message);
        } finally {
          setIsProcessing(false);
        }
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      
    } catch (err: any) {
      console.error('SimpleRecorder: Start error:', err);
      setError(err.message);
    }
  };

  const stopRecording = () => {
    console.log('SimpleRecorder: Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  return (
    <div className="space-y-4 p-4 border border-gray-300 rounded-lg">
      <h3 className="font-semibold">Simple Recorder Test</h3>
      
      {/* Controls */}
      <div className="flex space-x-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? 'danger' : 'primary'}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        
        {transcript && onMapToFields && (
          <Button onClick={onMapToFields} variant="secondary">
            Map to Fields
          </Button>
        )}
        
        <Button 
          onClick={() => {
            const testText = "This is a test transcript";
            console.log('Manual test: Setting transcript to:', testText);
            setTranscript(testText);
            onTranscript(testText);
          }}
          variant="secondary"
        >
          Test Transcript
        </Button>
      </div>
      
      {/* Status */}
      <div className="text-sm">
        <p>Status: {isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Ready'}</p>
        {error && <p className="text-red-600">Error: {error}</p>}
      </div>
      
      {/* Transcript */}
      {transcript && (
        <div className="p-3 bg-gray-100 rounded">
          <h4 className="font-medium mb-2">Transcript:</h4>
          <p className="text-sm">{transcript}</p>
        </div>
      )}
      
      {/* Debug Info */}
      <div className="text-xs text-gray-500">
        <p>Debug: transcript = "{transcript}"</p>
        <p>Debug: transcript length = {transcript.length}</p>
        <p>Debug: isRecording = {isRecording.toString()}</p>
        <p>Debug: isProcessing = {isProcessing.toString()}</p>
        <p>Debug: onMapToFields = {onMapToFields ? 'exists' : 'null'}</p>
        <p>Debug: error = "{error}"</p>
      </div>
    </div>
  );
}
