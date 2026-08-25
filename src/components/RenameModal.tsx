import React, { useState, useEffect } from 'react';
import { X, Pencil, AlertCircle } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => Promise<void> | void;
  initialName: string;
  entityType: 'subtopic' | 'area';
  existingNames?: string[];
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName,
  entityType,
  existingNames = []
}) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(initialName);
    setError(null);
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError(`Please enter a valid ${entityType} name.`);
      return;
    }

    if (trimmed.length > 50) {
      setError('Name cannot exceed 50 characters.');
      return;
    }

    if (
      trimmed.toLowerCase() !== initialName.toLowerCase() &&
      existingNames.some(existing => existing.toLowerCase() === trimmed.toLowerCase())
    ) {
      setError(`A ${entityType} with the name "${trimmed}" already exists.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(trimmed);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to rename. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay-bg animate-fade" style={{ zIndex: 1100 }}>
      <div className="modal-sheet" style={{ maxWidth: '440px', width: '92%' }}>
        
        {/* Header */}
        <div className="modal-sheet-header" style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderBottom: '2px solid #1A1A1A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Pencil size={18} color="#7C3AED" strokeWidth={2} />
            <span className="modal-sheet-title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              Rename {entityType === 'subtopic' ? 'Subtopic' : 'Area'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: '#1A1A1A' }}>
              {entityType === 'subtopic' ? 'Subtopic Name' : 'Area Name'}
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder={`Enter new ${entityType} name`}
              autoFocus
              maxLength={50}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '2px solid #1A1A1A',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.08)'
              }}
            />

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#EF4444', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 600 }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-sheet-footer" style={{ borderTop: '2px solid #1A1A1A', backgroundColor: '#F8FAFC', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
            <button
              type="button"
              className="btn-ui btn-ui-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-ui btn-ui-primary"
              disabled={isSubmitting || !name.trim()}
              style={{
                backgroundColor: '#7C3AED',
                color: '#FFFFFF',
                border: '2px solid #1A1A1A',
                boxShadow: '2px 2px 0px #1A1A1A',
                padding: '0.45rem 1.1rem',
                fontWeight: 700
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Rename'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
