import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Crop, ArrowUp, ArrowDown, Trash2, Check, Type } from 'lucide-react';
import ReactCrop, { Crop as CropType, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Tesseract from 'tesseract.js';

interface TextifyImage {
  id: string;
  url: string;
  file: File;
  croppedUrl?: string;
}

interface TextifyModalProps {
  onClose: () => void;
  onInsert: (text: string) => void;
}

export function TextifyModal({ onClose, onInsert }: TextifyModalProps) {
  const [images, setImages] = useState<TextifyImage[]>([]);
  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Cropping state
  const [cropImage, setCropImage] = useState<TextifyImage | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const newImages = files.map(file => ({
      id: `img-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file
    }));

    setImages(prev => [...prev, ...newImages]);
    // Reset input
    e.target.value = '';
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    if (direction === 'up' && index > 0) {
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    } else if (direction === 'down' && index < newImages.length - 1) {
      [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
    }
    setImages(newImages);
  };

  const deleteImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const openCrop = (img: TextifyImage) => {
    setCropImage(img);
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const saveCrop = async () => {
    if (!cropImage || !completedCrop || !imgRef.current) {
      setCropImage(null);
      return;
    }

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    const base64Image = canvas.toDataURL('image/jpeg');
    
    setImages(prev => prev.map(img => 
      img.id === cropImage.id ? { ...img, croppedUrl: base64Image } : img
    ));
    
    setCropImage(null);
  };

  const extractText = async () => {
    if (images.length === 0) return;
    
    setIsExtracting(true);
    setProgress(0);
    let fullText = '';

    try {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const imageUrl = img.croppedUrl || img.url;
        
        const result = await Tesseract.recognize(
          imageUrl,
          'ind+eng', // Indonesian and English
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                setProgress(((i + m.progress) / images.length) * 100);
              }
            }
          }
        );
        
        fullText += result.data.text + '\n\n';
      }
      
      setExtractedText(prev => prev ? prev + '\n\n' + fullText.trim() : fullText.trim());
    } catch (error) {
      console.error('Extraction error:', error);
      alert('Failed to extract text from images.');
    } finally {
      setIsExtracting(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="retro-box bg-retro-bg w-[90vw] max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-retro-border bg-retro-box-light">
          <h2 className="text-2xl font-bold uppercase flex items-center gap-2" style={{ fontFamily: 'VT323, monospace' }}>
            TEXTIFY
          </h2>
          <button onClick={onClose} className="retro-button p-2 text-retro-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Upload Button */}
          <div>
            <label className="retro-button flex items-center justify-center gap-2 py-3 px-4 cursor-pointer font-bold uppercase">
              <Upload className="w-5 h-5" />
              Upload Images
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </label>
          </div>

          {/* Image List */}
          {images.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold uppercase text-sm border-b-2 border-retro-border pb-1">Images</h3>
              <div className="space-y-2">
                {images.map((img, index) => (
                  <div key={img.id} className="retro-box-inset p-2 flex items-center gap-3 bg-retro-box-light">
                    <button 
                      onClick={() => deleteImage(img.id)}
                      className="retro-button p-1.5 text-retro-accent"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="w-16 h-16 bg-retro-box-dark border-2 border-retro-border flex-shrink-0 overflow-hidden flex items-center justify-center">
                      <img 
                        src={img.croppedUrl || img.url} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    
                    <div className="flex-1 text-sm font-bold truncate">
                      {img.file.name}
                      {img.croppedUrl && <span className="ml-2 text-xs bg-retro-accent text-white px-1 py-0.5">CROPPED</span>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openCrop(img)}
                        className="retro-button p-1.5 text-retro-text"
                        title="Crop"
                      >
                        <Crop className="w-4 h-4" />
                      </button>
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => moveImage(index, 'up')}
                          disabled={index === 0}
                          className="retro-button p-0.5 disabled:opacity-50"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => moveImage(index, 'down')}
                          disabled={index === images.length - 1}
                          className="retro-button p-0.5 disabled:opacity-50"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extract Button */}
          {images.length > 0 && (
            <div className="pt-4 border-t-2 border-retro-border border-dashed">
              <button
                onClick={extractText}
                disabled={isExtracting}
                className="retro-button retro-button-primary w-full py-3 font-bold uppercase flex items-center justify-center gap-2"
              >
                {isExtracting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-retro-bg border-t-transparent rounded-full animate-spin" />
                    Extracting... {Math.round(progress)}%
                  </>
                ) : (
                  <>
                    Extract Text
                  </>
                )}
              </button>
            </div>
          )}

          {/* Extracted Text Area */}
          <div>
            <h3 className="font-bold uppercase text-sm border-b-2 border-retro-border pb-1 mb-2">Extracted Text</h3>
            <textarea
              className="w-full h-48 retro-box-inset p-3 text-retro-text focus:outline-none focus:ring-2 focus:ring-retro-border resize-none font-mono text-sm"
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Extracted text will appear here. You can also edit it before inserting."
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-retro-border bg-retro-box-light flex justify-end gap-3">
          <button 
            onClick={() => onInsert(extractedText)}
            disabled={!extractedText.trim()}
            className="retro-button retro-button-primary flex items-center gap-2 px-6 py-2 font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Insert
          </button>
        </div>
      </div>

      {/* Crop Modal Overlay */}
      {cropImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="retro-box bg-retro-bg flex flex-col max-w-full max-h-full">
            <div className="flex items-center justify-between p-3 border-b-2 border-retro-border bg-retro-box-light">
              <h3 className="font-bold uppercase">Crop Image</h3>
              <button onClick={() => setCropImage(null)} className="retro-button p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto p-4 flex justify-center items-center bg-retro-box-dark">
              <ReactCrop 
                crop={crop} 
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
              >
                <img 
                  ref={imgRef}
                  src={cropImage.url} 
                  alt="Crop me" 
                  className="max-w-[80vw] max-h-[70vh] object-contain"
                />
              </ReactCrop>
            </div>
            <div className="p-3 border-t-2 border-retro-border bg-retro-box-light flex justify-end gap-2">
              <button onClick={() => setCropImage(null)} className="retro-button px-3 py-1 font-bold uppercase text-sm">
                Cancel
              </button>
              <button onClick={saveCrop} className="retro-button retro-button-primary px-3 py-1 font-bold uppercase text-sm">
                Save Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
