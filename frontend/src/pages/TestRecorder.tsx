import { useState } from 'react';
import { Recorder } from '../components/Recorder';
import { SimpleRecorder } from '../components/SimpleRecorder';

export default function TestRecorder() {
  const [transcript, setTranscript] = useState('');
  const [simpleTranscript, setSimpleTranscript] = useState('');

  const handleMapping = () => {
    console.log('Test mapping called with transcript:', transcript);
    console.log(`Mapping called with: ${transcript}`);
  };

  const handleSimpleMapping = () => {
    console.log('Simple mapping called with transcript:', simpleTranscript);
    console.log(`Simple mapping called with: ${simpleTranscript}`);
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Test Recorder</h1>
      
      {/* Original Recorder */}
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Original Recorder</h2>
        <Recorder 
          onTranscript={(t) => {
            console.log('Test transcript received:', t);
            setTranscript(t);
          }}
          maxDuration={300}
        />
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-800">Debug Info:</h3>
          <p className="text-blue-600">Transcript: {transcript || 'None'}</p>
        </div>
      </div>

      {/* Simple Recorder */}
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Simple Recorder</h2>
        <SimpleRecorder 
          onTranscript={(t) => {
            console.log('Simple transcript received:', t);
            setSimpleTranscript(t);
          }}
        />
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold text-green-800">Simple Debug Info:</h3>
          <p className="text-green-600">Transcript: {simpleTranscript || 'None'}</p>
        </div>
      </div>
    </div>
  );
}
