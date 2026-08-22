import React from 'react';
import type { Resource } from '../types';

interface ResourceCardProps {
  resource: Resource;
  onEdit: (resource: Resource) => void;
  onDelete: (id: string) => void;
  onSelect: (resource: Resource) => void;
  onTopicClick?: (topic: string) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onEdit,
  onDelete,
  onSelect,
  onTopicClick
}) => {

  // Get retro file extension based on type
  const getFileExtension = () => {
    switch (resource.type) {
      case 'video': return '.mp4';
      case 'photo': return '.png';
      case 'doc': return '.doc';
      case 'book': return '.pdf';
      case 'tool': return '.exe';
      case 'idea': return '.txt';
      case 'article': return '.md';
      case 'website':
      default:
        return '.url';
    }
  };

  // Get retro emoji file icon
  const getFileEmoji = () => {
    switch (resource.type) {
      case 'video': return '🎬';
      case 'photo': return '🖼️';
      case 'doc': return '📄';
      case 'book': return '📖';
      case 'tool': return '⚙️';
      case 'idea': return '💡';
      case 'article': return '📝';
      case 'website':
      default:
        return '🌐';
    }
  };

  // User-friendly relative time label
  const getFormattedTime = () => {
    const now = Date.now();
    const diff = now - new Date(resource.created_at).getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes <= 0 ? 1 : minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      const d = new Date(resource.created_at);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  const handleTopicClick = (e: React.MouseEvent) => {
    if (onTopicClick) {
      e.stopPropagation();
      onTopicClick(resource.topic);
    }
  };

  const sanitizedFilename = resource.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .substring(0, 16);

  return (
    <div 
      className="file-card-window animate-fade" 
      onClick={() => onSelect(resource)}
    >
      {/* File title bar */}
      <div className="file-card-header">
        <div className="file-card-title">
          <span className="file-card-icon">{getFileEmoji()}</span>
          <span>{sanitizedFilename}{getFileExtension()}</span>
        </div>
        
        {/* Window action controls (Edit / Delete) */}
        <div className="file-card-controls">
          <button 
            type="button" 
            className="file-card-dot edit" 
            onClick={(e) => { e.stopPropagation(); onEdit(resource); }}
            title="Edit file details"
          >
            ✏️
          </button>
          <button 
            type="button" 
            className="file-card-dot close" 
            onClick={(e) => { e.stopPropagation(); onDelete(resource.id); }}
            title="Delete file"
          >
            ×
          </button>
        </div>
      </div>

      {/* File card main content block */}
      <div className="file-card-body">
        <h3 className="file-card-resource-title">{resource.title}</h3>
        
        {/* Optional Image thumbnail for photo formats */}
        {resource.type === 'photo' && resource.file_path && (
          <div className="file-card-thumb">
            <img 
              src={resource.file_path} 
              alt={resource.title} 
              loading="lazy" 
            />
          </div>
        )}

        {/* Badge details */}
        <div className="file-card-meta">
          <span className={`badge-type ${resource.type}`}>{resource.type}</span>
          <span 
            className="badge-topic" 
            onClick={handleTopicClick}
            title={`Filter by topic: ${resource.topic}`}
          >
            {resource.topic}
          </span>
        </div>
        
        <div className="file-card-footer-info">
          <span>{getFormattedTime()}</span>
          {resource.url && (
            <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>
              {resource.url.replace(/https?:\/\/(www\.)?/, '').substring(0, 20)}...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
