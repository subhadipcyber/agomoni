import React from 'react';
import { X, ZoomIn, Download } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ isOpen, imageUrl, title, onClose }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-2xl w-full neu-flat p-4 rounded-3xl overflow-hidden border border-[#E8DFC9] bg-[#F7F2E7] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2D7C2]">
          <div className="flex items-center gap-2 text-[#6E1510]">
            <ZoomIn className="w-5 h-5 text-[#851C15]" />
            <h3 className="font-serif-vintage font-bold text-lg text-[#5A1310]">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={imageUrl} 
              download={`${title.toLowerCase().replace(/\s+/g, '_')}.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl neu-btn text-[#771B16] hover:text-[#5A1310] transition-colors"
              title="Download Image"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl neu-btn text-[#771B16] hover:text-[#5A1310] transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center bg-[#ECE4D4] rounded-2xl p-2 max-h-[75vh] overflow-auto neu-inset">
          <img 
            src={imageUrl} 
            alt={title} 
            className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};
