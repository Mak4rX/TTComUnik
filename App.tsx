import React, { useState } from 'react';
import { Uploader } from './components/Uploader';
import { HypnoEditor } from './components/HypnoEditor';

function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black">
      {!imageSrc ? (
        <Uploader onImageSelected={setImageSrc} />
      ) : (
        <HypnoEditor 
          imageSrc={imageSrc} 
          onReset={() => setImageSrc(null)} 
        />
      )}
    </div>
  );
}

export default App;
