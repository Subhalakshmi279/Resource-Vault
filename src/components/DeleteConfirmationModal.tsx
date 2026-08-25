import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  entityType: 'subtopic' | 'area';
  fileCount: number;
  subtopicCount?: number;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  entityType,
  fileCount,
  subtopicCount = 0
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmClick = async () => {
    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await onConfirm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasContents = entityType === 'subtopic' ? fileCount > 0 : (subtopicCount > 0 || fileCount > 0);

  return (
    <div className="modal-overlay-bg animate-fade" style={{ zIndex: 1150 }}>
      <div className="modal-sheet" style={{ maxWidth: '440px', width: '92%' }}>
        
        {/* Header */}
        <div className="modal-sheet-header" style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderBottom: '2px solid #1A1A1A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ backgroundColor: '#FEE2E2', padding: '0.35rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="#DC2626" strokeWidth={2.5} />
            </div>
            <span className="modal-sheet-title" style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
              Delete "{title}"?
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

        {/* Content Body */}
        <div style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
          {entityType === 'subtopic' ? (
            hasContents ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#1A1A1A', lineHeight: 1.5 }}>
                This subtopic contains <strong>{fileCount} {fileCount === 1 ? 'file' : 'files'}</strong>.<br />
                Deleting this subtopic will permanently delete the subtopic and all its files. This action cannot be undone.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#1A1A1A', lineHeight: 1.5 }}>
                This subtopic is empty.<br />
                Deleting this subtopic will permanently remove it. This action cannot be undone.
              </p>
            )
          ) : (
            hasContents ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#1A1A1A', lineHeight: 1.5 }}>
                This area contains <strong>{subtopicCount} {subtopicCount === 1 ? 'subtopic' : 'subtopics'}</strong> and <strong>{fileCount} {fileCount === 1 ? 'file' : 'files'}</strong>.<br />
                Deleting this area will permanently delete all its contents. This action cannot be undone.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#1A1A1A', lineHeight: 1.5 }}>
                This area is empty.<br />
                Deleting this area will permanently remove it. This action cannot be undone.
              </p>
            )
          )}

          {errorMessage && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#FEE2E2', border: '1.5px solid #DC2626', borderRadius: '6px', fontSize: '0.75rem', color: '#B91C1C', fontWeight: 600 }}>
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-sheet-footer" style={{ borderTop: '2px solid #1A1A1A', backgroundColor: '#F8FAFC', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button
            type="button"
            className="btn-ui btn-ui-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn-ui"
            onClick={handleConfirmClick}
            disabled={isDeleting}
            style={{
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              border: '2px solid #1A1A1A',
              boxShadow: '2px 2px 0px #1A1A1A',
              padding: '0.45rem 1.1rem',
              fontWeight: 700,
              cursor: isDeleting ? 'not-allowed' : 'pointer'
            }}
          >
            {isDeleting ? 'Deleting...' : (hasContents ? 'Delete Permanently' : `Delete ${entityType === 'subtopic' ? 'Subtopic' : 'Area'}`)}
          </button>
        </div>

      </div>
    </div>
  );
};
