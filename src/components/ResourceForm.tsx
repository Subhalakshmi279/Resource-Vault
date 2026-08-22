import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Trash2 } from 'lucide-react';
import type { Resource, AreaType, ResourceType } from '../types';
import { PixelAlert } from './PixelIcons';



interface ResourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resourceData: Omit<Resource, 'id' | 'created_at'>) => void;
  onDelete?: (id: string) => void;
  editingResource?: Resource | null;
  existingResources: Resource[];
}

export const ResourceForm: React.FC<ResourceFormProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingResource,
  existingResources
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [area, setArea] = useState<AreaType>('career');
  
  // Topic selection (previously subtopic selection)
  const [topicSelection, setTopicSelection] = useState<string>('create_new');
  const [newTopicText, setNewTopicText] = useState('');

  const [type, setType] = useState<ResourceType>('website');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [filePath, setFilePath] = useState<string | undefined>(undefined);
  
  // URL check warning states
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [bypassDuplicate, setBypassDuplicate] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);



  // Filter existing topics matching the selected area
  const getTopicsForArea = () => {
    return Array.from(
      new Set(
        existingResources
          .filter(res => res.area === area && res.topic)
          .map(res => res.topic)
      )
    ).sort((a, b) => a.localeCompare(b));
  };

  const currentTopics = getTopicsForArea();

  // Sync topic selection state when area changes
  useEffect(() => {
    const topics = getTopicsForArea();
    if (editingResource && editingResource.area === area) {
      setTopicSelection(editingResource.topic);
      setNewTopicText('');
    } else if (topics.length > 0) {
      setTopicSelection(topics[0]);
      setNewTopicText('');
    } else {
      setTopicSelection('create_new');
      setNewTopicText('');
    }
  }, [area, editingResource]);

  // Prepopulate form if editing
  useEffect(() => {
    if (editingResource) {
      setTitle(editingResource.title);
      setUrl(editingResource.url || '');
      setArea(editingResource.area);
      setType(editingResource.type);
      setTags(editingResource.tags);
      setNotes(editingResource.notes || '');
      setFilePath(editingResource.file_path);
      setDuplicateWarning(null);
      setBypassDuplicate(false);
      
      const topics = Array.from(
        new Set(
          existingResources
            .filter(res => res.area === editingResource.area && res.topic)
            .map(res => res.topic)
        )
      );
      if (topics.includes(editingResource.topic)) {
        setTopicSelection(editingResource.topic);
        setNewTopicText('');
      } else {
        setTopicSelection('create_new');
        setNewTopicText(editingResource.topic);
      }
    } else {
      // Reset form fields
      setTitle('');
      setUrl('');
      setArea('career');
      setType('website');
      setTags([]);
      setNotes('');
      setFilePath(undefined);
      setDuplicateWarning(null);
      setBypassDuplicate(false);
      setTopicSelection('create_new');
      setNewTopicText('');
    }
  }, [editingResource, isOpen]);

  // Set type photo on file load
  useEffect(() => {
    if (filePath && type !== 'photo') {
      setType('photo');
    }
  }, [filePath]);

  if (!isOpen) return null;

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setDuplicateWarning(null);
    setBypassDuplicate(false);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFilePath(e.target.result as string);
        setType('photo');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const handleTagBlur = () => {
    const val = tagInput.trim().toLowerCase().replace(/,/g, '');
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
    }
    setTagInput('');
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  // Submit and Validate
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Determine topic value
    let finalTopic = '';
    if (topicSelection === 'create_new') {
      finalTopic = newTopicText.trim();
    } else {
      finalTopic = topicSelection.trim();
    }

    if (!finalTopic) {
      alert('Please select or specify a topic name');
      return;
    }

    // Capitalize topic cleanly (e.g. React, Resume, Startups)
    finalTopic = finalTopic.charAt(0).toUpperCase() + finalTopic.slice(1);

    // Duplicate check
    const normalizedUrl = url.trim().toLowerCase();
    if (normalizedUrl && !bypassDuplicate) {
      const duplicate = existingResources.find(res => {
        const isSameResource = editingResource && res.id === editingResource.id;
        return !isSameResource && res.url?.trim().toLowerCase() === normalizedUrl;
      });

      if (duplicate) {
        setDuplicateWarning(duplicate.title);
        return;
      }
    }

    onSave({
      title: title.trim(),
      url: url.trim() || undefined,
      area,
      topic: finalTopic,
      type,
      tags,
      notes: notes.trim() || undefined,
      file_path: filePath
    });
    onClose();
  };

  const handleDeleteTrigger = () => {
    if (editingResource && onDelete) {
      onDelete(editingResource.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay-bg animate-fade">
      <div className="modal-sheet">
        <div className="modal-sheet-header">
          <span className="modal-sheet-title">
            {editingResource ? 'edit_resource.exe' : 'add_resource.exe'}
          </span>
          <div className="window-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="window-dot min"></span>
            <span className="window-dot max"></span>
            <button 
              type="button" 
              className="window-dot close" 
              onClick={onClose} 
              style={{ padding: 0, width: '12px', height: '12px', cursor: 'pointer' }}
              title="Close window"
            />
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-sheet-body">
            
            {/* Title field */}
            <div className="form-group-block">
              <label className="form-label-text" htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                placeholder="React 19 Documentation"
                className="form-input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* URL field */}
            <div className="form-group-block">
              <label className="form-label-text" htmlFor="url">URL</label>
              <input
                id="url"
                type="url"
                placeholder="https://react.dev"
                className="form-input-field"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
            </div>

            {/* Duplicate URL Warning */}
            {duplicateWarning && (
              <div className="warning-alert-card">
                <div className="warning-alert-title">
                  <PixelAlert size={16} />
                  <span>URL Already Saved</span>
                </div>
                <div>
                  This URL is already saved under: <strong>"{duplicateWarning}"</strong>.
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <button
                    type="button"
                    className="btn-ui btn-ui-secondary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={() => setBypassDuplicate(true)}
                  >
                    Save anyway
                  </button>
                  <button
                    type="button"
                    className="btn-ui btn-ui-secondary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={() => {
                      setDuplicateWarning(null);
                      setUrl('');
                    }}
                  >
                    Change URL
                  </button>
                </div>
              </div>
            )}

            {/* Area & Topic Row */}
            <div className="form-input-row">
              <div className="form-group-block">
                <label className="form-label-text" htmlFor="area">Area *</label>
                <select
                  id="area"
                  className="form-select-field"
                  value={area}
                  onChange={(e) => setArea(e.target.value as AreaType)}
                  required
                >
                  <option value="career">Career</option>
                  <option value="computer">Computer</option>
                  <option value="ai_tech">AI & Tech</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              <div className="form-group-block">
                <label className="form-label-text" htmlFor="topic-select">Topic *</label>
                <select
                  id="topic-select"
                  className="form-select-field"
                  value={topicSelection}
                  onChange={(e) => setTopicSelection(e.target.value)}
                  required
                >
                  {currentTopics.map(top => (
                    <option key={top} value={top}>{top}</option>
                  ))}
                  <option value="create_new">+ Create New Topic...</option>
                </select>
              </div>
            </div>

            {/* Create New Topic text box: visible if select === 'create_new' */}
            {topicSelection === 'create_new' && (
              <div className="form-group-block animate-fade" style={{ marginTop: '-0.5rem' }}>
                <label className="form-label-text" htmlFor="new-topic-input">New Topic Name *</label>
                <input
                  id="new-topic-input"
                  type="text"
                  placeholder="e.g. React, Resume, Startups"
                  className="form-input-field"
                  value={newTopicText}
                  onChange={(e) => setNewTopicText(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Media Type */}
            <div className="form-group-block">
              <label className="form-label-text" htmlFor="type">Type *</label>
              <select
                id="type"
                className="form-select-field"
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                required
              >
                <option value="website">Website</option>
                <option value="video">Video</option>
                <option value="article">Article</option>
                <option value="book">Book</option>
                <option value="tool">Tool</option>
                <option value="photo">Photo</option>
                <option value="idea">Idea</option>
                <option value="doc">Document</option>
              </select>
            </div>

            {/* Tags chips manager */}
            <div className="form-group-block">
              <label className="form-label-text">Tags</label>
              <div className="form-tag-chips-wrapper">
                {tags.map((tag, idx) => (
                  <span key={idx} className="form-tag-chip-item">
                    #{tag}
                    <button
                      type="button"
                      className="form-tag-chip-remove-btn"
                      onClick={() => removeTag(idx)}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={tags.length === 0 ? "Type tag & press Enter" : ""}
                  className="form-tag-chip-input-field"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleTagBlur}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="form-group-block">
              <label className="form-label-text" htmlFor="notes">Notes / Description</label>
              <textarea
                id="notes"
                placeholder="Add reference notes..."
                className="form-textarea-field"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Photo dropzone: only visible if type === Photo */}
            {type === 'photo' && (
              <div className="form-group-block" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                <label className="form-label-text">Upload Reference Photo *</label>
                {!filePath ? (
                  <div
                    className={`form-dropzone-box ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="form-dropzone-title">
                      Drag and drop image here, or <strong>browse files</strong>
                    </span>
                    <span className="form-dropzone-sub">
                      Supports PNG, JPG, WebP
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileInputChange}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div className="form-dropzone-preview-box">
                      <img src={filePath} alt="Preview" className="form-dropzone-preview-image" />
                      <button
                        type="button"
                        className="form-dropzone-preview-delete"
                        onClick={() => setFilePath(undefined)}
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#0d9488', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <ImageIcon size={12} /> Image attached
                      </span>
                      <button
                        type="button"
                        className="btn-ui btn-ui-secondary"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change image
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileInputChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-sheet-footer">
            {/* Delete button inside edit form */}
            {editingResource && onDelete ? (
              <button
                type="button"
                className="btn-ui btn-ui-danger"
                onClick={handleDeleteTrigger}
                title="Delete this resource permanently"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : (
              <div /> // Spacer
            )}
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-ui btn-ui-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-ui btn-ui-primary"
                disabled={duplicateWarning !== null && !bypassDuplicate}
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
