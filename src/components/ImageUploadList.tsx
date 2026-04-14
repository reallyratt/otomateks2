import React, { useState } from 'react';
import { X, Edit2, ArrowUp, ArrowDown, Upload, Contrast } from 'lucide-react';
import { MultiCropModal } from './MultiCropModal';

export interface ImageItem {
  id: string;
  url: string;
  name: string;
  width: number;
  height: number;
}

interface ImageUploadListProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
}

export const ImageUploadList: React.FC<ImageUploadListProps> = ({ images = [], onChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    const newImages = await Promise.all(files.map((file: File) => {
      return new Promise<ImageItem>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target?.result as string;
          const img = new Image();
          img.onload = () => {
            resolve({
              id: Math.random().toString(36).substring(2, 9),
              url,
              name: file.name,
              width: img.width,
              height: img.height
            });
          };
          img.src = url;
        };
        reader.readAsDataURL(file);
      });
    }));

    onChange([...images, ...newImages]);
    // reset input
    e.target.value = '';
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newImgs = [...images];
    [newImgs[index - 1], newImgs[index]] = [newImgs[index], newImgs[index - 1]];
    onChange(newImgs);
  };

  const moveDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImgs = [...images];
    [newImgs[index + 1], newImgs[index]] = [newImgs[index], newImgs[index + 1]];
    onChange(newImgs);
  };

  const remove = (index: number) => {
    const newImgs = [...images];
    newImgs.splice(index, 1);
    onChange(newImgs);
  };

  const invertColor = (index: number) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];     // red
        data[i + 1] = 255 - data[i + 1]; // green
        data[i + 2] = 255 - data[i + 2]; // blue
      }
      ctx.putImageData(imageData, 0, 0);
      const newUrl = canvas.toDataURL('image/png');
      const newImgs = [...images];
      newImgs[index] = { ...newImgs[index], url: newUrl };
      onChange(newImgs);
    };
    img.src = images[index].url;
  };

  const handleSaveCrops = (newImages: ImageItem[]) => {
    if (editingIndex === null) return;
    const newImgs = [...images];
    newImgs.splice(editingIndex, 1, ...newImages);
    onChange(newImgs);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-[#f3f2f1] hover:bg-[#edebe9] text-[#323130] text-sm font-medium rounded-md border border-[#8a8886] transition-colors">
          <Upload className="w-4 h-4" />
          Upload Images
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>
      {images.length > 0 && (
        <div className="space-y-2 mt-2">
          {images.map((img, idx) => (
            <div key={img.id} className="flex items-center gap-3 p-2 border border-[#edebe9] rounded-md bg-white shadow-sm">
              <div className="border rounded-md flex items-center bg-gray-50">
                <button type="button" onClick={() => remove(idx)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors" title="Delete">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <img src={img.url} alt={img.name} className="w-10 h-10 object-cover rounded border border-[#edebe9]" />
              <span className="flex-1 truncate text-sm text-[#323130]">{img.name}</span>
              
              <div className="flex gap-2">
                <div className="border rounded-md flex items-center bg-gray-50">
                  <button type="button" onClick={() => setEditingIndex(idx)} className="p-1.5 text-[#0f6cbd] hover:bg-blue-100 rounded-md transition-colors" title="Multi Crop">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="border rounded-md flex items-center bg-gray-50">
                  <button type="button" onClick={() => invertColor(idx)} className="p-1.5 text-gray-700 hover:bg-gray-200 rounded-md transition-colors" title="Invert Color">
                    <Contrast className="w-4 h-4" />
                  </button>
                </div>

                <div className="border rounded-md flex items-center bg-gray-50">
                  <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1.5 text-gray-700 hover:bg-gray-200 rounded-l-md border-r border-gray-200 disabled:opacity-50 transition-colors" title="Move Up">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => moveDown(idx)} disabled={idx === images.length - 1} className="p-1.5 text-gray-700 hover:bg-gray-200 rounded-r-md disabled:opacity-50 transition-colors" title="Move Down">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingIndex !== null && (
        <MultiCropModal 
          image={images[editingIndex]} 
          onSave={handleSaveCrops} 
          onCancel={() => setEditingIndex(null)} 
        />
      )}
    </div>
  );
};
