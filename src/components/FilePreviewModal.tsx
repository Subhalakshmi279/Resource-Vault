import React from 'react';
import { X, Download, FileText, Image as ImageIcon, Video, File } from 'lucide-react';
import type { Resource } from '../types';
import { getStoragePublicUrl } from '../services/storageService';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  resource
}) => {
  if (!isOpen || !resource || !resource.file_path) return null;

  const filePath = resource.file_path;
  const isBase64 = filePath.startsWith('data:');
  const isUrl = filePath.startsWith('http://') || filePath.startsWith('https://');

  // Resolve storage path to public URL if needed
  const fileUrl = (isBase64 || isUrl) ? filePath : getStoragePublicUrl(filePath);

  // Determine media category by inspecting exact file extension FIRST
  const lowerPath = filePath.toLowerCase();
  const lowerTitle = resource.title.toLowerCase();

  const isPdf = lowerPath.includes('.pdf') || lowerTitle.endsWith('.pdf') || lowerPath.startsWith('data:application/pdf');
  const isImage = lowerPath.includes('.png') || lowerPath.includes('.jpg') || lowerPath.includes('.jpeg') || lowerPath.includes('.webp') || lowerPath.startsWith('data:image/');
  const isVideo = lowerPath.includes('.mp4') || lowerPath.includes('.webm') || lowerPath.startsWith('data:video/');

  const getMediaIcon = () => {
    if (isPdf) return <FileText size={18} color="#7C3AED" strokeWidth={2} />;
    if (isImage) return <ImageIcon size={18} color="#7C3AED" strokeWidth={2} />;
    if (isVideo) return <Video size={18} color="#7C3AED" strokeWidth={2} />;
    return <File size={18} color="#7C3AED" strokeWidth={2} />;
  };

  const handleDownload = async () => {
    if (!fileUrl) return;
    if (isBase64) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = resource.title.includes('.') ? resource.title : `${resource.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = resource.title.includes('.') ? resource.title : `${resource.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      } catch {
        window.open(fileUrl, '_blank');
      }
    }
  };

  return (
    <div className="modal-overlay-bg animate-fade" style={{ zIndex: 1000 }}>
      <div className="modal-sheet" style={{ maxWidth: '680px', width: '92%' }}>
        
        {/* Header */}
        <div className="modal-sheet-header" style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderBottom: '2px solid #1A1A1A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
            {getMediaIcon()}
            <span className="modal-sheet-title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {resource.title}
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} color="#1A1A1A" strokeWidth={2} />
          </button>
        </div>

        {/* Content Preview Body */}
        <div style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', maxHeight: '70vh', overflow: 'auto' }}>
          {isPdf ? (
            <iframe 
              src={fileUrl} 
              title={resource.title}
              style={{ width: '100%', height: '60vh', borderRadius: '8px', border: '2px solid #1A1A1A', backgroundColor: '#FFFFFF' }}
            />
          ) : isImage ? (
            <img 
              src={fileUrl} 
              alt={resource.title} 
              style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px', border: '2px solid #1A1A1A', objectFit: 'contain' }}
            />
          ) : isVideo ? (
            <video 
              controls 
              src={fileUrl} 
              style={{ width: '100%', maxHeight: '60vh', borderRadius: '8px', border: '2px solid #1A1A1A', backgroundColor: '#000000' }}
            >
              Your browser does not support playing this video.
            </video>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <File size={48} color="#7C3AED" strokeWidth={1.5} style={{ marginBottom: '1rem' }} />
              <h4 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0' }}>{resource.title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                This file format cannot be rendered directly in preview.
              </p>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="modal-sheet-footer" style={{ borderTop: '2px solid #1A1A1A', backgroundColor: '#FFFFFF', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <File size={14} />
            <span>File: {resource.title}</span>
          </div>

          <button 
            type="button"
            className="btn-ui btn-ui-primary"
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              border: '2px solid #1A1A1A',
              padding: '0.45rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: '2px 2px 0px #1A1A1A'
            }}
          >
            <Download size={14} />
            <span>Download</span>
          </button>
        </div>

      </div>
    </div>
  );
};
