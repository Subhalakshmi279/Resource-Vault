import { useState, useEffect } from 'react';
import {
  Home,
  Heart,
  Briefcase,
  Laptop,
  AlertCircle,
  Folder,
  Plus,
  ArrowLeft,
  Sparkles,
  X,
  ExternalLink,
  ChevronRight,
  Trash2,
  Pencil
} from 'lucide-react';
import { ResourceForm } from './components/ResourceForm';
import { Input } from './components/Input';
import { INITIAL_RESOURCES } from './mockData';
import type { Resource, AreaType, ResourceType } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

type ViewType = 'home' | 'area' | 'topic' | 'search' | 'detail' | 'all' | 'recent';

function App() {
  // Resources Database Store
  const [resources, setResources] = useState<Resource[]>([]);

  // Navigation View Router
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [activeArea, setActiveArea] = useState<AreaType | null>(null);
  const [activeTopicString, setActiveTopicString] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');

  // Modal Control States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  // Table Selection & Pagination States
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [currentPageTopic, setCurrentPageTopic] = useState(1);
  const [deletingMultipleResources, setDeletingMultipleResources] = useState(false);

  // Recently Visited Subtopics State (Internal history tracking)
  const [recentlyVisited, setRecentlyVisited] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('catalog_recently_visited');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [homePinnedIds, setHomePinnedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('resourceVault_homePinnedIds');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [subtopicPinnedMap, setSubtopicPinnedMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('resourceVault_subtopicPinnedMap');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Pin destination modal states
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinTargetResourceId, setPinTargetResourceId] = useState<string | null>(null);

  // Bulk Move States
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveToArea, setMoveToArea] = useState<AreaType | ''>('');
  const [moveToSubtopic, setMoveToSubtopic] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('catalog_recently_visited', JSON.stringify(recentlyVisited));
  }, [recentlyVisited]);

  useEffect(() => {
    localStorage.setItem('resourceVault_homePinnedIds', JSON.stringify(homePinnedIds));
  }, [homePinnedIds]);

  useEffect(() => {
    localStorage.setItem('resourceVault_subtopicPinnedMap', JSON.stringify(subtopicPinnedMap));
  }, [subtopicPinnedMap]);

  // Clean stale pin references if resources change or are deleted
  useEffect(() => {
    if (resources.length === 0) return;
    const existingIds = new Set(resources.map(r => r.id));

    setHomePinnedIds(prev => {
      const filtered = prev.filter(id => existingIds.has(id));
      if (filtered.length !== prev.length) {
        return filtered;
      }
      return prev;
    });

    setSubtopicPinnedMap(prev => {
      let mapChanged = false;
      const nextMap: Record<string, string[]> = {};
      Object.entries(prev).forEach(([topic, ids]) => {
        const cleanedIds = ids.filter(id => existingIds.has(id));
        if (cleanedIds.length !== ids.length) {
          mapChanged = true;
        }
        if (cleanedIds.length > 0) {
          nextMap[topic] = cleanedIds;
        } else {
          mapChanged = true;
        }
      });
      if (mapChanged) {
        return nextMap;
      }
      return prev;
    });
  }, [resources]);

  // 1. Initial Load: Seed mock data or fetch from Supabase
  useEffect(() => {
    const loadResources = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('resources')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          if (data) {
            setResources(data as Resource[]);
          }
        } catch (err) {
          console.error('Error fetching resources from Supabase:', err);
          // Fallback to local storage if query fails
          const savedResources = localStorage.getItem('catalog_resources');
          if (savedResources) {
            try {
              setResources(JSON.parse(savedResources));
            } catch {
              setResources(INITIAL_RESOURCES);
            }
          } else {
            setResources(INITIAL_RESOURCES);
            localStorage.setItem('catalog_resources', JSON.stringify(INITIAL_RESOURCES));
          }
        }
      } else {
        const savedResources = localStorage.getItem('catalog_resources');
        if (savedResources) {
          try {
            setResources(JSON.parse(savedResources));
          } catch {
            setResources(INITIAL_RESOURCES);
          }
        } else {
          setResources(INITIAL_RESOURCES);
          localStorage.setItem('catalog_resources', JSON.stringify(INITIAL_RESOURCES));
        }
      }
    };
    loadResources();
  }, []);


  const handleReturnFromSearch = () => {
    setActiveView('home');
    setActiveArea(null);
    setActiveTopicString(null);
    setSearchQuery('');
  };

  // Helper: Count resources in a specific Area
  const getAreaCount = (areaKey: AreaType) => {
    return resources.filter(res => res.area === areaKey).length;
  };



  // Helper: Collect unique Topics from the catalog for a specific Area
  const getUniqueTopicsListForArea = (areaKey: AreaType) => {
    const topics = Array.from(
      new Set(resources.filter(res => res.area === areaKey).map(res => res.topic))
    ).filter(Boolean);
    return topics.sort((a, b) => a.localeCompare(b));
  };

  // Save resource (Insert or Edit)
  const handleSaveResource = async (resourceData: Omit<Resource, 'id' | 'created_at'>) => {
    if (isSupabaseConfigured) {
      try {
        if (editingResource) {
          // Edit in Supabase
          const { error } = await supabase
            .from('resources')
            .update({
              title: resourceData.title,
              url: resourceData.url,
              file_path: resourceData.file_path,
              area: resourceData.area,
              topic: resourceData.topic,
              type: resourceData.type,
              tags: resourceData.tags,
              notes: resourceData.notes,
              ai_confidence: resourceData.ai_confidence
            })
            .eq('id', editingResource.id);
          if (error) throw error;

          const updated = resources.map(res => 
            res.id === editingResource.id 
              ? { ...res, ...resourceData }
              : res
          );
          setResources(updated);
          if (selectedResource && selectedResource.id === editingResource.id) {
            setSelectedResource({ ...selectedResource, ...resourceData });
          }
        } else {
          // Insert in Supabase
          const { data, error } = await supabase
            .from('resources')
            .insert([resourceData])
            .select();
          if (error) throw error;
          if (data && data[0]) {
            setResources([data[0] as Resource, ...resources]);
          }
        }
      } catch (err) {
        console.error('Error saving resource in Supabase:', err);
        alert('Failed to save to Supabase. Falling back to local copy.');
      }
    } else {
      // Local fallback
      let updated: Resource[];
      if (editingResource) {
        updated = resources.map(res => 
          res.id === editingResource.id 
            ? { ...res, ...resourceData }
            : res
        );
        if (selectedResource && selectedResource.id === editingResource.id) {
          setSelectedResource({ ...selectedResource, ...resourceData });
        }
      } else {
        const newResource: Resource = {
          ...resourceData,
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
          created_at: new Date().toISOString()
        };
        updated = [newResource, ...resources];
      }
      setResources(updated);
      localStorage.setItem('catalog_resources', JSON.stringify(updated));
    }

    setEditingResource(null);
    setIsFormOpen(false);

  };

  // Delete Resource
  const handleDeleteResource = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('resources')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setResources(resources.filter(res => res.id !== id));
      } catch (err) {
        console.error('Error deleting resource from Supabase:', err);
        alert('Failed to delete from Supabase.');
      }
    } else {
      const updated = resources.filter(res => res.id !== id);
      setResources(updated);
      localStorage.setItem('catalog_resources', JSON.stringify(updated));
    }

    setDeletingResourceId(null);
    if (selectedResource && selectedResource.id === id) {
      setSelectedResource(null);
    }
  };

  const handleOpenAddForm = () => {
    setEditingResource(null);
    setIsFormOpen(true);
  };

  // View switch triggers
  const handleGoHome = () => {
    setActiveView('home');
    setActiveArea(null);
    setActiveTopicString(null);
    setSelectedResource(null);
    setSearchQuery('');
    setSelectedType('all');
    setSortOrder('newest');
    setSelectedResources([]);
    setCurrentPageTopic(1);
  };

  const handleGoToArea = (area: AreaType) => {
    setActiveArea(area);
    setActiveTopicString(null);
    setSelectedResource(null);
    setSelectedType('all');
    setSearchQuery('');
    setSortOrder('newest');
    setActiveView('area');
    setSelectedResources([]);
    setCurrentPageTopic(1);
  };

  const handleGoToTopic = (topicName: string, areaHint?: AreaType) => {
    let area = areaHint;
    if (!area) {
      const match = resources.find(res => res.topic === topicName);
      if (match) {
        area = match.area;
      }
    }
    setActiveArea(area || null);
    setActiveTopicString(topicName);
    setSelectedResource(null);
    setSelectedType('all');
    setSearchQuery('');
    setSortOrder('newest');
    setActiveView('topic');
    setCurrentPageTopic(1);
    setSelectedResources([]);

    // Track recently visited subtopics
    setRecentlyVisited(prev => {
      const filtered = prev.filter(t => t !== topicName);
      return [topicName, ...filtered].slice(0, 5);
    });
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedResources(prev => 
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (visibleItems: Resource[]) => {
    const visibleIds = visibleItems.map(item => item.id);
    const allSelected = visibleIds.every(id => selectedResources.includes(id));
    if (allSelected) {
      setSelectedResources(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedResources(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleConfirmDeleteMultiple = async () => {
    if (selectedResources.length === 0) return;
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('resources')
          .delete()
          .in('id', selectedResources);
        if (error) throw error;
      }
      setResources(prev => prev.filter(res => !selectedResources.includes(res.id)));
      setSelectedResources([]);
      setDeletingMultipleResources(false);
    } catch (err) {
      console.error("Error deleting multiple resources:", err);
    }
  };

  const handleConfirmMoveSelected = async () => {
    if (selectedResources.length === 0 || !moveToArea || !moveToSubtopic.trim()) return;
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('resources')
          .update({ area: moveToArea, topic: moveToSubtopic.trim() })
          .in('id', selectedResources);
        if (error) throw error;
      }
      setResources(prev => 
        prev.map(res => 
          selectedResources.includes(res.id) 
            ? { ...res, area: moveToArea, topic: moveToSubtopic.trim() } 
            : res
        )
      );
      setSelectedResources([]);
      setIsMoveModalOpen(false);
      
      // Track newly created subtopic in recently visited automatically
      setRecentlyVisited(prev => {
        const filtered = prev.filter(t => t !== moveToSubtopic.trim());
        return [moveToSubtopic.trim(), ...filtered].slice(0, 5);
      });
    } catch (err) {
      console.error("Error moving multiple resources:", err);
    }
  };

  const handleEditSelected = () => {
    if (selectedResources.length !== 1) return;
    const target = resources.find(res => res.id === selectedResources[0]);
    if (target) {
      setEditingResource(target);
      setIsFormOpen(true);
    }
  };



  // Get resources for the current active list view (BEFORE tags, search, and type filters)
  const getBaseFilteredResources = () => {
    switch (activeView) {
      case 'area':
        return resources.filter(res => res.area === activeArea);
      case 'topic':
        return resources.filter(res => {
          const matchTopic = res.topic === activeTopicString;
          if (activeArea) {
            return matchTopic && res.area === activeArea;
          }
          return matchTopic;
        });
      case 'recent':
      case 'all':
      case 'home':
      default:
        return resources;
    }
  };

  const baseResources = getBaseFilteredResources();

  // Apply search query, type filter, and sort inside standard view lists
  const getContextFilteredResources = () => {
    let list = baseResources;

    // 1. Search filter query (searches title, description/notes, url/domain, type, area, subtopic)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(res => {
        const matchesTitle = res.title ? res.title.toLowerCase().includes(q) : false;
        const matchesNotes = res.notes ? res.notes.toLowerCase().includes(q) : false;
        const matchesDescription = res.description ? res.description.toLowerCase().includes(q) : false;
        const matchesUrl = res.url ? res.url.toLowerCase().includes(q) : false;
        const matchesType = res.type ? res.type.toLowerCase().includes(q) : false;
        const matchesArea = res.area ? res.area.toLowerCase().includes(q) : false;
        const matchesTopic = res.topic ? res.topic.toLowerCase().includes(q) : false;
        return matchesTitle || matchesNotes || matchesDescription || matchesUrl || matchesType || matchesArea || matchesTopic;
      });
    }

    // 2. Media Type Filter
    if (selectedType !== 'all') {
      list = list.filter(res => res.type === selectedType);
    }

    // 3. Sort Order
    if (sortOrder === 'newest') {
      list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortOrder === 'oldest') {
      list = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortOrder === 'az') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === 'za') {
      list = [...list].sort((a, b) => b.title.localeCompare(a.title));
    }

    return list;
  };

  const finalListResources = getContextFilteredResources();
  const searchResultsResources = finalListResources;


  const homePinnedResources = resources
    .filter(res => homePinnedIds.includes(res.id))
    .slice(0, 5);

  const homepageRecentlyAdded = [...resources]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
  const getRelativeTimeString = (dateStr: string) => {
    const timeMs = new Date(dateStr).getTime();
    const diffMs = Date.now() - timeMs;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getDomain = (urlStr?: string) => {
    if (!urlStr) return '';
    try {
      const url = new URL(urlStr);
      return url.hostname.replace('www.', '');
    } catch (e) {
      return '';
    }
  };

  // Sidebar Icons
  const getAreaIcon = (area: AreaType) => {
    switch (area) {
      case 'career':
        return <Briefcase size={16} color="#1A1A1A" strokeWidth={2} />;
      case 'computer':
        return <Laptop size={16} color="#1A1A1A" strokeWidth={2} />;
      case 'ai_tech':
        return <Sparkles size={16} color="#1A1A1A" strokeWidth={2} />;
      case 'personal':
        return <Heart size={16} color="#1A1A1A" strokeWidth={2} />;
    }
  };

  // Readable Area Name Labels
  const getAreaNameReadable = (area: AreaType | null) => {
    if (!area) return '';
    if (area === 'ai_tech') return 'AI & Tech';
    return area.charAt(0).toUpperCase() + area.slice(1);
  };

  const getMainWindowTitle = () => {
    switch (activeView) {
      case 'home':
        return 'home_vault.exe';
      case 'area':
        return `${activeArea || 'area'}_explorer.sys`;
      case 'topic':
        return `${activeTopicString || 'topic'}_resources.txt`;
      case 'search':
        return 'search_results.exe';
      case 'detail':
        return `${selectedResource?.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 20) || 'detail'}.txt`;
      default:
        return 'vault.exe';
    }
  };

  const renderRefinedResourceTable = (resourcesList: Resource[]) => {
    if (resourcesList.length === 0) {
      return (
        <div className="quiet-empty-state" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center' }}>
          <div className="modal-sheet" style={{ maxWidth: '340px', width: '100%', position: 'static', transform: 'none', margin: '0 auto' }}>
            <div className="modal-sheet-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF', padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
              <h3 className="modal-sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--border-color)', margin: 0, fontSize: '1.15rem' }}>
                <span>📁 Search Results</span>
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  handleGoHome();
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} color="#1A1A1A" strokeWidth={2} />
              </button>
            </div>

            <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>
                No resources match your search or filter criteria.
              </p>
            </div>

            <div className="modal-sheet-footer" style={{ borderTop: 'none', backgroundColor: 'transparent', padding: '0 1.5rem 1.5rem 1.5rem' }}>
              <button 
                type="button"
                className="btn-ui btn-ui-primary" 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  handleGoHome();
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  border: '2px solid #1A1A1A',
                  boxShadow: '2px 2px 0px #1A1A1A'
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    const ITEMS_PER_PAGE = 10;
    const totalItems = resourcesList.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const safeCurrentPage = Math.min(currentPageTopic, totalPages || 1);
    
    const paginatedResources = resourcesList.slice(
      (safeCurrentPage - 1) * ITEMS_PER_PAGE,
      safeCurrentPage * ITEMS_PER_PAGE
    );

    const visibleIds = paginatedResources.map(item => item.id);
    const isAllPageSelected = visibleIds.length > 0 && visibleIds.every(id => selectedResources.includes(id));

    const rangeStart = totalItems === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
    const rangeEnd = Math.min(safeCurrentPage * ITEMS_PER_PAGE, totalItems);

    return (
      <>
        {/* Selection Action Toolbar */}
        <div className="refined-selection-toolbar animate-fade">
          <div className="refined-toolbar-left">
            <input 
              type="checkbox" 
              className="table-checkbox"
              checked={isAllPageSelected}
              onChange={() => handleToggleSelectAll(paginatedResources)}
            />
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
              {selectedResources.length} {selectedResources.length === 1 ? 'resource' : 'resources'} selected
            </span>
            <div className="refined-toolbar-actions">
              <button 
                type="button"
                className="refined-toolbar-btn" 
                onClick={() => setDeletingMultipleResources(true)}
                disabled={selectedResources.length === 0}
              >
                <Trash2 size={13} style={{ marginRight: '0.2rem' }} />
                <span>Delete</span>
              </button>
              
              {selectedResources.length <= 1 ? (
                <>
                  <button 
                    type="button"
                    className="refined-toolbar-btn" 
                    onClick={handleEditSelected}
                    disabled={selectedResources.length !== 1}
                  >
                    <Pencil size={13} style={{ marginRight: '0.2rem' }} />
                    <span>Edit</span>
                  </button>
                  {selectedResources.length === 1 && (() => {
                    const selectedId = selectedResources[0];
                    const isHomePinned = homePinnedIds.includes(selectedId);
                    const isSubtopicPinned = activeTopicString ? (subtopicPinnedMap[activeTopicString] || []).includes(selectedId) : false;
                    const isPinnedAnywhere = isHomePinned || isSubtopicPinned;
                    return (
                      <button 
                        type="button"
                        className="refined-toolbar-btn" 
                        onClick={() => {
                          setPinTargetResourceId(selectedId);
                          setIsPinModalOpen(true);
                        }}
                      >
                        <span style={{ marginRight: '0.2rem' }}>{isPinnedAnywhere ? '📍' : '📌'}</span>
                        <span>{isPinnedAnywhere ? 'Unpin' : 'Pin'}</span>
                      </button>
                    );
                  })()}
                </>
              ) : (
                <button 
                  type="button"
                  className="refined-toolbar-btn" 
                  onClick={() => {
                    // Pre-fill target area with current active area
                    setMoveToArea(activeArea || '');
                    setMoveToSubtopic('');
                    setIsMoveModalOpen(true);
                  }}
                >
                  <Folder size={13} style={{ marginRight: '0.2rem' }} />
                  <span>Move</span>
                </button>
              )}
            </div>
          </div>
          {selectedResources.length > 0 && (
            <button 
              type="button" 
              className="refined-toolbar-clear" 
              onClick={() => setSelectedResources([])}
            >
              Clear
            </button>
          )}
        </div>

        {/* Excel-like Resource Table */}
        <section style={{ overflowX: 'auto' }}>
          <table className="refined-table">
            <thead>
              <tr>
                <th style={{ width: '10px', textAlign: 'center', padding: 0 }}>
                  {/* Stripes */}
                </th>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    className="table-checkbox"
                    checked={isAllPageSelected}
                    onChange={() => handleToggleSelectAll(paginatedResources)}
                  />
                </th>
                <th>Name</th>
                <th style={{ width: '120px' }}>Type</th>
                <th style={{ width: '150px' }}>Added</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResources.map((resource) => {
                const isSelected = selectedResources.includes(resource.id);
                const sanitizedFilename = resource.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '_')
                  .substring(0, 18);

                const getRecentFileEmoji = (type: string) => {
                  switch (type) {
                    case 'video': return '▶';
                    case 'photo': return '🖼';
                    case 'doc':
                    case 'book':
                    case 'article':
                    case 'idea':
                      return '📄';
                    case 'website':
                    case 'tool':
                    default:
                      return '🔗';
                  }
                };

                const getFileExtension = (type: string) => {
                  switch (type) {
                    case 'video': return '.mp4';
                    case 'photo': return '.png';
                    case 'doc': return '.doc';
                    case 'book': return '.pdf';
                    case 'tool': return '.exe';
                    case 'idea': return '.txt';
                    case 'article': return '.md';
                    default: return '.url';
                  }
                };

                return (
                  <tr 
                    key={resource.id} 
                    className={`resource-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleSelectRow(resource.id)}
                  >
                    <td style={{ padding: 0, width: '4px' }}>
                      <div className={`recent-file-stripe ${resource.area}`} style={{ height: '42px', margin: '0 auto' }} />
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="table-checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(resource.id)}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className={`recent-file-icon-box ${resource.area}`} style={{ width: '34px', height: '34px', fontSize: '0.95rem' }}>
                          <span>{getRecentFileEmoji(resource.type)}</span>
                        </div>
                        <div className="recent-file-meta">
                          <span className="recent-file-name" style={{ fontSize: '0.85rem' }}>
                            {sanitizedFilename}{getFileExtension(resource.type)}
                            {activeTopicString && (subtopicPinnedMap[activeTopicString] || []).includes(resource.id) && (
                              <span style={{ marginLeft: '0.35rem', fontSize: '0.75rem' }} title="Pinned to this Subtopic">📌</span>
                            )}
                          </span>
                          <span className="recent-file-subtext" style={{ fontSize: '0.7rem' }}>{getDomain(resource.url) || 'local_file'}</span>
                          <span className="recent-file-subtext" style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.05rem' }}>{resource.description || resource.notes || 'No description'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`resource-type-badge ${resource.type}`} style={{ fontSize: '0.6rem' }}>
                        {resource.type}
                      </span>
                    </td>
                    <td>{getRelativeTimeString(resource.created_at)}</td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      {resource.url && (
                        <button 
                          className="recent-file-link-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(resource.url, '_blank');
                          }}
                        >
                          <ExternalLink size={12} color="#1A1A1A" strokeWidth={2} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Neo-brutalist Pagination controls */}
          {totalPages > 1 && (
            <div className="resource-pagination-container">
              <div className="resource-pagination-controls">
                <button 
                  type="button" 
                  className={`pagination-btn ${safeCurrentPage === 1 ? 'disabled' : ''}`}
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPageTopic(safeCurrentPage - 1)}
                >
                  &lt;
                </button>
                {(() => {
                  const pages = [];
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (safeCurrentPage <= 2) {
                      pages.push(1, 2, 3, '...', totalPages);
                    } else if (safeCurrentPage >= totalPages - 1) {
                      pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, '...', safeCurrentPage, '...', totalPages);
                    }
                  }

                  return pages.map((p, idx) => {
                    if (p === '...') {
                      return <span key={`ellipsis-${idx}`} style={{ padding: '0 0.25rem', color: 'var(--text-muted)' }}>...</span>;
                    }
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`pagination-btn ${p === safeCurrentPage ? 'active' : ''}`}
                        onClick={() => setCurrentPageTopic(p as number)}
                      >
                        {p}
                      </button>
                    );
                  });
                })()}
                <button 
                  type="button" 
                  className={`pagination-btn ${safeCurrentPage === totalPages ? 'disabled' : ''}`}
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPageTopic(safeCurrentPage + 1)}
                >
                  &gt;
                </button>
              </div>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-pixel)' }}>
                {rangeStart}–{rangeEnd} of {totalItems}
              </span>
            </div>
          )}
        </section>
      </>
    );
  };

  const renderRefinedFilterControls = () => {
    return (
      <section className="list-filter-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '200px' }}>
          <input
            type="text"
            className="search-input-box"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPageTopic(1);
            }}
            style={{
              width: '100%',
              padding: '0.45rem 2rem 0.45rem 0.75rem',
              border: '1.5px solid #1A1A1A',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontFamily: 'inherit',
              boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.08)'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPageTopic(1);
              }}
              style={{
                position: 'absolute',
                right: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                color: '#94A3B8',
                fontWeight: 'bold',
                zIndex: 2
              }}
            >
              ×
            </button>
          )}
        </div>
        
        <select
          className="filter-select-dropdown"
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value as ResourceType | 'all');
            setCurrentPageTopic(1);
          }}
          title="Filter type"
          style={{
            padding: '0.45rem 1.75rem 0.45rem 0.75rem',
            border: '1.5px solid #1A1A1A',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontFamily: 'inherit',
            backgroundColor: '#FFFFFF',
            color: '#1A1A1A',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Types</option>
          <option value="website">Website</option>
          <option value="video">Video</option>
          <option value="article">Article</option>
          <option value="book">Book</option>
          <option value="tool">Tool</option>
          <option value="photo">Image</option>
          <option value="idea">Idea</option>
          <option value="doc">Document</option>
        </select>

        <select
          className="filter-select-dropdown"
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value as 'newest' | 'oldest' | 'az' | 'za');
            setCurrentPageTopic(1);
          }}
          title="Sort list"
          style={{
            padding: '0.45rem 1.75rem 0.45rem 0.75rem',
            border: '1.5px solid #1A1A1A',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontFamily: 'inherit',
            backgroundColor: '#FFFFFF',
            color: '#1A1A1A',
            cursor: 'pointer'
          }}
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="az">Sort: A-Z</option>
          <option value="za">Sort: Z-A</option>
        </select>
      </section>
    );
  };

  return (
    <>

      <div className="app-layout-wrapper">
      
      {/* 1. LEFT SIDEBAR PANEL */}
      <div className={`window-outer sidebar-window ${activeArea || 'generic'}`}>
        <div className="window-header sidebar-header">
          <div className="window-title">
            <Folder size={16} color="#1A1A1A" strokeWidth={2} />
            <span>navigator.sys</span>
          </div>
        </div>

        <aside className="sidebar-container">
          
          {/* Brand Logo */}
          <div className="sidebar-logo" onClick={handleGoHome} style={{ cursor: 'pointer' }}>
            <span className="sidebar-logo-highlighted">Resource Vault <span style={{ color: '#7C3AED', marginLeft: '0.2rem' }}>✦</span></span>
          </div>

          {/* Home Button */}
          <div className="sidebar-menu-list">
            <div 
              className={`sidebar-item generic ${activeView === 'home' ? 'active' : ''}`}
              onClick={handleGoHome}
            >
              <span className="sidebar-item-icon"><Home size={16} color="#1A1A1A" strokeWidth={2} /></span>
              <span>Home</span>
            </div>
          </div>

          {/* AREAS Section */}
          <div className="sidebar-section-title">Areas</div>
          <div className="sidebar-menu-list">
            {(['career', 'computer', 'ai_tech', 'personal'] as AreaType[]).map(areaKey => (
              <div 
                key={areaKey} 
                className={`sidebar-item ${areaKey} ${activeView === 'area' && activeArea === areaKey ? 'active' : ''}`}
                onClick={() => handleGoToArea(areaKey)}
              >
                <span className="sidebar-item-icon">{getAreaIcon(areaKey)}</span>
                <span>{getAreaNameReadable(areaKey)}</span>
              </div>
            ))}
          </div>

          {/* Brand Box Sticker */}
          <div className="sidebar-brand-box">
            <span style={{ fontSize: '1rem', color: '#7C3AED' }}>✦</span>
            <span style={{ textAlign: 'left' }}>ORGANIZE. SAVE.<br/>GROW. REPEAT.</span>
          </div>

        </aside>
      </div>

      {/* 2. RIGHT MAIN CONTENT WINDOW */}
      <div className="window-outer main-panel-outer">
        <div className="window-header">
          <div className="window-title">
            <span>{getMainWindowTitle()}</span>
          </div>
        </div>

        <main className={`main-panel-container ${
          (activeView === 'area' || activeView === 'topic') && activeArea ? `area-view-bg ${activeArea}` : ''
        } ${
          activeView === 'detail' && selectedResource ? `area-view-bg ${selectedResource.area}` : ''
        }`}>
        
        {/* HOMEPAGE VIEW */}
        {activeView === 'home' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Greeting */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="homepage-welcome-text">
                  <span style={{ marginRight: '0.45rem' }}>✦</span>
                  Good afternoon, Subha
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Welcome back to your curated knowledge base.</p>
              </div>
              <button className="btn-detail-open btn-action-yellow" onClick={handleOpenAddForm}>
                <Plus size={14} color="#1A1A1A" strokeWidth={2} />
                <span>Add Resource</span>
              </button>
            </div>

            {/* Search Bar section */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '-0.75rem', gap: '0.5rem', width: '100%', maxWidth: '320px' }}>
              <div style={{ position: 'relative', flexGrow: 1 }}>
                <Input
                  type="text"
                  placeholder="SEARCH"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', paddingRight: searchQuery ? '2rem' : '0.5rem', backgroundColor: '#FFFFFF' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.15rem',
                      color: '#94A3B8',
                      fontWeight: 'bold',
                      zIndex: 10
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              <button 
                type="button" 
                className="btn-ui btn-ui-secondary" 
                title="Search"
                style={{ padding: '0.45rem 0.65rem' }}
              >
                🔍
              </button>
            </div>

            {/* YOUR LIBRARY grid tiles */}
            <section>
              <h2 className="homepage-sub-header">Your Library</h2>
              <div className="areas-tiles-grid">
                {(['career', 'computer', 'ai_tech', 'personal'] as AreaType[]).map(areaKey => (
                  <div 
                    key={areaKey} 
                    className={`compact-nav-tile ${areaKey}`}
                    onClick={() => handleGoToArea(areaKey)}
                  >
                    <div className="compact-nav-tile-header">
                      {getAreaIcon(areaKey)}
                      <span>{getAreaNameReadable(areaKey)}</span>
                    </div>
                    <div className="compact-nav-tile-divider" />
                    <span className="compact-nav-tile-count">
                      {getAreaCount(areaKey)}
                      <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--text-muted)', marginLeft: '0.2rem', letterSpacing: '0.05em' }}>
                        {getAreaCount(areaKey) === 1 ? 'RESOURCE' : 'RESOURCES'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <div className="detail-divider" />

            {/* RECENTLY ADDED / SEARCH RESULTS grid list */}
            <section>
              {searchQuery.trim() === '' ? (
                <>
                  {/* PINNED Section */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h2 className="homepage-sub-header" style={{ margin: 0 }}>PINNED</h2>
                  </div>
                  {homePinnedResources.length > 0 ? (
                    <div className="recent-files-list" style={{ marginBottom: '1.5rem' }}>
                      {homePinnedResources.map((resource) => {
                        const sanitizedFilename = resource.title
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '_')
                          .substring(0, 18);

                        const getRecentFileEmoji = (type: string) => {
                          switch (type) {
                            case 'video': return '▶';
                            case 'photo': return '🖼';
                            case 'doc':
                            case 'book':
                            case 'article':
                            case 'idea':
                              return '📄';
                            case 'website':
                            case 'tool':
                            default:
                              return '🔗';
                          }
                        };

                        const getFileExtension = (type: string) => {
                          switch (type) {
                            case 'video': return '.mp4';
                            case 'photo': return '.png';
                            case 'doc': return '.doc';
                            case 'book': return '.pdf';
                            case 'tool': return '.exe';
                            case 'idea': return '.txt';
                            case 'article': return '.md';
                            default: return '.url';
                          }
                        };

                        return (
                          <div 
                            key={`pinned-home-${resource.id}`} 
                            className="recent-file-row animate-fade"
                            onClick={() => handleGoToTopic(resource.topic, resource.area)}
                          >
                            <div className={`recent-file-stripe ${resource.area}`} />
                            <div className={`recent-file-icon-box ${resource.area}`}>
                              <span>{getRecentFileEmoji(resource.type)}</span>
                            </div>
                            <div className="recent-file-meta">
                              <span className="recent-file-name">{sanitizedFilename}{getFileExtension(resource.type)}</span>
                              <span className="recent-file-subtext">{getDomain(resource.url) || 'local_file'}</span>
                            </div>
                            <span className={`recent-file-topic-pill ${resource.area}`}>
                              {resource.topic}
                            </span>
                            <span className="recent-file-time">
                              {getRelativeTimeString(resource.created_at)}
                            </span>
                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                              <button 
                                className="recent-file-link-btn"
                                title="Unpin from Home"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHomePinnedIds(prev => prev.filter(id => id !== resource.id));
                                }}
                                style={{ backgroundColor: '#FEE2E2' }}
                              >
                                <span style={{ fontSize: '0.8rem' }}>📍</span>
                              </button>
                              {resource.url && (
                                <button 
                                  className="recent-file-link-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(resource.url, '_blank');
                                  }}
                                >
                                  <ExternalLink size={12} color="#1A1A1A" strokeWidth={2} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="quiet-empty-state" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '2px dashed #1A1A1A', borderRadius: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No pinned resources yet.</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h2 className="homepage-sub-header" style={{ margin: 0 }}>Recently Added</h2>
                    <button 
                      type="button" 
                      className="detail-back-link" 
                      onClick={() => setActiveView('all')}
                      style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <span>View all →</span>
                    </button>
                  </div>
                  {homepageRecentlyAdded.length > 0 ? (
                    <div className="recent-files-list">
                      {homepageRecentlyAdded.map((resource) => {
                        const sanitizedFilename = resource.title
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '_')
                          .substring(0, 18);

                        const getRecentFileEmoji = (type: string) => {
                          switch (type) {
                            case 'video': return '▶';
                            case 'photo': return '🖼';
                            case 'doc':
                            case 'book':
                            case 'article':
                            case 'idea':
                              return '📄';
                            case 'website':
                            case 'tool':
                            default:
                              return '🔗';
                          }
                        };

                        const getFileExtension = (type: string) => {
                          switch (type) {
                            case 'video': return '.mp4';
                            case 'photo': return '.png';
                            case 'doc': return '.doc';
                            case 'book': return '.pdf';
                            case 'tool': return '.exe';
                            case 'idea': return '.txt';
                            case 'article': return '.md';
                            default: return '.url';
                          }
                        };

                        return (
                          <div 
                            key={resource.id} 
                            className="recent-file-row animate-fade"
                            onClick={() => handleGoToTopic(resource.topic, resource.area)}
                          >
                            {/* 1. Left border area color stripe */}
                            <div className={`recent-file-stripe ${resource.area}`} />

                            {/* 2. Type Icon box */}
                            <div className={`recent-file-icon-box ${resource.area}`}>
                              <span>{getRecentFileEmoji(resource.type)}</span>
                            </div>

                            {/* 3. Resource Name & Domain subtext */}
                            <div className="recent-file-meta">
                              <span className="recent-file-name">{sanitizedFilename}{getFileExtension(resource.type)}</span>
                              <span className="recent-file-subtext">{getDomain(resource.url) || 'local_file'}</span>
                            </div>

                            {/* 4. Topic Pill */}
                            <span className={`recent-file-topic-pill ${resource.area}`}>
                              {resource.topic}
                            </span>

                            {/* 5. Timestamp */}
                            <span className="recent-file-time">
                              {getRelativeTimeString(resource.created_at)}
                            </span>

                            {/* 6. View Button */}
                            {resource.url && (
                              <button 
                                className="recent-file-link-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(resource.url, '_blank');
                                }}
                              >
                                <ExternalLink size={12} color="#1A1A1A" strokeWidth={2} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="quiet-empty-state">
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🐱💤</div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>No documents saved yet</h3>
                      <p className="empty-state-subtitle">Use the "+ Add Resource" button to get started.</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="homepage-sub-header">Search Results for "{searchQuery}"</h2>
                  {renderRefinedResourceTable(searchResultsResources)}
                </>
              )}
            </section>

          </div>
        )}

        {/* ALL RESOURCES / RECENTLY ADDED LIST VIEW */}
        {(activeView === 'all' || activeView === 'recent') && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Header */}
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {activeView === 'all' ? 'All Resources' : 'Recently Added'}
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {finalListResources.length} total resources saved in the vault.
              </p>
            </div>

            {renderRefinedFilterControls()}

            {renderRefinedResourceTable(finalListResources)}

          </div>
        )}

        {/* AREA DETAIL LIST VIEW */}
        {activeView === 'area' && activeArea && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Breadcrumb Back Link */}
            <button className="detail-back-link" onClick={handleGoHome} style={{ marginBottom: '0.5rem' }}>
              <ArrowLeft size={14} color="#1A1A1A" strokeWidth={2} style={{ marginRight: '0.2rem' }} />
              <span>Resource Vault</span>
            </button>

            {/* Title / Description */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center' }}>{getAreaIcon(activeArea)}</span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                  {getAreaNameReadable(activeArea)}
                </h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {resources.filter(res => res.area === activeArea).length} files
                </span>
                <button className="btn-detail-open btn-action-yellow" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }} onClick={handleOpenAddForm}>
                  <Plus size={12} color="#1A1A1A" strokeWidth={2} />
                  <span>Add Resource</span>
                </button>
              </div>
            </div>

            <div className="detail-divider" />

            {/* Subtopics folder grid view */}
            <section style={{ marginTop: '0.5rem' }}>
              <h2 className="homepage-sub-header">Subtopics</h2>
              {(() => {
                const areaTopics = getUniqueTopicsListForArea(activeArea);
                return areaTopics.length > 0 ? (
                  <div className="subtopics-tiles-grid animate-fade">
                    {areaTopics.map(topicName => {
                      const count = resources.filter(res => res.area === activeArea && res.topic === topicName).length;
                      return (
                        <div 
                          key={topicName} 
                          className={`subtopic-card ${activeArea}`}
                          onClick={() => handleGoToTopic(topicName, activeArea)}
                        >
                          <div className="subtopic-card-folder-icon">
                            <Folder size={20} color="#1A1A1A" strokeWidth={2} />
                          </div>
                          <div className="subtopic-card-info">
                            <span className="subtopic-card-name">{topicName}</span>
                            <span className="subtopic-card-count">{count} {count === 1 ? 'file' : 'files'}</span>
                          </div>
                          <ChevronRight size={16} color="#1A1A1A" strokeWidth={2} style={{ marginLeft: 'auto' }} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="quiet-empty-state">
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📁💤</div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>No subtopics yet</h3>
                    <p className="empty-state-subtitle">Add resources to get started in this Area.</p>
                  </div>
                );
              })()}
            </section>

          </div>
        )}

        {/* TOPIC DETAIL LIST VIEW */}
        {activeView === 'topic' && activeTopicString && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Breadcrumb Back Link to Area */}
            <div>
              <button 
                className="detail-back-link" 
                onClick={() => handleGoToArea(activeArea || 'career')} 
                style={{ marginBottom: '0.5rem' }}
              >
                <ArrowLeft size={14} color="#1A1A1A" strokeWidth={2} style={{ marginRight: '0.2rem' }} />
                <span>{getAreaNameReadable(activeArea)}</span>
              </button>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                    {activeTopicString}
                  </h1>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {finalListResources.length} resources
                  </span>
                </div>
                <button className="btn-detail-open btn-action-yellow" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }} onClick={handleOpenAddForm}>
                  <Plus size={12} color="#1A1A1A" strokeWidth={2} />
                  <span>Add Resource</span>
                </button>
              </div>
            </div>

            <div className="detail-divider" style={{ margin: '0' }} />

            {renderRefinedFilterControls()}

            {renderRefinedResourceTable(finalListResources)}

          </div>
        )}

        {/* GLOBAL SEARCH RESULTS VIEW */}
        {activeView === 'search' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Header back & title */}
            <div>
              <button className="detail-back-link" onClick={handleReturnFromSearch} style={{ marginBottom: '0.5rem' }}>
                <ArrowLeft size={14} color="#1A1A1A" strokeWidth={2} style={{ marginRight: '0.2rem' }} />
                <span>Return to previous view</span>
              </button>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                Search Results
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Found {searchResultsResources.length} matches for "{searchQuery}" in your vault.
              </p>
            </div>

            {renderRefinedFilterControls()}

            {renderRefinedResourceTable(searchResultsResources)}

          </div>
        )}



      </main>
      </div>

      {/* Add / Edit Form Modal */}
      <ResourceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveResource}
        onDelete={(id) => handleDeleteResource(id)}
        editingResource={editingResource}
        existingResources={resources}
      />

      {/* Custom Delete Confirmation Modal */}
      {deletingResourceId && (
        <div className="modal-overlay-bg">
          <div className="modal-sheet" style={{ maxWidth: '360px' }}>
            <div className="modal-sheet-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF', padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
              <h3 className="modal-sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--border-color)', margin: 0, fontSize: '1.15rem' }}>
                <AlertCircle size={18} color="#1A1A1A" strokeWidth={2} />
                Delete Resource?
              </h3>
              <button 
                type="button"
                onClick={() => setDeletingResourceId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} color="#1A1A1A" strokeWidth={2} />
              </button>
            </div>
            
            <div style={{ padding: '0 1.5rem 1.25rem 1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Are you sure you want to delete this resource? This cannot be undone.
              </p>
            </div>
            
            <div className="modal-sheet-footer" style={{ borderTop: 'none', backgroundColor: 'transparent', padding: '0 1.5rem 1.5rem 1.5rem' }}>
              <button 
                className="btn-ui btn-ui-secondary" 
                onClick={() => setDeletingResourceId(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-ui btn-ui-danger" 
                onClick={() => handleDeleteResource(deletingResourceId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Item Delete Confirmation Modal */}
      {deletingMultipleResources && (
        <div className="modal-overlay-bg animate-fade">
          <div className="modal-sheet" style={{ maxWidth: '360px' }}>
            <div className="modal-sheet-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF', padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
              <h3 className="modal-sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--border-color)', margin: 0, fontSize: '1.15rem' }}>
                <AlertCircle size={18} color="#1A1A1A" strokeWidth={2} />
                Delete {selectedResources.length} resources?
              </h3>
              <button 
                type="button"
                onClick={() => setDeletingMultipleResources(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} color="#1A1A1A" strokeWidth={2} />
              </button>
            </div>
            
            <div style={{ padding: '0 1.5rem 1.25rem 1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                This action cannot be undone.
              </p>
            </div>
            
            <div className="modal-sheet-footer" style={{ borderTop: 'none', backgroundColor: 'transparent', padding: '0 1.5rem 1.5rem 1.5rem' }}>
              <button 
                className="btn-ui btn-ui-secondary" 
                onClick={() => setDeletingMultipleResources(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-ui btn-ui-danger" 
                onClick={handleConfirmDeleteMultiple}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Move Resources Modal */}
      {isMoveModalOpen && (
        <div className="modal-overlay-bg animate-fade">
          <div className="modal-sheet" style={{ maxWidth: '380px' }}>
            <div className="modal-sheet-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF', padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
              <h3 className="modal-sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--border-color)', margin: 0, fontSize: '1.15rem' }}>
                <Folder size={18} color="#1A1A1A" strokeWidth={2} />
                Move {selectedResources.length} resources
              </h3>
              <button 
                type="button"
                onClick={() => setIsMoveModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} color="#1A1A1A" strokeWidth={2} />
              </button>
            </div>
            
            <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1A1A1A' }}>
                  Target Area
                </label>
                <select
                  value={moveToArea}
                  onChange={(e) => setMoveToArea(e.target.value as AreaType)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem',
                    border: '2px solid #1A1A1A',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontFamily: 'inherit',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="" disabled>Select Area</option>
                  <option value="career">Career</option>
                  <option value="computer">Computer</option>
                  <option value="ai_tech">AI & Tech</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1A1A1A' }}>
                  Subtopic Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Subtopic name (e.g. Backend Deployment)"
                  value={moveToSubtopic}
                  onChange={(e) => setMoveToSubtopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem',
                    border: '2px solid #1A1A1A',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontFamily: 'inherit',
                    boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.08)'
                  }}
                />
              </div>
            </div>
            
            <div className="modal-sheet-footer" style={{ borderTop: 'none', backgroundColor: 'transparent', padding: '0 1.5rem 1.5rem 1.5rem' }}>
              <button 
                className="btn-ui btn-ui-secondary" 
                onClick={() => setIsMoveModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn-ui btn-ui-primary" 
                onClick={handleConfirmMoveSelected}
                disabled={!moveToArea || !moveToSubtopic.trim()}
                style={{
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  border: '2px solid #1A1A1A',
                  boxShadow: '2px 2px 0px #1A1A1A'
                }}
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pin / Unpin Destination Modal */}
      {isPinModalOpen && pinTargetResourceId && (() => {
        const targetResource = resources.find(r => r.id === pinTargetResourceId);
        if (!targetResource) return null;

        const isHomePinned = homePinnedIds.includes(pinTargetResourceId);
        const subtopicKey = targetResource.topic;
        const currentSubtopicPinned = subtopicPinnedMap[subtopicKey] || [];
        const isSubtopicPinned = currentSubtopicPinned.includes(pinTargetResourceId);

        const handleToggleHomePin = () => {
          if (isHomePinned) {
            setHomePinnedIds(prev => prev.filter(id => id !== pinTargetResourceId));
          } else {
            if (homePinnedIds.length >= 5) {
              alert("You can pin up to 5 resources. Unpin an existing resource first.");
              return;
            }
            setHomePinnedIds(prev => [...prev, pinTargetResourceId]);
          }
        };

        const handleToggleSubtopicPin = () => {
          if (isSubtopicPinned) {
            setSubtopicPinnedMap(prev => ({
              ...prev,
              [subtopicKey]: (prev[subtopicKey] || []).filter(id => id !== pinTargetResourceId)
            }));
          } else {
            if (currentSubtopicPinned.length >= 3) {
              alert(`You can pin up to 3 resources in this subtopic. Unpin an existing resource first.`);
              return;
            }
            setSubtopicPinnedMap(prev => ({
              ...prev,
              [subtopicKey]: [...(prev[subtopicKey] || []), pinTargetResourceId]
            }));
          }
        };

        return (
          <div className="modal-overlay-bg animate-fade">
            <div className="modal-sheet" style={{ maxWidth: '340px' }}>
              <div className="modal-sheet-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF', padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
                <h3 className="modal-sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--border-color)', margin: 0, fontSize: '1.15rem' }}>
                  <span>📌 Pin Resource</span>
                </h3>
                <button 
                  type="button"
                  onClick={() => {
                    setIsPinModalOpen(false);
                    setPinTargetResourceId(null);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={20} color="#1A1A1A" strokeWidth={2} />
                </button>
              </div>

              <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Where do you want to pin this resource?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      className="table-checkbox"
                      checked={isHomePinned}
                      onChange={handleToggleHomePin}
                    />
                    <span>Home (Pinned Section)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      className="table-checkbox"
                      checked={isSubtopicPinned}
                      onChange={handleToggleSubtopicPin}
                    />
                    <span>This Subtopic ({subtopicKey})</span>
                  </label>
                </div>
              </div>

              <div className="modal-sheet-footer" style={{ borderTop: 'none', backgroundColor: 'transparent', padding: '0 1.5rem 1.5rem 1.5rem' }}>
                <button 
                  className="btn-ui btn-ui-primary" 
                  onClick={() => {
                    setIsPinModalOpen(false);
                    setPinTargetResourceId(null);
                    setSelectedResources([]);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#7C3AED',
                    color: '#FFFFFF',
                    border: '2px solid #1A1A1A',
                    boxShadow: '2px 2px 0px #1A1A1A'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
    </>
  );
}

export default App;
