import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { X, Plus, Layers, Save } from 'lucide-react';
import { ImageItem } from './ImageUploadList';

interface Box {
  id: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
}

interface CropSlide {
  id: string;
  boxes: Box[];
}

interface MultiCropModalProps {
  image: ImageItem;
  onSave: (newImages: ImageItem[]) => void;
  onCancel: () => void;
}

export const MultiCropModal: React.FC<MultiCropModalProps> = ({ image, onSave, onCancel }) => {
  const [slides, setSlides] = useState<CropSlide[]>([{ id: 'slide-1', boxes: [] }]);
  const [activeSlideId, setActiveSlideId] = useState<string>('slide-1');
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageRect, setImageRect] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateRect = () => {
      if (imageRef.current) {
        setImageRect({
          width: imageRef.current.clientWidth,
          height: imageRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageRect({
        width: imageRef.current.clientWidth,
        height: imageRef.current.clientHeight,
      });
    }
  };

  const activeSlideIndex = slides.findIndex(s => s.id === activeSlideId);
  const activeSlide = slides[activeSlideIndex];

  const handleAddBox = () => {
    const newBox: Box = {
      id: `box-${Date.now()}`,
      x: 10,
      y: 10,
      width: 30,
      height: 30,
    };
    const newSlides = [...slides];
    newSlides[activeSlideIndex].boxes.push(newBox);
    setSlides(newSlides);
  };

  const handleAddSlide = () => {
    const newSlideId = `slide-${Date.now()}`;
    setSlides([...slides, { id: newSlideId, boxes: [] }]);
    setActiveSlideId(newSlideId);
  };

  const handleBoxChange = (boxId: string, newProps: Partial<Box>) => {
    const newSlides = [...slides];
    const boxIndex = newSlides[activeSlideIndex].boxes.findIndex(b => b.id === boxId);
    if (boxIndex > -1) {
      newSlides[activeSlideIndex].boxes[boxIndex] = { ...newSlides[activeSlideIndex].boxes[boxIndex], ...newProps };
      setSlides(newSlides);
    }
  };

  const handleDeleteBox = (boxId: string) => {
    const newSlides = [...slides];
    newSlides[activeSlideIndex].boxes = newSlides[activeSlideIndex].boxes.filter(b => b.id !== boxId);
    setSlides(newSlides);
  };

  const handleSave = async () => {
    const originalImg = new Image();
    originalImg.crossOrigin = "anonymous";
    
    await new Promise((resolve) => {
      originalImg.onload = resolve;
      originalImg.src = image.url;
    });

    const newImages: ImageItem[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      if (slide.boxes.length === 0) continue;

      // Sort boxes by Y coordinate to arrange top to bottom
      const sortedBoxes = [...slide.boxes].sort((a, b) => a.y - b.y);

      let totalHeight = 0;
      let maxWidth = 0;

      const cropsData = sortedBoxes.map(box => {
        const pixelX = (box.x / 100) * originalImg.width;
        const pixelY = (box.y / 100) * originalImg.height;
        const pixelW = (box.width / 100) * originalImg.width;
        const pixelH = (box.height / 100) * originalImg.height;
        
        totalHeight += pixelH;
        if (pixelW > maxWidth) maxWidth = pixelW;

        return { x: pixelX, y: pixelY, w: pixelW, h: pixelH };
      });

      if (maxWidth === 0 || totalHeight === 0) continue;

      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      let currentY = 0;
      for (const crop of cropsData) {
        const drawX = (maxWidth - crop.w) / 2;
        ctx.drawImage(originalImg, crop.x, crop.y, crop.w, crop.h, drawX, currentY, crop.w, crop.h);
        currentY += crop.h;
      }

      const newUrl = canvas.toDataURL('image/png');
      newImages.push({
        id: `${image.id}-crop-${i}`,
        url: newUrl,
        name: `${image.name} (Slide ${i + 1})`,
        width: maxWidth,
        height: totalHeight
      });
    }

    if (newImages.length > 0) {
      onSave(newImages);
    } else {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Multi Crop</h2>
          <button onClick={onCancel} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <button 
                onClick={handleAddSlide}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Layers className="w-4 h-4" />
                Add Slide
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setActiveSlideId(slide.id)}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors flex justify-between items-center ${
                    activeSlideId === slide.id 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>Slide {index + 1}</span>
                  <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">{slide.boxes.length} boxes</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col bg-gray-100 relative overflow-hidden">
            <div className="p-4 flex justify-between items-center bg-white border-b border-gray-200 shadow-sm z-10">
              <div className="text-sm font-medium text-gray-600">
                Editing Slide {activeSlideIndex + 1}
              </div>
              <button 
                onClick={handleAddBox}
                className="flex items-center gap-2 py-1.5 px-3 bg-[#0f6cbd] text-white rounded-md text-sm font-medium hover:bg-[#0c5696] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Box
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
              <div className="relative shadow-lg bg-white" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                <img 
                  ref={imageRef}
                  src={image.url} 
                  alt="Crop target" 
                  className="max-w-full max-h-full block select-none"
                  onLoad={handleImageLoad}
                  draggable={false}
                />
                
                {imageRect.width > 0 && activeSlide.boxes.map((box, index) => (
                  <Rnd
                    key={box.id}
                    bounds="parent"
                    position={{
                      x: (box.x / 100) * imageRect.width,
                      y: (box.y / 100) * imageRect.height
                    }}
                    size={{
                      width: (box.width / 100) * imageRect.width,
                      height: (box.height / 100) * imageRect.height
                    }}
                    onDragStop={(e, d) => {
                      handleBoxChange(box.id, {
                        x: (d.x / imageRect.width) * 100,
                        y: (d.y / imageRect.height) * 100
                      });
                    }}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      handleBoxChange(box.id, {
                        width: (ref.offsetWidth / imageRect.width) * 100,
                        height: (ref.offsetHeight / imageRect.height) * 100,
                        x: (position.x / imageRect.width) * 100,
                        y: (position.y / imageRect.height) * 100
                      });
                    }}
                    className="border-2 border-blue-500 bg-blue-500/20 group"
                  >
                    <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1.5 py-0.5 font-bold">
                      {index + 1}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteBox(box.id); }}
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Rnd>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0f6cbd] rounded-md hover:bg-[#0c5696] transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Crops
          </button>
        </div>
      </div>
    </div>
  );
};
