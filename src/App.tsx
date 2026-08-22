import { useState, useEffect } from 'react';
import {
  PixelHome,
  PixelStar,
  PixelHeart,
  PixelBriefcase,
  PixelLaptop,
  PixelAlert,
  PixelFolder,
  PixelPlus,
  PixelClose,
  PixelArrow,
  PixelLink
} from './components/PixelIcons';
import { ResourceForm } from './components/ResourceForm';
import { ResourceCard } from './components/ResourceCard';
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
  
  // Previous view tracking (for Back breadcrumb on details page)
  const [previousView, setPreviousView] = useState<ViewType>('home');
  const [previousArea, setPreviousArea] = useState<AreaType | null>(null);
  const [previousTopicString, setPreviousTopicString] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'recent' | 'az'>('recent');

  // Search Page specific filters
  const [searchAreaFilter, setSearchAreaFilter] = useState<AreaType | 'all'>('all');
  const [searchTypeFilter, setSearchTypeFilter] = useState<ResourceType | 'all'>('all');
  const [searchTopicFilter, setSearchTopicFilter] = useState<string | 'all'>('all');

  // Modal Control States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  // Startup and Save Overlay States
  const [isStartupLoading, setIsStartupLoading] = useState(true);
  const [showSavePopup, setShowSavePopup] = useState(false);

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
      setIsStartupLoading(false);
    };

    // Startup loading sequence delay (1.2 seconds)
    const timer = setTimeout(() => {
      loadResources();
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // 2. Global search handler (Real-time in-place search on Home view)
  const handleGlobalSearchChange = (val: string) => {
    setSearchQuery(val);
  };

  const handleReturnFromSearch = () => {
    setActiveView(previousView);
    setActiveArea(previousArea);
    setActiveTopicString(previousTopicString);
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

    // Show self-dismissing Save popup overlay for 3 seconds
    setShowSavePopup(true);
    const saveTimer = setTimeout(() => {
      setShowSavePopup(false);
    }, 3000);
    return () => clearTimeout(saveTimer);
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
      handleGoBackFromDetail();
    }
  };

  const handleOpenAddForm = () => {
    setEditingResource(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (resource: Resource) => {
    setEditingResource(resource);
    setIsFormOpen(true);
  };

  // View switch triggers
  const handleGoHome = () => {
    setActiveView('home');
    setActiveArea(null);
    setActiveTopicString(null);
    setSelectedResource(null);
    setSearchQuery('');
  };



  const handleGoToArea = (area: AreaType) => {
    setActiveArea(area);
    setActiveTopicString(null);
    setSelectedResource(null);
    setSelectedType('all');
    setSelectedTag(null);
    setSearchQuery('');
    setActiveView('area');
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
    setSelectedTag(null);
    setSearchQuery('');
    setActiveView('topic');
  };

  const handleOpenResourceDetail = (resource: Resource) => {
    // Save breadcrumb state
    setPreviousView(activeView);
    setPreviousArea(activeArea);
    setPreviousTopicString(activeTopicString);
    
    setSelectedResource(resource);
    setActiveView('detail');
  };

  const handleGoBackFromDetail = () => {
    setActiveView(previousView);
    setActiveArea(previousArea);
    setActiveTopicString(previousTopicString);
    setSelectedResource(null);
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

  // Apply search query, format type filter inside standard view lists
  const getContextFilteredResources = () => {
    return baseResources.filter(res => {
      // 1. Media Type Filter
      if (selectedType !== 'all' && res.type !== selectedType) return false;

      // 2. Search filter query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = res.title.toLowerCase().includes(q);
        const matchesNotes = res.notes ? res.notes.toLowerCase().includes(q) : false;
        const matchesTags = res.tags.some(t => t.toLowerCase().includes(q));
        const matchesTopic = res.topic.toLowerCase().includes(q);
        return matchesTitle || matchesNotes || matchesTags || matchesTopic;
      }

      return true;
    });
  };

  const contextFiltered = getContextFilteredResources();

  // Collect unique tag pills dynamically within the filtered subset
  const availableTags = Array.from(
    new Set(contextFiltered.flatMap(res => res.tags))
  ).sort((a, b) => a.localeCompare(b));

  // Reset tag if it falls out of active list context
  useEffect(() => {
    if (selectedTag && !availableTags.includes(selectedTag)) {
      setSelectedTag(null);
    }
  }, [activeView, activeArea, activeTopicString, selectedType, searchQuery, resources]);

  // Apply Tag pills filter & Sort Order
  const getFinalList = () => {
    let list = contextFiltered;
    if (selectedTag) {
      list = list.filter(res => res.tags.includes(selectedTag));
    }
    
    // Sort
    if (sortOrder === 'recent' || activeView === 'recent') {
      return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
  };

  const finalListResources = getFinalList();

  // ----------------------------------------------------
  // Search View Page: Complex matching list filters
  // ----------------------------------------------------
  const getSearchResultsList = () => {
    return resources.filter(res => {
      // Scoped search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = res.title.toLowerCase().includes(q);
        const matchesNotes = res.notes ? res.notes.toLowerCase().includes(q) : false;
        const matchesTags = res.tags.some(t => t.toLowerCase().includes(q));
        const matchesTopic = res.topic.toLowerCase().includes(q);
        if (!(matchesTitle || matchesNotes || matchesTags || matchesTopic)) return false;
      }

      // Sidebar filters
      if (searchAreaFilter !== 'all' && res.area !== searchAreaFilter) return false;
      if (searchTypeFilter !== 'all' && res.type !== searchTypeFilter) return false;
      if (searchTopicFilter !== 'all' && res.topic !== searchTopicFilter) return false;

      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const searchResultsResources = getSearchResultsList();

  // Search Results pill selection arrays
  const searchAvailableTopics = Array.from(new Set(resources.map(res => res.topic))).sort((a, b) => a.localeCompare(b));

  // 5 newest added items for homepage
  const homepageRecentlyAdded = [...resources]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Topic metrics counters (e.g. Docs: 4, Videos: 7)
  const getTopicMetrics = () => {
    const list = resources.filter(res => res.topic === activeTopicString);
    const metrics: { [key in ResourceType]?: number } = {};
    list.forEach(res => {
      metrics[res.type] = (metrics[res.type] || 0) + 1;
    });
    return Object.keys(metrics).map(typeKey => ({
      type: typeKey as ResourceType,
      count: metrics[typeKey as ResourceType] || 0
    })).sort((a, b) => b.count - a.count);
  };

  // Toggle Filters
  const handleTagPillClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  // Sidebar Icons
  const getAreaIcon = (area: AreaType) => {
    switch (area) {
      case 'career':
        return <PixelBriefcase size={16} />;
      case 'computer':
        return <PixelLaptop size={16} />;
      case 'ai_tech':
        return <PixelStar size={16} />;
      case 'personal':
        return <PixelHeart size={16} />;
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

  return (
    <>
      {/* Startup loading sequence screen */}
      {isStartupLoading && (
        <div className="startup-loader-overlay">
          <img src="/loading.png" alt="respawning..." className="startup-loader-img" />
          <div className="startup-loader-progress-container">
            <div className="startup-loader-progress-bar"></div>
          </div>
        </div>
      )}

      {/* Save Game Overlay popup */}
      {showSavePopup && (
        <div className="save-popup-overlay">
          <div className="save-popup-card">
            <img src="/save_game.png" alt="Save Game" className="save-popup-img" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>SAVE GAME COMPLETE</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.85, margin: 0 }}>don't worry, you've got this.</p>
          </div>
        </div>
      )}

      <div className="app-layout-wrapper">
      
      {/* 1. LEFT SIDEBAR PANEL */}
      <div className="window-outer sidebar-window">
        <div className="window-header sidebar-header">
          <div className="window-title">
            <PixelFolder size={16} />
            <span>navigator.sys</span>
          </div>
          <div className="window-controls">
            <span className="window-dot min"></span>
            <span className="window-dot max"></span>
            <span className="window-dot close"></span>
          </div>
        </div>

        <aside className="sidebar-container">
          
          {/* Brand Logo */}
          <div className="sidebar-logo" onClick={handleGoHome} style={{ cursor: 'pointer' }}>
            <span className="sidebar-logo-highlighted">Resource Vault</span>
          </div>

          {/* Home Button */}
          <div className="sidebar-menu-list">
            <div 
              className={`sidebar-item generic ${activeView === 'home' ? 'active' : ''}`}
              onClick={handleGoHome}
            >
              <span className="sidebar-item-icon"><PixelHome size={16} /></span>
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

        </aside>
      </div>

      {/* 2. RIGHT MAIN CONTENT WINDOW */}
      <div className="window-outer main-panel-outer">
        <div className="window-header">
          <div className="window-title">
            <span>{getMainWindowTitle()}</span>
          </div>
          <div className="window-controls">
            <span className="window-dot min"></span>
            <span className="window-dot max"></span>
            <span className="window-dot close"></span>
          </div>
        </div>

        <main className="main-panel-container">
          {!isSupabaseConfigured && (
            <div style={{
              backgroundColor: '#fef3c7',
              border: '3px solid #d97706',
              borderRadius: '4px',
              padding: '0.65rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              color: '#92400e',
              boxShadow: '3px 3px 0px #d97706'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>⚠️</span>
                <span>
                  <strong>Running in Local PERSISTENCE Mode:</strong> Supabase environment variables are missing. Configure <code>.env.local</code> to connect your live Supabase database.
                </span>
              </div>
              <a 
                href="https://supabase.com" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  border: '2px solid #92400e',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '2px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  boxShadow: '1px 1px 0px #92400e'
                }}
              >
                Setup Supabase
              </a>
            </div>
          )}
        
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
              <button className="btn-detail-open" onClick={handleOpenAddForm}>
                <PixelPlus size={14} />
                <span>Add Resource</span>
              </button>
            </div>

            {/* Search Bar section */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '-0.75rem' }}>
              <div className="scoped-list-search-wrapper">
                <div className="scoped-list-search-input-container">
                  <input
                    type="text"
                    placeholder="SEARCH"
                    className="scoped-list-search-input"
                    value={searchQuery}
                    onChange={(e) => handleGlobalSearchChange(e.target.value)}
                  />
                </div>
                <button type="button" className="scoped-list-search-btn" title="Search">
                  🔍
                </button>
              </div>
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
                    <span className="compact-nav-tile-count">
                      {getAreaCount(areaKey)}
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
                  <h2 className="homepage-sub-header">Recently Added</h2>
                  {homepageRecentlyAdded.length > 0 ? (
                    <div className="resources-file-grid">
                      {homepageRecentlyAdded.map(resource => (
                        <ResourceCard
                          key={resource.id}
                          resource={resource}
                          onEdit={handleOpenEditForm}
                          onDelete={(id) => setDeletingResourceId(id)}
                          onSelect={handleOpenResourceDetail}
                          onTopicClick={handleGoToTopic}
                        />
                      ))}
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
                  {searchResultsResources.length > 0 ? (
                    <div className="resources-file-grid">
                      {searchResultsResources.map(resource => (
                        <ResourceCard
                          key={resource.id}
                          resource={resource}
                          onEdit={handleOpenEditForm}
                          onDelete={(id) => setDeletingResourceId(id)}
                          onSelect={handleOpenResourceDetail}
                          onTopicClick={handleGoToTopic}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="quiet-empty-state" style={{ padding: '2rem 1rem' }}>
                      <div className="retro-dialog-outer">
                        <div className="retro-dialog-box">
                          <div className="retro-dialog-titlebar">
                            <span className="retro-dialog-floppy">💾</span>
                            <button type="button" className="retro-dialog-close-btn" onClick={() => setSearchQuery('')}>×</button>
                          </div>
                          <div className="retro-dialog-body">
                            <div className="retro-dialog-text">File Not Found</div>
                            <div className="retro-dialog-emoticon">(╯°□°)╯︵ ┻━┻</div>
                            <button type="button" className="retro-dialog-ok-btn" onClick={() => setSearchQuery('')}>OK</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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

            {/* Filter toolbar */}
            <section className="list-filter-row">
              <div className="filter-left-group">
                
                
                <select
                  className="filter-select-dropdown"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ResourceType | 'all')}
                  title="Filter type"
                >
                  <option value="all">All Types</option>
                  <option value="website">Websites</option>
                  <option value="video">Videos</option>
                  <option value="article">Articles</option>
                  <option value="book">Books</option>
                  <option value="tool">Tools</option>
                  <option value="photo">Photos</option>
                  <option value="idea">Ideas</option>
                  <option value="doc">Docs</option>
                </select>

                {activeView === 'all' && (
                  <select
                    className="filter-select-dropdown"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'recent' | 'az')}
                    title="Sort list"
                  >
                    <option value="recent">Sort: Recent</option>
                    <option value="az">Sort: A-Z</option>
                  </select>
                )}
              </div>
            </section>

            {/* Tag Pills */}
            {availableTags.length > 0 && (
              <div className="list-tag-pills-bar">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-pill-item ${selectedTag === tag ? 'active' : ''}`}
                    onClick={() => handleTagPillClick(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Data grid */}
            <section style={{ marginTop: '0.25rem' }}>
              {finalListResources.length > 0 ? (
                <div className="resources-file-grid">
                  {finalListResources.map(resource => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      onEdit={handleOpenEditForm}
                      onDelete={(id) => setDeletingResourceId(id)}
                      onSelect={handleOpenResourceDetail}
                      onTopicClick={handleGoToTopic}
                    />
                  ))}
                </div>
              ) : (
                <div className="quiet-empty-state" style={{ padding: '2rem 1rem' }}>
                  <div className="retro-dialog-outer">
                    <div className="retro-dialog-box">
                      <div className="retro-dialog-titlebar">
                        <span className="retro-dialog-floppy">💾</span>
                        <button type="button" className="retro-dialog-close-btn" onClick={() => { setSearchQuery(''); handleGoHome(); }}>×</button>
                      </div>
                      <div className="retro-dialog-body">
                        <div className="retro-dialog-text">File Not Found</div>
                        <div className="retro-dialog-emoticon">(╯°□°)╯︵ ┻━┻</div>
                        <button type="button" className="retro-dialog-ok-btn" onClick={() => { setSearchQuery(''); handleGoHome(); }}>OK</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

          </div>
        )}

        {/* AREA DETAIL LIST VIEW */}
        {activeView === 'area' && activeArea && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Breadcrumb Back Link */}
            <button className="detail-back-link" onClick={handleGoHome} style={{ marginBottom: '0.5rem' }}>
              <PixelArrow size={14} style={{ marginRight: '0.2rem' }} />
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
                <button className="btn-detail-open" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }} onClick={handleOpenAddForm}>
                  <PixelPlus size={12} />
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
                            <PixelFolder size={20} />
                          </div>
                          <div className="subtopic-card-info">
                            <span className="subtopic-card-name">{topicName}</span>
                            <span className="subtopic-card-count">{count} {count === 1 ? 'file' : 'files'}</span>
                          </div>
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
                <PixelArrow size={14} style={{ marginRight: '0.2rem' }} />
                <span>{getAreaNameReadable(activeArea)}</span>
              </button>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  {activeTopicString}
                </h1>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {finalListResources.length} resources
                </span>
              </div>
            </div>

            {/* Metrics cards row: Counts by format type */}
            <section className="topic-metrics-row">
              {getTopicMetrics().map(metric => (
                <div key={metric.type} className="topic-metric-box">
                  <span style={{ textTransform: 'capitalize' }}>{metric.type}s</span>
                  <span className="topic-metric-count">{metric.count}</span>
                </div>
              ))}
            </section>

            {/* Data grid */}
            <section style={{ marginTop: '0.25rem' }}>
              {finalListResources.length > 0 ? (
                <div className="resources-file-grid">
                  {finalListResources.map(resource => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      onEdit={handleOpenEditForm}
                      onDelete={(id) => setDeletingResourceId(id)}
                      onSelect={handleOpenResourceDetail}
                      onTopicClick={handleGoToTopic}
                    />
                  ))}
                </div>
              ) : (
                <div className="quiet-empty-state" style={{ padding: '2rem 1rem' }}>
                  <div className="retro-dialog-outer">
                    <div className="retro-dialog-box">
                      <div className="retro-dialog-titlebar">
                        <span className="retro-dialog-floppy">💾</span>
                        <button type="button" className="retro-dialog-close-btn" onClick={() => { setSearchQuery(''); handleGoHome(); }}>×</button>
                      </div>
                      <div className="retro-dialog-body">
                        <div className="retro-dialog-text">File Not Found</div>
                        <div className="retro-dialog-emoticon">(╯°□°)╯︵ ┻━┻</div>
                        <button type="button" className="retro-dialog-ok-btn" onClick={() => { setSearchQuery(''); handleGoHome(); }}>OK</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

          </div>
        )}

        {/* GLOBAL SEARCH RESULTS VIEW */}
        {activeView === 'search' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Header back & title */}
            <div>
              <button className="detail-back-link" onClick={handleReturnFromSearch} style={{ marginBottom: '0.5rem' }}>
                <PixelArrow size={14} style={{ marginRight: '0.2rem' }} />
                <span>Return to previous view</span>
              </button>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                Search Results
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Found {searchResultsResources.length} matches for "{searchQuery}" in your vault.
              </p>
            </div>

            {/* Scoped pill selection blocks for Search page */}
            <section className="search-filter-pills-block">
              {/* Areas selector */}
              <div className="search-filter-pill-line">
                <span className="search-filter-pill-label">Areas</span>
                <button 
                  className={`tag-pill-item ${searchAreaFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSearchAreaFilter('all')}
                >
                  All
                </button>
                {(['career', 'personal', 'lifestyle', 'interests'] as AreaType[]).map(ar => (
                  <button 
                    key={ar}
                    className={`tag-pill-item ${searchAreaFilter === ar ? 'active' : ''}`}
                    onClick={() => setSearchAreaFilter(ar)}
                  >
                    {getAreaNameReadable(ar)}
                  </button>
                ))}
              </div>

              {/* Types selector */}
              <div className="search-filter-pill-line" style={{ marginTop: '0.25rem' }}>
                <span className="search-filter-pill-label">Types</span>
                <button 
                  className={`tag-pill-item ${searchTypeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSearchTypeFilter('all')}
                >
                  All
                </button>
                {(['website', 'video', 'article', 'book', 'tool', 'photo', 'idea', 'doc'] as ResourceType[]).map(ty => (
                  <button 
                    key={ty}
                    className={`tag-pill-item ${searchTypeFilter === ty ? 'active' : ''}`}
                    onClick={() => setSearchTypeFilter(ty)}
                  >
                    {ty}
                  </button>
                ))}
              </div>

              {/* Topics selector */}
              {searchAvailableTopics.length > 0 && (
                <div className="search-filter-pill-line" style={{ marginTop: '0.25rem' }}>
                  <span className="search-filter-pill-label">Topics</span>
                  <button 
                    className={`tag-pill-item ${searchTopicFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setSearchTopicFilter('all')}
                  >
                    All
                  </button>
                  {searchAvailableTopics.slice(0, 10).map(tp => (
                    <button 
                      key={tp}
                      className={`tag-pill-item ${searchTopicFilter === tp ? 'active' : ''}`}
                      onClick={() => setSearchTopicFilter(tp)}
                    >
                      {tp}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Results grid list */}
            <section style={{ marginTop: '0.25rem' }}>
              {searchResultsResources.length > 0 ? (
                <div className="resources-file-grid">
                  {searchResultsResources.map(resource => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      onEdit={handleOpenEditForm}
                      onDelete={(id) => setDeletingResourceId(id)}
                      onSelect={handleOpenResourceDetail}
                      onTopicClick={handleGoToTopic}
                    />
                  ))}
                </div>
              ) : (
                <div className="quiet-empty-state" style={{ padding: '2rem 1rem' }}>
                  <div className="retro-dialog-outer">
                    <div className="retro-dialog-box">
                      <div className="retro-dialog-titlebar">
                        <span className="retro-dialog-floppy">💾</span>
                        <button type="button" className="retro-dialog-close-btn" onClick={() => { setSearchQuery(''); handleReturnFromSearch(); }}>×</button>
                      </div>
                      <div className="retro-dialog-body">
                        <div className="retro-dialog-text">File Not Found</div>
                        <div className="retro-dialog-emoticon">(╯°□°)╯︵ ┻━┻</div>
                        <button type="button" className="retro-dialog-ok-btn" onClick={() => { setSearchQuery(''); handleReturnFromSearch(); }}>OK</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

          </div>
        )}

        {/* RESOURCE DETAIL READING PANE VIEW */}
        {activeView === 'detail' && selectedResource && (
          <div className="detail-view-container">
            
            {/* Breadcrumb Back Link */}
            <button className="detail-back-link" onClick={handleGoBackFromDetail}>
              <PixelArrow size={14} style={{ marginRight: '0.2rem' }} />
              <span>
                Back to {
                  previousView === 'area' && previousArea 
                    ? getAreaNameReadable(previousArea) 
                    : previousView === 'topic' && previousTopicString 
                      ? previousTopicString 
                      : previousView === 'recent' 
                        ? 'Recently Added'
                        : 'Library'
                }
              </span>
            </button>

            {/* Title */}
            <h1 className="detail-title">{selectedResource.title}</h1>

            {/* Format Subtitle */}
            <div className="detail-meta-subtitle">
              {selectedResource.type} &middot; {selectedResource.topic} &middot; {getAreaNameReadable(selectedResource.area)}
            </div>

            <div className="detail-divider" />

            {/* Description/Notes preview */}
            {selectedResource.notes && (
              <p className="detail-description">{selectedResource.notes}</p>
            )}

            {/* Large primary Open Resource Button */}
            {selectedResource.url && (
              <a 
                href={selectedResource.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-detail-open"
              >
                <span>Open Resource</span>
                <PixelLink size={14} />
              </a>
            )}

            <div className="detail-divider" />

            {/* Inline image if photo format */}
            {selectedResource.type === 'photo' && selectedResource.file_path && (
              <div className="detail-photo-box">
                <img 
                  src={selectedResource.file_path} 
                  alt={selectedResource.title} 
                  className="detail-photo-image"
                />
              </div>
            )}

            {/* Topics/Tags Pills List */}
            {selectedResource.tags && selectedResource.tags.length > 0 && (
              <div>
                <h3 className="detail-notes-title" style={{ marginBottom: '0.4rem' }}>Tags</h3>
                <div className="detail-tag-chips-list">
                  {selectedResource.tags.map(tag => (
                    <span key={tag} className="detail-tag-chip">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Date Saved */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Saved on {new Date(selectedResource.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

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
            <div className="modal-sheet-header" style={{ borderBottom: 'none' }}>
              <h3 className="modal-sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                <PixelAlert size={18} />
                Delete Resource?
              </h3>
              <button className="icon-btn-compact" onClick={() => setDeletingResourceId(null)}>
                <PixelClose size={12} />
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
    </div>
    </>
  );
}

export default App;
