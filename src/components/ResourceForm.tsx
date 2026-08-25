import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Trash2, Paperclip } from 'lucide-react';




import type { Resource, AreaType, ResourceType } from '../types';
import { PixelAlert } from './PixelIcons';
import { Input } from './Input';
import { isSupabaseConfigured } from '../supabaseClient';
import { uploadFileToStorage } from '../services/storageService';



interface ResourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resourceData: Omit<Resource, 'id' | 'created_at'>) => void;
  onDelete?: (id: string) => void;
  editingResource?: Resource | null;
  existingResources: Resource[];
  initialArea?: AreaType | null;
  initialTopic?: string | null;
}

export const ResourceForm: React.FC<ResourceFormProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingResource,
  existingResources,
  initialArea,
  initialTopic
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [area, setArea] = useState<AreaType>('career');
  
  // Topic selection (previously subtopic selection)
  const [topicSelection, setTopicSelection] = useState<string>('create_new');
  const [newTopicText, setNewTopicText] = useState('');

  const [type, setType] = useState<ResourceType>('website');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [filePath, setFilePath] = useState<string | undefined>(undefined);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState(false);
  
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

  // Prepopulate form if editing or pre-select active area/topic when creating
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
      // Reset form fields with initialArea & initialTopic
      const defaultArea = initialArea || 'career';
      setTitle('');
      setUrl('');
      setArea(defaultArea);
      setType('website');
      setTags([]);
      setNotes('');
      setFilePath(undefined);
      setDuplicateWarning(null);
      setBypassDuplicate(false);

      const topics = Array.from(
        new Set(
          existingResources
            .filter(res => res.area === defaultArea && res.topic)
            .map(res => res.topic)
        )
      );
      if (initialTopic && topics.includes(initialTopic)) {
        setTopicSelection(initialTopic);
        setNewTopicText('');
      } else if (initialTopic) {
        setTopicSelection('create_new');
        setNewTopicText(initialTopic);
      } else if (topics.length > 0) {
        setTopicSelection(topics[0]);
        setNewTopicText('');
      } else {
        setTopicSelection('create_new');
        setNewTopicText('');
      }
    }
  }, [editingResource, isOpen, initialArea, initialTopic]);

  if (!isOpen) return null;

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setDuplicateWarning(null);
    setBypassDuplicate(false);
  };

  const handleFile = (file: File) => {
    if (file.size > 1.5 * 1024 * 1024) {
      alert('File size exceeds 1.5MB limit. Please upload a smaller file.');
      return;
    }
    setRawFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFilePath(e.target.result as string);
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



  // Submit and Validate
  const handleSubmit = async (e: React.FormEvent) => {
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

    let finalFilePath = filePath;
    if (isSupabaseConfigured && rawFile) {
      try {
        finalFilePath = await uploadFileToStorage(rawFile);
      } catch (err) {
        console.error('Error uploading file to Supabase storage:', err);
        alert('Failed to upload file to database storage.');
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
      file_path: finalFilePath
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
            {editingResource ? 'Edit Resource' : 'Add Resource'}
          </span>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
            title="Close"
          >
            <X size={20} color="#1A1A1A" strokeWidth={2} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-sheet-body">
            
            <div className="form-group-block">
              <label className="form-label-text" htmlFor="title">Title *</label>
              <Input
                id="title"
                type="text"
                placeholder="React 19 Documentation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group-block">
              <label className="form-label-text" htmlFor="url">URL</label>
              <Input
                id="url"
                type="url"
                placeholder="https://react.dev"
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

            {topicSelection === 'create_new' && (
              <div className="form-group-block animate-fade" style={{ marginTop: '-0.5rem' }}>
                <label className="form-label-text" htmlFor="new-topic-input">New Topic Name *</label>
                <Input
                  id="new-topic-input"
                  type="text"
                  placeholder="e.g. React, Resume, Startups"
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

            {/* General file/image upload dropzone (Always visible) */}
            <div className="form-group-block" style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <label className="form-label-text">Upload File / Image</label>
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
                    Drag and drop file here, or <strong>browse files</strong>
                  </span>
                  <span className="form-dropzone-sub">
                    Supports PNG, JPG, WebP, PDF, TXT (Max 1.5MB)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf,text/plain"
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div className="form-dropzone-preview-box">
                    {!imageError && (filePath.startsWith('data:image/') || filePath.match(/\.(jpeg|jpg|gif|png|webp|svg)/i)) ? (
                      <img 
                        src={filePath} 
                        alt="Preview" 
                        className="form-dropzone-preview-image"
                        onError={() => setImageError(true)} 
                      />
                    ) : (
                      <div className="form-dropzone-attachment-badge">
                        <Paperclip size={16} color="#1A1A1A" strokeWidth={2} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {rawFile ? rawFile.name : 'File Attachment Loaded'}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      className="form-dropzone-preview-delete"
                      onClick={() => {
                        setFilePath(undefined);
                        setRawFile(null);
                        setImageError(false);
                      }}
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>




                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#0d9488', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <ImageIcon size={12} /> File attached
                    </span>
                    <button
                      type="button"
                      className="btn-ui btn-ui-secondary"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change file
                    </button>


                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf,text/plain"
                      style={{ display: 'none' }}
                      onChange={handleFileInputChange}
                    />
                  </div>
                </div>
              )}
            </div>
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
