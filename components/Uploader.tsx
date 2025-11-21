import React, { useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface UploaderProps {
  onImageSelected: (src: string) => void;
}

export const Uploader: React.FC<UploaderProps> = ({ onImageSelected }) => {
  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageSelected(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center w-full h-screen bg-zinc-950 text-zinc-300 p-4"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-zinc-900 border border-zinc-800 p-12 rounded-2xl flex flex-col items-center justify-center hover:bg-zinc-800/50 transition-colors cursor-pointer">
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={onChange} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-20 h-20 mb-6 bg-zinc-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ImageIcon size={40} className="text-indigo-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Upload Photo</h1>
                <p className="text-zinc-400 text-sm mb-6">
                    Drag and drop or click to browse.<br/>
                    Supports JPG, PNG, WEBP.
                </p>
                <button className="pointer-events-none px-6 py-2.5 bg-white text-black font-semibold rounded-full text-sm">
                    Select File
                </button>
            </div>
        </div>
        
        <div className="text-xs text-zinc-600">
            <p>Apply hypnotic spiral effects instantly.</p>
            <p>Privacy focused: Images are processed locally in your browser.</p>
        </div>
      </div>
    </div>
  );
};
