import { supabase } from '../supabaseClient';
import type { Resource, AreaType } from '../types';

function normalizeArea(rawArea: string): AreaType {
  const lowerArea = (rawArea || '').toLowerCase().trim();
  if (lowerArea === 'career' || lowerArea.includes('career')) return 'career';
  if (lowerArea === 'computer' || lowerArea.includes('comp')) return 'computer';
  if (lowerArea === 'ai_tech' || lowerArea.includes('ai') || lowerArea.includes('tech')) return 'ai_tech';
  if (lowerArea === 'personal' || lowerArea.includes('person')) return 'personal';
  return (rawArea as AreaType) || 'career';
}

/**
 * Fetches all resources from Supabase resources table, ordered by created_at descending.
 */
export async function fetchResourcesFromDb(): Promise<Resource[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('resources')
    .select('*, subtopics (id, area, name)')
    .order('created_at', { ascending: false });

  if (error) {
    // Fallback if join fails or table is being migrated
    const fallback = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });
    if (fallback.error) throw fallback.error;
    return (fallback.data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      url: row.url || undefined,
      file_path: row.file_path || undefined,
      area: normalizeArea(row.area),
      topic: row.subtopic || 'General',
      subtopic_id: row.subtopic_id || undefined,
      type: row.type,
      tags: [],
      notes: row.description || undefined,
      created_at: row.created_at
    }));
  }

  // Map DB structure to App Resource model
  return (data || []).map((row: any) => {
    const subtopicObj = row.subtopics as any;
    const derivedTopic = subtopicObj?.name || row.subtopic || 'General';
    const derivedArea = subtopicObj?.area ? normalizeArea(subtopicObj.area) : normalizeArea(row.area);

    return {
      id: row.id,
      title: row.title,
      url: row.url || undefined,
      file_path: row.file_path || undefined,
      area: derivedArea,
      topic: derivedTopic,
      subtopic_id: row.subtopic_id || subtopicObj?.id || undefined,
      type: row.type,
      tags: [],
      notes: row.description || undefined,
      created_at: row.created_at
    };
  });
}

/**
 * Inserts a new resource into the database.
 */
export async function insertResourceToDb(resource: Omit<Resource, 'id' | 'created_at'>): Promise<Resource> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const payload: Record<string, any> = {
    title: resource.title || 'Untitled Resource',
    url: resource.url || null,
    description: resource.notes || null,
    type: resource.type || 'website',
    area: resource.area || 'career',
    file_path: resource.file_path || null
  };

  if (resource.subtopic_id) {
    payload.subtopic_id = resource.subtopic_id;
  }

  let { data, error } = await supabase
    .from('resources')
    .insert([payload])
    .select('*, subtopics (id, area, name)')
    .single();

  if (error && error.message?.includes('subtopic') && !resource.subtopic_id) {
    payload.subtopic = resource.topic || 'General';
    const retry = await supabase
      .from('resources')
      .insert([payload])
      .select('*, subtopics (id, area, name)')
      .single();
    if (retry.error) throw retry.error;
    data = retry.data;
  } else if (error) {
    throw error;
  }

  const subtopicObj = data.subtopics as any;

  return {
    id: data.id,
    title: data.title,
    url: data.url || undefined,
    file_path: data.file_path || undefined,
    area: normalizeArea(data.area),
    topic: subtopicObj?.name || data.subtopic || resource.topic || 'General',
    subtopic_id: data.subtopic_id || subtopicObj?.id || undefined,
    type: data.type,
    tags: [],
    notes: data.description || undefined,
    created_at: data.created_at
  };
}

/**
 * Updates an existing resource in the database.
 */
export async function updateResourceInDb(id: string, resource: Partial<Resource>): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const updates: Record<string, any> = {};
  if (resource.title !== undefined) updates.title = resource.title;
  if (resource.url !== undefined) updates.url = resource.url;
  if (resource.notes !== undefined) updates.description = resource.notes;
  if (resource.type !== undefined) updates.type = resource.type;
  if (resource.area !== undefined) updates.area = resource.area;
  if (resource.subtopic_id !== undefined) updates.subtopic_id = resource.subtopic_id;
  if (resource.file_path !== undefined) updates.file_path = resource.file_path;
  
  updates.updated_at = new Date().toISOString();

  let { error } = await supabase
    .from('resources')
    .update(updates)
    .eq('id', id);

  if (error && error.message?.includes('subtopic') && resource.topic !== undefined) {
    updates.subtopic = resource.topic;
    const retry = await supabase.from('resources').update(updates).eq('id', id);
    if (retry.error) throw retry.error;
  } else if (error) {
    throw error;
  }
}



/**
 * Deletes a single resource by ID.
 */
export async function deleteResourceFromDb(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Deletes multiple resources by their IDs (bulk delete).
 */
export async function deleteMultipleResourcesFromDb(ids: string[]): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { error } = await supabase
    .from('resources')
    .delete()
    .in('id', ids);

  if (error) throw error;
}

/**
 * Updates area and subtopic for multiple resources in one transaction (bulk move).
 */
export async function bulkMoveResourcesInDb(ids: string[], area: AreaType, subtopic: string, subtopic_id?: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const updates: Record<string, any> = {
    area,
    updated_at: new Date().toISOString()
  };

  if (subtopic_id) {
    updates.subtopic_id = subtopic_id;
  }

  let { error } = await supabase
    .from('resources')
    .update(updates)
    .in('id', ids);

  if (error && error.message?.includes('subtopic')) {
    updates.subtopic = subtopic;
    const retry = await supabase.from('resources').update(updates).in('id', ids);
    if (retry.error) throw retry.error;
  } else if (error) {
    throw error;
  }
}


