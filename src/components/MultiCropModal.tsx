import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { X, Plus, Layers, Save, Trash2 } from 'lucide-react';
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
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="retro-box bg-retro-bg w-[90vw] max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-retro-border bg-retro-box-light">
          <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: 'VT323, monospace' }}>MULTI-CROP</h2>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r-2 border-retro-border bg-retro-box-dark flex flex-col">
            <div className="p-4 border-b-2 border-retro-border">
              <button 
                onClick={handleAddSlide}
                className="retro-button w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-bold uppercase"
              >
                <Layers className="w-4 h-4" />
                Add Slide
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setActiveSlideId(slide.id)}
                  className={`w-full text-left px-4 py-3 text-sm font-bold uppercase flex justify-between items-center transition-all ${
                    activeSlideId === slide.id 
                      ? 'retro-box bg-retro-box-light' 
                      : 'retro-button'
                  }`}
                >
                  <span>Slide {index + 1}</span>
                  <span className="bg-retro-text text-retro-bg px-2 py-0.5 text-xs">{slide.boxes.length} boxes</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col bg-retro-bg relative overflow-hidden">
            <div className="p-4 flex justify-between items-center bg-retro-box-light border-b-2 border-retro-border z-10">
              <div className="text-sm font-bold uppercase">
                Editing Slide {activeSlideIndex + 1}
              </div>
              <button 
                onClick={handleAddBox}
                className="retro-button retro-button-primary flex items-center gap-2 py-1.5 px-3 text-sm font-bold uppercase"
              >
                <Plus className="w-4 h-4" />
                Add Box
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8 flex justify-center hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="relative retro-box bg-retro-box-light h-max" style={{ maxWidth: '100%' }}>
                <img 
                  ref={imageRef}
                  src={image.url} 
                  alt="Crop target" 
                  className="max-w-full h-auto block select-none"
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
                    className="border-2 border-retro-accent bg-retro-accent/20 group"
                  >
                    <div className="absolute top-0 left-0 bg-retro-accent text-white text-xs px-1.5 py-0.5 font-bold">
                      {index + 1}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteBox(box.id); }}
                      className="absolute -top-3 -right-3 bg-retro-text text-retro-bg p-1 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-retro-box-light"
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
        <div className="p-4 border-t-2 border-retro-border bg-retro-box-light flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="retro-button p-2 text-retro-accent"
            title="Cancel"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSave}
            className="retro-button retro-button-primary flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
