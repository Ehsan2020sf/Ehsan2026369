import { Project } from '../types';

const STORAGE_KEY = 'novin_forge_projects_v1';
const TASK_HISTORY_KEY = 'novin_forge_tasks_v1';

export function saveProjectsToStorage(projects: Project[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    // Sanitize large binary payloads if needed to fit storage quotas
    const serialized = JSON.stringify(projects);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.warn('[STORAGE] Failed to write projects to localStorage (quota or disabled):', err);
    return false;
  }
}

export function loadProjectsFromStorage(): Project[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('[STORAGE] Failed to read projects from localStorage:', err);
    return null;
  }
}

export function clearWorkspaceStorage(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TASK_HISTORY_KEY);
  }
}
