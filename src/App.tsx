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
  Pencil,
  MoreVertical,
  Eye,
  Copy,
  FolderInput,
  User
} from 'lucide-react';

import { ResourceForm } from './components/ResourceForm';
import { PinModal } from './components/PinModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { RenameModal } from './components/RenameModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { Input } from './components/Input';
import type { Resource, AreaType, ResourceType, Subtopic } from './types';
import { isSupabaseConfigured } from './supabaseClient';
import { fetchResourcesFromDb, insertResourceToDb, updateResourceInDb, deleteResourceFromDb, deleteMultipleResourcesFromDb, bulkMoveResourcesInDb } from './services/resourceService';
import { fetchHomePinsFromDb, fetchSubtopicPinsFromDb, saveHomePinInDb, saveSubtopicPinInDb } from './services/pinService';
import { getStoragePublicUrl } from './services/storageService';
import { renameSubtopicInDb, renameAreaInDb, deleteSubtopicInDb, deleteAreaInDb } from './services/organizationService';
import { fetchSubtopicsFromDb, createSubtopicInDb } from './services/subtopicService';

type ViewType = 'home' | 'area' | 'topic' | 'search' | 'detail' | 'all' | 'recent' | 'profile' | 'recycle_bin';


function App() {
  // Resources Database Store
  const [resources, setResources] = useState<Resource[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

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
  const [previewingResource, setPreviewingResource] = useState<Resource | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastFading, setIsToastFading] = useState(false);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setIsToastFading(false);

    // Fade out at 1.0s, remove completely at 1.35s
    setTimeout(() => {
      setIsToastFading(true);
    }, 1000);

    setTimeout(() => {
      setToastMessage(null);
      setIsToastFading(false);
    }, 1350);
  };



  // Organization Menu & Modal States
  const [activeDropdownKey, setActiveDropdownKey] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ type: 'subtopic' | 'area'; name: string; area?: AreaType } | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ type: 'subtopic' | 'area'; name: string; area?: AreaType } | null>(null);

  // Close active dropdown menu when clicking anywhere on page
  useEffect(() => {
    const handleDocumentClick = () => setActiveDropdownKey(null);
    window.addEventListener('click', handleDocumentClick);
    return () => window.removeEventListener('click', handleDocumentClick);
  }, []);

  // Table Selection & Pagination States
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [currentPageTopic, setCurrentPageTopic] = useState(1);
  const [deletingMultipleResources, setDeletingMultipleResources] = useState(false);

  // Recently Visited Subtopics State (Internal history tracking - device-local UI preference)
  const [recentlyVisited, setRecentlyVisited] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('catalog_recently_visited');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [homePinnedIds, setHomePinnedIds] = useState<string[]>([]);
  const [subtopicPinnedMap, setSubtopicPinnedMap] = useState<Record<string, string[]>>({});

  // Pin destination modal states
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinTargetResourceId, setPinTargetResourceId] = useState<string | null>(null);

  // Bulk Move States
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveToArea, setMoveToArea] = useState<AreaType | ''>('');
  const [moveTopicSelection, setMoveTopicSelection] = useState<string>('create_new');
  const [moveToSubtopic, setMoveToSubtopic] = useState<string>('');


  useEffect(() => {
    localStorage.setItem('catalog_recently_visited', JSON.stringify(recentlyVisited));
  }, [recentlyVisited]);

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

  // 1. Initial Load: Exclusively fetch from Supabase
  useEffect(() => {
    const loadResources = async () => {
      if (!isSupabaseConfigured) {
        setDbError('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
        return;
      }

      try {
        setDbError(null);
        const list = await fetchResourcesFromDb();
        setResources(list);

        const subtopicsList = await fetchSubtopicsFromDb();
        setSubtopics(subtopicsList);

        const homePins = await fetchHomePinsFromDb();
        setHomePinnedIds(homePins);

        const subtopicPins = await fetchSubtopicPinsFromDb();
        setSubtopicPinnedMap(subtopicPins);
      } catch (err: any) {
        console.error('Error loading data from Supabase:', err);
        setDbError(err?.message || 'Failed to connect to Supabase database.');
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
    const dbTopics = subtopics.filter(s => s.area === areaKey).map(s => s.name);
    const resourceTopics = resources.filter(res => res.area === areaKey).map(res => res.topic);
    const topics = Array.from(
      new Set([...dbTopics, ...resourceTopics])
    ).filter(Boolean);
    return topics.sort((a, b) => a.localeCompare(b));
  };

  // Save resource (Insert or Edit)
  const handleSaveResource = async (resourceData: Omit<Resource, 'id' | 'created_at'>) => {
    try {
      let subtopicObj = subtopics.find(s => s.area === resourceData.area && s.name.toLowerCase() === resourceData.topic.trim().toLowerCase());
      if (!subtopicObj && resourceData.topic && resourceData.topic.trim()) {
        try {
          subtopicObj = await createSubtopicInDb(resourceData.area, resourceData.topic.trim());
        } catch (sErr) {
          console.warn('Subtopic creation info:', sErr);
        }
      }

      const payload = {
        ...resourceData,
        topic: resourceData.topic.trim(),
        subtopic_id: subtopicObj?.id
      };

      if (editingResource) {
        await updateResourceInDb(editingResource.id, payload);
      } else {
        await insertResourceToDb(payload);
      }

      const refreshedResources = await fetchResourcesFromDb();
      setResources(refreshedResources);
      const refreshedSubtopics = await fetchSubtopicsFromDb();
      setSubtopics(refreshedSubtopics);

      if (selectedResource && editingResource && selectedResource.id === editingResource.id) {
        const updatedSel = refreshedResources.find(r => r.id === editingResource.id);
        if (updatedSel) setSelectedResource(updatedSel);
      }
    } catch (err) {
      console.error('Error saving resource in Supabase:', err);
      alert('Failed to save to Supabase.');
    }

    setEditingResource(null);
    setIsFormOpen(false);
    triggerToast('Resource saved!');
  };



  // Delete Resource
  const handleDeleteResource = async (id: string) => {
    try {
      await deleteResourceFromDb(id);
      setResources(resources.filter(res => res.id !== id));
    } catch (err) {
      console.error('Error deleting resource from Supabase:', err);
      alert('Failed to delete from Supabase.');
    }

    setDeletingResourceId(null);
    if (selectedResource && selectedResource.id === id) {
      setSelectedResource(null);
    }
  };

  const handleSavePinSettings = async (homePinned: boolean, subtopicPinned: boolean) => {
    if (!pinTargetResourceId) return;
    const targetResource = resources.find(r => r.id === pinTargetResourceId);
    if (!targetResource) return;
    const subtopicKey = targetResource.topic;

    try {
      const subtopicId = targetResource.subtopic_id;
      await saveHomePinInDb(pinTargetResourceId, homePinned);
      await saveSubtopicPinInDb(pinTargetResourceId, subtopicKey, subtopicPinned, subtopicId);
    } catch (err) {
      console.error('Error saving pin configurations in Supabase:', err);
      alert('Failed to save pins to database.');
    }

    // Update in-memory state
    setHomePinnedIds(prev => {
      const isAlready = prev.includes(pinTargetResourceId);
      if (homePinned && !isAlready) {
        return [...prev, pinTargetResourceId];
      }
      if (!homePinned && isAlready) {
        return prev.filter(id => id !== pinTargetResourceId);
      }
      return prev;
    });

    setSubtopicPinnedMap(prev => {
      const currentList = prev[subtopicKey] || [];
      const isAlready = currentList.includes(pinTargetResourceId);
      let nextList = currentList;
      if (subtopicPinned && !isAlready) {
        nextList = [...currentList, pinTargetResourceId];
      } else if (!subtopicPinned && isAlready) {
        nextList = currentList.filter(id => id !== pinTargetResourceId);
      }
      return {
        ...prev,
        [subtopicKey]: nextList
      };
    });

    setIsPinModalOpen(false);
    setPinTargetResourceId(null);
    setSelectedResources([]);
  };

  const handleOpenResource = (resource: Resource) => {
    if (resource.url) {
      window.open(resource.url, '_blank');
    } else if (resource.file_path) {
      if (resource.file_path.startsWith('data:')) {
        const win = window.open();
        if (win) {
          win.document.write(`<iframe src="${resource.file_path}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        }
      } else {
        const runtimeUrl = getStoragePublicUrl(resource.file_path);
        if (runtimeUrl) {
          window.open(runtimeUrl, '_blank');
        }
      }
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
      await deleteMultipleResourcesFromDb(selectedResources);
      setResources(prev => prev.filter(res => !selectedResources.includes(res.id)));
      setSelectedResources([]);
      setDeletingMultipleResources(false);
    } catch (err) {
      console.error("Error deleting multiple resources:", err);
      alert('Failed to delete selected resources.');
    }
  };

  const handleSaveRename = async (newName: string) => {
    if (!renameTarget) return;

    if (renameTarget.type === 'subtopic' && renameTarget.area) {
      const oldName = renameTarget.name;
      const area = renameTarget.area;
      const targetSubtopicObj = subtopics.find(s => s.area === area && s.name === oldName);

      await renameSubtopicInDb(oldName, newName, area, targetSubtopicObj?.id);

      setSubtopics(prev => prev.map(s => 
        (s.area === area && s.name === oldName) ? { ...s, name: newName.trim() } : s
      ));

      setResources(prev => prev.map(r => 
        (r.area === area && r.topic === oldName) ? { ...r, topic: newName.trim() } : r
      ));

      setSubtopicPinnedMap(prev => {
        const next = { ...prev };
        if (next[oldName]) {
          next[newName] = next[oldName];
          delete next[oldName];
        }
        return next;
      });

      if (activeTopicString === oldName) {
        setActiveTopicString(newName);
      }
    } else if (renameTarget.type === 'area') {
      const oldArea = renameTarget.name;

      await renameAreaInDb(oldArea, newName);

      setResources(prev => prev.map(r => 
        r.area === oldArea ? { ...r, area: newName as any } : r
      ));

      if (activeArea === oldArea) {
        setActiveArea(newName as any);
      }
    }
  };

  const handleSaveDelete = async () => {
    if (!deleteConfirmTarget) return;

    if (deleteConfirmTarget.type === 'subtopic' && deleteConfirmTarget.area) {
      const topicName = deleteConfirmTarget.name;
      const area = deleteConfirmTarget.area;
      const targetSubtopicObj = subtopics.find(s => s.area === area && s.name === topicName);
      const matchingResources = resources.filter(r => r.area === area && r.topic === topicName);
      const idsToDelete = matchingResources.map(r => r.id);

      await deleteSubtopicInDb(topicName, area, resources, targetSubtopicObj?.id);

      setSubtopics(prev => prev.filter(s => !(s.area === area && s.name === topicName)));
      setResources(prev => prev.filter(r => !idsToDelete.includes(r.id)));
      setHomePinnedIds(prev => prev.filter(id => !idsToDelete.includes(id)));
      setSubtopicPinnedMap(prev => {
        const next = { ...prev };
        delete next[topicName];
        return next;
      });
      setSelectedResources(prev => prev.filter(id => !idsToDelete.includes(id)));

      if (activeTopicString === topicName) {
        setActiveView('area');
        setActiveTopicString(null);
      }
    } else if (deleteConfirmTarget.type === 'area') {
      const area = deleteConfirmTarget.name;
      const matchingResources = resources.filter(r => r.area === area);
      const idsToDelete = matchingResources.map(r => r.id);

      await deleteAreaInDb(area, resources);

      setResources(prev => prev.filter(r => !idsToDelete.includes(r.id)));
      setHomePinnedIds(prev => prev.filter(id => !idsToDelete.includes(id)));
      setSelectedResources(prev => prev.filter(id => !idsToDelete.includes(id)));

      if (activeArea === area) {
        handleGoHome();
      }
    }
  };

  const handleMoveAreaChange = (newArea: AreaType) => {
    setMoveToArea(newArea);
    const topics = getUniqueTopicsListForArea(newArea);
    if (topics.length > 0) {
      setMoveTopicSelection(topics[0]);
      setMoveToSubtopic('');
    } else {
      setMoveTopicSelection('create_new');
      setMoveToSubtopic('');
    }
  };

  const handleConfirmMoveSelected = async () => {
    let targetSubtopicName = '';
    if (moveTopicSelection === 'create_new') {
      targetSubtopicName = moveToSubtopic.trim();
    } else {
      targetSubtopicName = moveTopicSelection.trim();
    }

    if (selectedResources.length === 0 || !moveToArea || !targetSubtopicName) return;
    try {
      targetSubtopicName = targetSubtopicName.charAt(0).toUpperCase() + targetSubtopicName.slice(1);
      let subtopicObj = subtopics.find(s => s.area === moveToArea && s.name.toLowerCase() === targetSubtopicName.toLowerCase());
      
      if (!subtopicObj) {
        try {
          subtopicObj = await createSubtopicInDb(moveToArea, targetSubtopicName);
        } catch (sErr) {
          console.warn('Subtopic creation info:', sErr);
        }
      }

      await bulkMoveResourcesInDb(selectedResources, moveToArea, targetSubtopicName, subtopicObj?.id);

      const refreshedResources = await fetchResourcesFromDb();
      setResources(refreshedResources);
      const refreshedSubtopics = await fetchSubtopicsFromDb();
      setSubtopics(refreshedSubtopics);

      const movedCount = selectedResources.length;
      setSelectedResources([]);
      setIsMoveModalOpen(false);
      triggerToast(`Moved ${movedCount} items to ${targetSubtopicName}`);
      
      setRecentlyVisited(prev => {
        const filtered = prev.filter(t => t !== targetSubtopicName);
        return [targetSubtopicName, ...filtered].slice(0, 5);
      });
    } catch (err) {
      console.error("Error moving multiple resources:", err);
      alert('Failed to move selected resources.');
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

  const handleCopySelectedLinks = () => {
    if (selectedResources.length === 0) return;
    
    const targets = resources.filter(res => selectedResources.includes(res.id));
    const validLinks = targets.filter(res => res.url && res.url.trim().length > 0);
    
    if (validLinks.length === 0) {
      triggerToast('No valid URL links in selection');
      return;
    }

    if (validLinks.length === 1) {
      navigator.clipboard.writeText(validLinks[0].url!);
      triggerToast('Resource link copied to clipboard!');
    } else {
      const textList = validLinks.map(res => `• ${res.title}: ${res.url}`).join('\n');
      navigator.clipboard.writeText(textList);
      triggerToast(`Copied ${validLinks.length} links to clipboard!`);
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
      case 'profile':
        return 'user_profile.cfg';
      case 'recycle_bin':
        return 'recycle_bin.exe';
      default:
        return 'vault.exe';

    }
  };

  const renderRefinedResourceTable = (resourcesList: Resource[]) => {
    if (resourcesList.length === 0) {
      const getEmptyTitle = () => {
        if (searchQuery || activeView === 'search') return '📁 Search Results';
        if (activeView === 'topic') return `📁 ${activeTopicString || 'Subtopic'}`;
        if (activeView === 'area') return `📁 ${getAreaNameReadable(activeArea)}`;
        return '📁 No Resources';
      };

      const getEmptyMessage = () => {
        if (searchQuery) return `No resources match "${searchQuery}".`;
        if (selectedType !== 'all') return `No ${selectedType} resources found in this filter.`;
        if (activeView === 'topic') return `No resources added to "${activeTopicString}" yet.`;
        if (activeView === 'area') return `No resources added to "${getAreaNameReadable(activeArea)}" yet.`;
        return 'No resources found in this collection.';
      };

      const getButtonBgColor = () => {
        if (activeArea === 'career') return '#10B981';
        if (activeArea === 'computer') return '#2563EB';
        if (activeArea === 'ai_tech') return '#7C3AED';
        if (activeArea === 'personal') return '#E11D48';
        return '#7C3AED';
      };

      return (
        <div className="quiet-empty-state" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center' }}>
          <div className="modal-sheet" style={{ maxWidth: '360px', width: '100%', position: 'static', transform: 'none', margin: '0 auto' }}>
            <div className="modal-sheet-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF', padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
              <h3 className="modal-sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--border-color)', margin: 0, fontSize: '1.15rem' }}>
                <span>{getEmptyTitle()}</span>
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

            <div style={{ padding: '0.5rem 1.5rem 1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>
                {getEmptyMessage()}
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
                  backgroundColor: getButtonBgColor(),
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
                onClick={handleCopySelectedLinks}
                disabled={selectedResources.length === 0}
                title={selectedResources.length > 1 ? "Copy selected links" : "Copy link"}
              >
                <Copy size={15} color="#1A1A1A" strokeWidth={2} />
              </button>

              <button 
                type="button"
                className="refined-toolbar-btn" 
                onClick={() => {
                  const targetArea = activeArea || 'career';
                  handleMoveAreaChange(targetArea);
                  setIsMoveModalOpen(true);
                }}
                disabled={selectedResources.length === 0}
                title="Move selected resources to another area/subtopic"
              >
                <FolderInput size={15} color="#1A1A1A" strokeWidth={2} />
              </button>

              <button 
                type="button"
                className="refined-toolbar-btn" 
                onClick={() => setDeletingMultipleResources(true)}
                disabled={selectedResources.length === 0}
                title="Delete selected resources"
              >
                <Trash2 size={15} color="#1A1A1A" strokeWidth={2} />
              </button>
              
              {selectedResources.length === 1 && (
                <>
                  <button 
                    type="button"
                    className="refined-toolbar-btn" 
                    onClick={handleEditSelected}
                    title="Edit resource"
                  >
                    <Pencil size={15} color="#1A1A1A" strokeWidth={2} />
                  </button>
                  {(() => {
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
                        title={isPinnedAnywhere ? "Unpin resource" : "Pin resource"}
                      >
                        <span style={{ fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center' }}>{isPinnedAnywhere ? '📍' : '📌'}</span>
                      </button>
                    );
                  })()}
                </>
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
        <section style={{ width: '100%', overflowX: 'hidden' }}>
          <table className="refined-table" style={{ width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '6px', textAlign: 'center', padding: 0 }}>
                  {/* Stripes */}
                </th>
                <th style={{ width: '36px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    className="table-checkbox"
                    checked={isAllPageSelected}
                    onChange={() => handleToggleSelectAll(paginatedResources)}
                  />
                </th>
                <th style={{ width: 'auto' }}>Name</th>
                <th style={{ width: '90px' }}>Type</th>
                <th style={{ width: '80px' }}>Added</th>
                <th style={{ width: '85px', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResources.map((resource) => {
                const isSelected = selectedResources.includes(resource.id);
                const sanitizedFilename = resource.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '_')
                  .substring(0, 24);

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
                    <td style={{ padding: 0, width: '6px' }}>
                      <div className={`recent-file-stripe ${resource.area}`} style={{ height: '44px', margin: '0 auto' }} />
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="table-checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(resource.id)}
                      />
                    </td>
                    <td style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className={`recent-file-icon-box ${resource.area}`} style={{ width: '32px', height: '32px', fontSize: '0.9rem', flexShrink: 0 }}>
                          <span>{getRecentFileEmoji(resource.type)}</span>
                        </div>
                        <div className="recent-file-meta" style={{ overflow: 'hidden', minWidth: 0 }}>
                          <span className="recent-file-name" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                            {sanitizedFilename}{getFileExtension(resource.type)}
                            {activeTopicString && (subtopicPinnedMap[activeTopicString] || []).includes(resource.id) && (
                              <span style={{ marginLeft: '0.35rem', fontSize: '0.75rem' }} title="Pinned to this Subtopic">📌</span>
                            )}
                          </span>
                          <span 
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-word',
                              whiteSpace: 'normal',
                              fontSize: '0.72rem',
                              color: '#64748B',
                              marginTop: '0.1rem',
                              lineHeight: '1.3'
                            }}
                            title={resource.description || resource.notes || getDomain(resource.url) || ''}
                          >
                            {resource.description || resource.notes || getDomain(resource.url) || 'No description'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`resource-type-badge ${resource.type}`} style={{ fontSize: '0.6rem' }}>
                        {resource.type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748B' }}>{getRelativeTimeString(resource.created_at)}</td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', alignItems: 'center' }}>
                        {resource.file_path && (
                          <button 
                            type="button"
                            title="View file"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewingResource(resource);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Eye size={16} color="#1A1A1A" strokeWidth={2} />
                          </button>
                        )}
                        {resource.url && (
                          <button 
                            type="button"
                            title="Open external URL"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(resource.url, '_blank');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <ExternalLink size={16} color="#1A1A1A" strokeWidth={2} />
                          </button>
                        )}


                      </div>
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

  if (dbError || !isSupabaseConfigured) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', backgroundColor: '#F8FAFC' }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          border: '2px solid #1A1A1A',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '4px 4px 0px #1A1A1A',
          textAlign: 'center'
        }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#FEE2E2', border: '2px solid #1A1A1A', borderRadius: '50%', marginBottom: '1.25rem' }}>
            <AlertCircle size={36} color="#DC2626" strokeWidth={2} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.75rem' }}>
            Database Connection Required
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            {dbError || 'Supabase is not configured or reachable. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.6rem 1.25rem',
              backgroundColor: '#FEF08A',
              border: '2px solid #1A1A1A',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '2px 2px 0px #1A1A1A'
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

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

          {/* Sidebar Menu Items */}
          <div className="sidebar-menu-list">
            <div 
              className={`sidebar-item generic ${activeView === 'home' ? 'active' : ''}`}
              onClick={handleGoHome}
            >
              <span className="sidebar-item-icon"><Home size={16} color="#1A1A1A" strokeWidth={2} /></span>
              <span>Home</span>
            </div>

            <div 
              className={`sidebar-item generic ${activeView === 'recycle_bin' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('recycle_bin');
                setActiveArea(null);
                setActiveTopicString(null);
                setSelectedResource(null);
              }}
            >
              <span className="sidebar-item-icon"><Trash2 size={16} color="#1A1A1A" strokeWidth={2} /></span>
              <span>Recycle Bin</span>
            </div>

            <div 
              className={`sidebar-item generic ${activeView === 'profile' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('profile');
                setActiveArea(null);
                setActiveTopicString(null);
                setSelectedResource(null);
              }}
            >
              <span className="sidebar-item-icon"><User size={16} color="#1A1A1A" strokeWidth={2} /></span>
              <span>Profile</span>
            </div>
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

        {/* Center Fading Toast Popup (Small Clean White Card) */}
        {toastMessage && (
          <div className={`center-toast-popup ${isToastFading ? 'fading-out' : ''}`}>
            <Sparkles size={14} color="#7C3AED" strokeWidth={2.2} />
            <span>{toastMessage}</span>
          </div>
        )}





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
                    style={{ position: 'relative' }}
                  >
                    {/* Top-Right Three-Dots Options Button */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        title="Area options"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownKey(prev => prev === `area-${areaKey}` ? null : `area-${areaKey}`);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <MoreVertical size={16} color="#1A1A1A" strokeWidth={2} />
                      </button>
                    </div>

                    {/* Area Options Dropdown Menu */}
                    {activeDropdownKey === `area-${areaKey}` && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          right: '0px',
                          top: 'calc(100% + 6px)',
                          backgroundColor: '#FFFFFF',
                          border: '2px solid #1A1A1A',
                          boxShadow: '3px 3px 0px #1A1A1A',
                          borderRadius: '6px',
                          padding: '0.35rem 0',
                          minWidth: '140px',
                          zIndex: 150
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameTarget({ type: 'area', name: areaKey });
                            setActiveDropdownKey(null);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.4rem 0.85rem',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#1A1A1A'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Pencil size={13} />
                          <span>Rename</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmTarget({ type: 'area', name: areaKey });
                            setActiveDropdownKey(null);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.4rem 0.85rem',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#DC2626'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Trash2 size={13} color="#DC2626" />
                          <span>Delete Folder</span>
                        </button>
                      </div>
                    )}

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
                                  title="Open external URL"
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
                            {(resource.url || resource.file_path) && (
                              <button 
                                className="recent-file-link-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenResource(resource);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <button className="detail-back-link" onClick={handleGoHome} style={{ margin: 0 }}>
                <ArrowLeft size={14} color="#1A1A1A" strokeWidth={2} style={{ marginRight: '0.2rem' }} />
                <span>Resource Vault</span>
              </button>
            </div>



            {/* Title / Description */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center' }}>{getAreaIcon(activeArea)}</span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                  {getAreaNameReadable(activeArea)}
                </h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                          style={{ position: 'relative' }}
                        >
                          {/* Top-Right Frameless Three-Dots Options Button */}
                          <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              title="Subtopic options"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownKey(prev => prev === `subtopic-${topicName}` ? null : `subtopic-${topicName}`);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <MoreVertical size={16} color="#1A1A1A" strokeWidth={2} />
                            </button>
                          </div>

                          {/* Subtopic Card Options Dropdown Menu (Positioned cleanly below the folder card) */}
                          {activeDropdownKey === `subtopic-${topicName}` && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: 'absolute',
                                right: '0px',
                                top: 'calc(100% + 6px)',
                                backgroundColor: '#FFFFFF',
                                border: '2px solid #1A1A1A',
                                boxShadow: '3px 3px 0px #1A1A1A',
                                borderRadius: '6px',
                                padding: '0.35rem 0',
                                minWidth: '140px',
                                zIndex: 150
                              }}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameTarget({ type: 'subtopic', name: topicName, area: activeArea });
                                  setActiveDropdownKey(null);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.4rem 0.85rem',
                                  background: 'none',
                                  border: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  color: '#1A1A1A'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <Pencil size={13} />
                                <span>Rename</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmTarget({ type: 'subtopic', name: topicName, area: activeArea });
                                  setActiveDropdownKey(null);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.4rem 0.85rem',
                                  background: 'none',
                                  border: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  color: '#EF4444'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <Trash2 size={13} color="#EF4444" />
                                <span>Delete Folder</span>
                              </button>
                            </div>
                          )}


                          <div className="subtopic-card-folder-icon">
                            <Folder size={20} color="#1A1A1A" strokeWidth={2} />
                          </div>
                          <div className="subtopic-card-info">
                            <span className="subtopic-card-name">{topicName}</span>
                            <span className="subtopic-card-count">{count} {count === 1 ? 'file' : 'files'}</span>
                          </div>

                          <ChevronRight size={14} color="#1A1A1A" strokeWidth={2.5} style={{ marginLeft: 'auto', flexShrink: 0 }} />

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

        {/* PROFILE VIEW */}
        {activeView === 'profile' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <button className="detail-back-link" onClick={handleGoHome} style={{ margin: 0 }}>
                <ArrowLeft size={14} color="#1A1A1A" strokeWidth={2} style={{ marginRight: '0.2rem' }} />
                <span>Resource Vault</span>
              </button>
            </div>

            <div style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #1A1A1A',
              boxShadow: '4px 4px 0px #1A1A1A',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '540px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF08A',
                  border: '2px solid #1A1A1A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  boxShadow: '2px 2px 0px #1A1A1A'
                }}>
                  <User size={28} color="#1A1A1A" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1A1A1A' }}>User Profile</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage your personal details & preferences</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: '0.35rem' }}>Display Name</label>
                  <input 
                    type="text" 
                    defaultValue="Vault User"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1.5px solid #1A1A1A',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      boxShadow: '2px 2px 0px #1A1A1A'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: '0.35rem' }}>Email Address</label>
                  <input 
                    type="email" 
                    value="user@resourcevault.app"
                    readOnly
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      backgroundColor: '#F8FAFC',
                      color: '#64748B'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    className="btn-action-yellow"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
                    onClick={() => alert('Profile details saved!')}
                  >
                    Save Profile
                  </button>
                  <button 
                    type="button" 
                    style={{
                      padding: '0.5rem 1.25rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      backgroundColor: '#FEE2E2',
                      color: '#DC2626',
                      border: '1.5px solid #1A1A1A',
                      borderRadius: '6px',
                      boxShadow: '2px 2px 0px #1A1A1A',
                      cursor: 'pointer'
                    }}
                    onClick={() => alert('Signed out')}

                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RECYCLE BIN VIEW */}
        {activeView === 'recycle_bin' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <button className="detail-back-link" onClick={handleGoHome} style={{ margin: 0 }}>
                <ArrowLeft size={14} color="#1A1A1A" strokeWidth={2} style={{ marginRight: '0.2rem' }} />
                <span>Resource Vault</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🗑️</span> Recycle Bin
                </h1>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Items deleted will be stored here before permanent deletion
                </span>
              </div>
            </div>

            <div className="detail-divider" />

            <div className="quiet-empty-state" style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗑️✨</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recycle Bin is Empty</h3>
              <p className="empty-state-subtitle">Soft-deleted resources will appear here where you can restore or permanently delete them.</p>
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
        initialArea={activeArea}
        initialTopic={activeTopicString}
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
                Move {selectedResources.length} {selectedResources.length === 1 ? 'resource' : 'resources'}

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
                  Target Area *
                </label>
                <select
                  value={moveToArea}
                  onChange={(e) => handleMoveAreaChange(e.target.value as AreaType)}
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
                  <option value="career">Career</option>
                  <option value="computer">Computer</option>
                  <option value="ai_tech">AI & Tech</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              {moveToArea && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1A1A1A' }}>
                    Subtopic / Topic *
                  </label>
                  <select
                    value={moveTopicSelection}
                    onChange={(e) => setMoveTopicSelection(e.target.value)}
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
                    {getUniqueTopicsListForArea(moveToArea).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="create_new">+ Create New Subtopic...</option>
                  </select>
                </div>
              )}

              {moveTopicSelection === 'create_new' && (
                <div className="animate-fade">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1A1A1A' }}>
                    New Subtopic Name *
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
                      backgroundColor: '#FFFFFF',
                      boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.05)'
                    }}
                  />
                </div>
              )}
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
                disabled={!moveToArea || (moveTopicSelection === 'create_new' ? !moveToSubtopic.trim() : !moveTopicSelection.trim())}
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
        return (
          <PinModal
            isOpen={isPinModalOpen}
            onClose={() => {
              setIsPinModalOpen(false);
              setPinTargetResourceId(null);
            }}
            resourceId={pinTargetResourceId}
            resourceTitle={targetResource.title}
            resourceTopic={targetResource.topic}
            homePinnedIds={homePinnedIds}
            subtopicPinnedMap={subtopicPinnedMap}
            onSave={handleSavePinSettings}
          />
        );
      })()}

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewingResource}
        onClose={() => setPreviewingResource(null)}
        resource={previewingResource}
      />

      {/* Organization Rename Modal */}
      {renameTarget && (
        <RenameModal
          isOpen={!!renameTarget}
          onClose={() => setRenameTarget(null)}
          onSave={handleSaveRename}
          initialName={renameTarget.name}
          entityType={renameTarget.type}
          existingNames={
            renameTarget.type === 'subtopic' && renameTarget.area
              ? getUniqueTopicsListForArea(renameTarget.area)
              : ['career', 'computer', 'ai_tech', 'personal']
          }
        />
      )}

      {/* Organization Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <DeleteConfirmationModal
          isOpen={!!deleteConfirmTarget}
          onClose={() => setDeleteConfirmTarget(null)}
          onConfirm={handleSaveDelete}
          title={deleteConfirmTarget.name}
          entityType={deleteConfirmTarget.type}
          fileCount={
            deleteConfirmTarget.type === 'subtopic' && deleteConfirmTarget.area
              ? resources.filter(r => r.area === deleteConfirmTarget.area && r.topic === deleteConfirmTarget.name).length
              : resources.filter(r => r.area === deleteConfirmTarget.name).length
          }
          subtopicCount={
            deleteConfirmTarget.type === 'area'
              ? getUniqueTopicsListForArea(deleteConfirmTarget.name as AreaType).length
              : 0
          }
        />
      )}
    </div>
    </>
  );
}


export default App;


