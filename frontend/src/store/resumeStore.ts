import { create } from 'zustand';
import type { Resume } from '@/types/resume.types';
import resumeService from '@/services/resumeService';

interface ResumeState {
  resumes: Resume[];
  currentResume: Resume | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchResumes: () => Promise<void>;
  fetchResume: (id: number) => Promise<void>;
  createResume: (title: string, templateId?: number, versionLabel?: string, targetRole?: string) => Promise<Resume>;
  updateResume: (id: number, data: { title?: string; templateId?: number; versionLabel?: string; targetRole?: string; sectionConfig?: Resume['sectionConfig'] }) => Promise<void>;
  deleteResume: (id: number) => Promise<void>;
  duplicateResume: (id: number) => Promise<Resume>;
  setCurrentResume: (resume: Resume | null) => void;
  clearError: () => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  resumes: [],
  currentResume: null,
  isLoading: false,
  error: null,

  fetchResumes: async () => {
    set({ isLoading: true, error: null });
    try {
      const resumes = await resumeService.getResumes();
      set({ resumes, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch resumes',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchResume: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const resume = await resumeService.getResume(id);
      set({ currentResume: resume, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch resume',
        isLoading: false,
      });
      throw error;
    }
  },

  createResume: async (title: string, templateId?: number, versionLabel?: string, targetRole?: string) => {
    set({ isLoading: true, error: null });
    try {
      const resume = await resumeService.createResume({ title, templateId, versionLabel, targetRole });
      set((state) => ({
        resumes: [...state.resumes, resume],
        isLoading: false,
      }));
      return resume;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create resume',
        isLoading: false,
      });
      throw error;
    }
  },

  updateResume: async (id: number, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await resumeService.updateResume(id, data);
      set((state) => ({
        resumes: state.resumes.map((r) => (r.id === id ? updated : r)),
        currentResume: state.currentResume?.id === id ? updated : state.currentResume,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update resume',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteResume: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await resumeService.deleteResume(id);
      set((state) => ({
        resumes: state.resumes.filter((r) => r.id !== id),
        currentResume: state.currentResume?.id === id ? null : state.currentResume,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete resume',
        isLoading: false,
      });
      throw error;
    }
  },

  duplicateResume: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const resume = await resumeService.duplicateResume(id);
      set((state) => ({
        resumes: [...state.resumes, resume],
        isLoading: false,
      }));
      return resume;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to duplicate resume',
        isLoading: false,
      });
      throw error;
    }
  },

  setCurrentResume: (resume) => {
    set({ currentResume: resume });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useResumeStore;
