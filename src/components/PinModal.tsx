import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceTitle: string;
  resourceTopic: string;
  homePinnedIds: string[];
  subtopicPinnedMap: Record<string, string[]>;
  onSave: (homePinned: boolean, subtopicPinned: boolean) => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceTitle,
  resourceTopic,
  homePinnedIds,
  subtopicPinnedMap,
  onSave
}) => {
  const isHomeOriginallyPinned = homePinnedIds.includes(resourceId);
  const currentSubtopicPinned = subtopicPinnedMap[resourceTopic] || [];
  const isSubtopicOriginallyPinned = currentSubtopicPinned.includes(resourceId);

  const [isHomeChecked, setIsHomeChecked] = useState(isHomeOriginallyPinned);
  const [isSubtopicChecked, setIsSubtopicChecked] = useState(isSubtopicOriginallyPinned);

  // Sync checkboxes with current external pin states when modal opens
  useEffect(() => {
    setIsHomeChecked(isHomeOriginallyPinned);
    setIsSubtopicChecked(isSubtopicOriginallyPinned);
  }, [isOpen, resourceId, homePinnedIds, subtopicPinnedMap]);

  if (!isOpen) return null;

  const isHomeLimitReached = homePinnedIds.length >= 5 && !isHomeOriginallyPinned;
  const isSubtopicLimitReached = currentSubtopicPinned.length >= 3 && !isSubtopicOriginallyPinned;

  const handleSave = () => {
    onSave(isHomeChecked, isSubtopicChecked);
    onClose();
  };

  return (
    <div className="modal-overlay-bg animate-fade">
      <div className="modal-sheet" style={{ maxWidth: '360px' }}>
        <div className="modal-sheet-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF', padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
          <h3 className="modal-sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--border-color)', margin: 0, fontSize: '1.15rem' }}>
            <span>📌 Pin Resource</span>
          </h3>
          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <X size={20} color="#1A1A1A" strokeWidth={2} />
          </button>
        </div>

        <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Choose where you want <strong>"{resourceTitle}"</strong> to appear.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
            {/* Home Checkbox */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: isHomeLimitReached ? 'not-allowed' : 'pointer', opacity: isHomeLimitReached ? 0.6 : 1 }}>
                <input 
                  type="checkbox"
                  className="table-checkbox"
                  checked={isHomeChecked}
                  disabled={isHomeLimitReached}
                  onChange={(e) => setIsHomeChecked(e.target.checked)}
                />
                <span>Home (Pinned Section)</span>
              </label>
              {isHomeLimitReached && (
                <span style={{ fontSize: '0.7rem', color: '#EF4444', marginLeft: '1.5rem' }}>
                  Home is full. Remove a pinned resource before adding another.
                </span>
              )}
            </div>

            {/* Subtopic Checkbox */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: isSubtopicLimitReached ? 'not-allowed' : 'pointer', opacity: isSubtopicLimitReached ? 0.6 : 1 }}>
                <input 
                  type="checkbox"
                  className="table-checkbox"
                  checked={isSubtopicChecked}
                  disabled={isSubtopicLimitReached}
                  onChange={(e) => setIsSubtopicChecked(e.target.checked)}
                />
                <span>This Subtopic ({resourceTopic})</span>
              </label>
              {isSubtopicLimitReached && (
                <span style={{ fontSize: '0.7rem', color: '#EF4444', marginLeft: '1.5rem' }}>
                  This subtopic already has 3 pinned resources.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="modal-sheet-footer" style={{ borderTop: 'none', backgroundColor: 'transparent', padding: '0 1.5rem 1.5rem 1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button 
            type="button"
            className="btn-ui btn-ui-secondary" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button"
            className="btn-ui btn-ui-primary" 
            onClick={handleSave}
            style={{
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              border: '2px solid #1A1A1A',
              boxShadow: '2px 2px 0px #1A1A1A'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
