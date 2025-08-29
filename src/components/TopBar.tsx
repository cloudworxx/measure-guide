// Simple SVG Icons
const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21,15 16,10 5,21"></polyline>
  </svg>
);

const SaveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17,21 17,13 7,13 7,21"></polyline>
    <polyline points="7,3 7,8 15,8"></polyline>
  </svg>
);

const LoadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <path d="M16 13a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"></path>
    <line x1="16" y1="17" x2="16" y2="21"></line>
    <polyline points="19,18 16,21 13,18"></polyline>
  </svg>
);

const NewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <line x1="12" y1="18" x2="12" y2="12"></line>
    <line x1="9" y1="15" x2="15" y2="15"></line>
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7,10 12,15 17,10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const PdfIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10,9 9,9 8,9"></polyline>
  </svg>
);

interface TopBarProps {
  onOpenImage: (file: File) => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  hasImage: boolean;
  hasUnsavedChanges: boolean;
}

export function TopBar({ onOpenImage, onExportPNG, onExportPDF, onNewProject, onSaveProject, onLoadProject, hasImage, hasUnsavedChanges }: TopBarProps) {
  
  // Function to handle image opening with Tauri dialog
  const handleOpenImageDialog = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readFile } = await import('@tauri-apps/plugin-fs');
      
      const filePath = await open({
        multiple: false,
        filters: [{
          name: 'Bilder',
          extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
        }]
      });
      
      if (filePath) {
        // Read the file and create a File object
        const fileContent = await readFile(filePath);
        const fileName = filePath.split('/').pop() || 'image';
        const mimeType = getImageMimeType(fileName);
        
        const file = new File([fileContent], fileName, { type: mimeType });
        onOpenImage(file);
      }
    } catch (error) {
      console.error('Error opening image:', error);
      alert('Fehler beim Öffnen des Bildes');
    }
  };
  
  // Helper function to determine MIME type from file extension
  const getImageMimeType = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'bmp':
        return 'image/bmp';
      case 'webp':
        return 'image/webp';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'image/jpeg';
    }
  };
  return (
    <div className="fixed top-0 left-0 right-0 h-12 flex items-center justify-between px-4 border-b bg-white/95 backdrop-blur-sm z-50 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="font-bold text-lg text-gray-800">MeasureGuide</span>
        <span className="text-sm text-gray-500 font-medium">by cloudworxx.us</span>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Neu */}
        <button 
          className="group relative p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center"
          onClick={onNewProject}
          title="Neues Projekt"
        >
          <div className="text-gray-600 group-hover:text-gray-800 transition-colors">
            <NewIcon />
          </div>
          {/* Tooltip */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Neu
          </div>
        </button>
        
        {/* Speichern */}
        <button 
          className={`group relative p-2.5 rounded-lg border transition-all duration-200 flex items-center justify-center ${
            hasUnsavedChanges
              ? 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
              : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
          }`}
          onClick={hasUnsavedChanges ? onSaveProject : undefined}
          disabled={!hasUnsavedChanges}
          title={hasUnsavedChanges ? "Projekt speichern" : "Keine Änderungen zum Speichern"}
        >
          <div className={`transition-colors ${
            hasUnsavedChanges
              ? 'text-gray-600 group-hover:text-gray-800'
              : 'text-gray-400'
          }`}>
            <SaveIcon />
          </div>
          {/* Tooltip */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            {hasUnsavedChanges ? "Speichern" : "Keine Änderungen"}
          </div>
        </button>
        
        {/* Laden */}
        <button 
          className="group relative p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center"
          onClick={onLoadProject}
          title="Projekt laden"
        >
          <div className="text-gray-600 group-hover:text-gray-800 transition-colors">
            <LoadIcon />
          </div>
          {/* Tooltip */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Laden
          </div>
        </button>
        
        {/* Trennlinie */}
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
        {/* Bild öffnen/geladen */}
        <button 
          className={`group relative p-2.5 rounded-lg border transition-all duration-200 flex items-center justify-center ${
            hasImage 
              ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50' 
              : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer'
          }`}
          onClick={hasImage ? undefined : handleOpenImageDialog}
          disabled={hasImage}
          title={hasImage ? "Bild geladen" : "Bild öffnen"}
        >
          <div className={`transition-colors ${
            hasImage 
              ? 'text-gray-400' 
              : 'text-gray-600 group-hover:text-gray-800'
          }`}>
            <ImageIcon />
          </div>
          {/* Tooltip */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            {hasImage ? "Bild geladen" : "Bild öffnen"}
          </div>
        </button>
        
        {/* Export PNG */}
        <button 
          className={`group relative p-2.5 rounded-lg border transition-all duration-200 flex items-center justify-center ${
            hasImage
              ? 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
              : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
          }`}
          onClick={hasImage ? onExportPNG : undefined}
          disabled={!hasImage}
          title={hasImage ? "Export PNG" : "Bild laden erforderlich"}
        >
          <div className={`transition-colors ${
            hasImage
              ? 'text-gray-600 group-hover:text-gray-800'
              : 'text-gray-400'
          }`}>
            <DownloadIcon />
          </div>
          {/* Tooltip */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            {hasImage ? "Export PNG" : "Bild laden erforderlich"}
          </div>
        </button>
        
        {/* Export PDF */}
        <button 
          className={`group relative p-2.5 rounded-lg border transition-all duration-200 flex items-center justify-center ${
            hasImage
              ? 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
              : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
          }`}
          onClick={hasImage ? onExportPDF : undefined}
          disabled={!hasImage}
          title={hasImage ? "Export PDF" : "Bild laden erforderlich"}
        >
          <div className={`transition-colors ${
            hasImage
              ? 'text-gray-600 group-hover:text-gray-800'
              : 'text-gray-400'
          }`}>
            <PdfIcon />
          </div>
          {/* Tooltip */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            {hasImage ? "Export PDF" : "Bild laden erforderlich"}
          </div>
        </button>
      </div>
    </div>
  );
}
