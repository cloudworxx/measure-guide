import React, { useState, useRef, useEffect } from "react";

interface MenuBarProps {
  onOpenImage: (file: File) => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
}

export function MenuBar({ onOpenImage, onExportPNG, onExportPDF }: MenuBarProps) {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setFileMenuOpen(false);
  };

  const handleExportPNG = () => {
    onExportPNG();
    setFileMenuOpen(false);
  };

  const handleExportPDF = () => {
    onExportPDF();
    setFileMenuOpen(false);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleFileClick();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="h-8 bg-gray-50 border-b flex items-center px-2 text-sm">
      <div className="relative">
        <button
          className="px-3 py-1 rounded hover:bg-gray-200 transition-colors"
          onClick={() => setFileMenuOpen(!fileMenuOpen)}
        >
          File
        </button>
        
        {fileMenuOpen && (
          <>
            {/* Overlay to close menu when clicking outside */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setFileMenuOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-20 min-w-48">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                onClick={handleFileClick}
              >
                <span>📁</span>
                Bild öffnen...
                <span className="ml-auto text-xs text-gray-400">Ctrl+O</span>
              </button>
              
              <hr className="border-gray-200" />
              
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                onClick={handleExportPNG}
              >
                <span>🖼️</span>
                Export PNG
                <span className="ml-auto text-xs text-gray-400">Ctrl+E</span>
              </button>
              
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                onClick={handleExportPDF}
              >
                <span>📄</span>
                Export PDF
                <span className="ml-auto text-xs text-gray-400">Ctrl+Shift+E</span>
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onOpenImage(file);
        }}
      />
    </div>
  );
}
