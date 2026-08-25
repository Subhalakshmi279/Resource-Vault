import { supabase } from '../supabaseClient';
import { deleteFileFromStorage } from './storageService';
import type { Resource } from '../types';

/**
 * Renames a subtopic in Supabase (updates subtopics table & subtopic_pins / resources table).
 */
export async function renameSubtopicInDb(oldName: string, newName: string, area: string, subtopicId?: string): Promise<void> {
  if (!supabase) return;

  const trimmedNewName = newName.trim();
  if (!trimmedNewName || oldName === trimmedNewName) return;

  // 1. Single-point update on subtopics table if subtopicId exists
  if (subtopicId) {
    const { error: subtopicErr } = await supabase
      .from('subtopics')
      .update({ name: trimmedNewName })
      .eq('id', subtopicId);

    if (!subtopicErr) return;
  }

  // 2. Try single-point update matching area and name
  const { error: singlePointErr } = await supabase
    .from('subtopics')
    .update({ name: trimmedNewName })
    .eq('area', area)
    .eq('name', oldName);

  if (!singlePointErr) return;

  // 3. Fallback for legacy columns during migration
  const { error: resErr } = await supabase
    .from('resources')
    .update({ subtopic: trimmedNewName })
    .eq('area', area)
    .eq('subtopic', oldName);

  if (resErr) console.warn('Legacy resource subtopic update error:', resErr);

  const { error: pinErr } = await supabase
    .from('subtopic_pins')
    .update({ subtopic: trimmedNewName })
    .eq('subtopic', oldName);

  if (pinErr) {
    console.warn('Could not update subtopic_pins table:', pinErr);
  }
}

/**
 * Renames an area in Supabase (updates resources.area column).
 */
export async function renameAreaInDb(oldArea: string, newAreaName: string): Promise<void> {
  if (!supabase) return;

  const trimmedNewName = newAreaName.trim();
  if (!trimmedNewName || oldArea === trimmedNewName) return;

  const { error } = await supabase
    .from('resources')
    .update({ area: trimmedNewName })
    .eq('area', oldArea);

  if (error) throw error;
}

/**
 * Deletes a subtopic and all associated resources, storage files, and pins.
 * Employs strict error handling: deletes storage files first, then database rows.
 */
export async function deleteSubtopicInDb(topicName: string, area: string, targetResources: Resource[], subtopicId?: string): Promise<void> {
  const matchingResources = targetResources.filter(r => r.area === area && r.topic === topicName);

  // 1. Clean up Storage files for resources that have an uploaded file_path
  for (const res of matchingResources) {
    if (res.file_path && !res.file_path.startsWith('data:')) {
      try {
        await deleteFileFromStorage(res.file_path);
      } catch (storageErr) {
        console.error(`Failed to delete storage file for resource "${res.title}":`, storageErr);
        throw new Error(`Storage file deletion failed for ${res.title}. Operation aborted to prevent data corruption.`);
      }
    }
  }

  if (supabase) {
    // 2. Delete resource DB rows
    if (matchingResources.length > 0) {
      const idsToDelete = matchingResources.map(r => r.id);
      const { error } = await supabase
        .from('resources')
        .delete()
        .in('id', idsToDelete);

      if (error) {
        throw new Error(`Database resource deletion failed: ${error.message}`);
      }
    }

    // 3. Delete subtopic row from subtopics table
    if (subtopicId) {
      await supabase.from('subtopics').delete().eq('id', subtopicId);
    } else {
      await supabase.from('subtopics').delete().eq('area', area).eq('name', topicName);
    }
  }
}

/**
 * Deletes an area and all associated resources, storage files, and pins.
 */
export async function deleteAreaInDb(area: string, targetResources: Resource[]): Promise<void> {
  const matchingResources = targetResources.filter(r => r.area === area);

  // 1. Clean up Storage files
  for (const res of matchingResources) {
    if (res.file_path && !res.file_path.startsWith('data:')) {
      try {
        await deleteFileFromStorage(res.file_path);
      } catch (storageErr) {
        console.error(`Failed to delete storage file for resource "${res.title}":`, storageErr);
        throw new Error(`Storage file deletion failed for ${res.title}. Operation aborted.`);
      }
    }
  }

  // 2. Delete resource DB rows
  if (supabase && matchingResources.length > 0) {
    const idsToDelete = matchingResources.map(r => r.id);
    const { error } = await supabase
      .from('resources')
      .delete()
      .in('id', idsToDelete);

    if (error) {
      throw new Error(`Database area deletion failed: ${error.message}`);
    }
  }
}
