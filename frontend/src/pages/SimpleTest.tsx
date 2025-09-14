import { useState } from 'react';

export default function SimpleTest() {
  const [message, setMessage] = useState('Click the button to test');

  const testFunction = () => {
    setMessage('Button clicked! Function is working.');
    console.log('Test function called successfully');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Simple Test Page</h1>
      <button 
        onClick={testFunction}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Button
      </button>
      <p className="mt-4 text-gray-600">{message}</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold">Instructions:</h3>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Click the button above</li>
          <li>Check if message changes</li>
          <li>Open browser console (F12) and check for "Test function called successfully"</li>
          <li>If this works, the issue is with the Recorder component</li>
        </ol>
      </div>
    </div>
  );
}
