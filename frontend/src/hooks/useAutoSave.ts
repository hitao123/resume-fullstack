import { useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';
import { AUTO_SAVE_DELAY, SUCCESS_MESSAGES } from '@/utils/constants';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export const useAutoSave = <T>({
  data,
  onSave,
  delay = AUTO_SAVE_DELAY,
  enabled = true,
}: UseAutoSaveOptions<T>) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousDataRef = useRef<T>(data);
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (isSavingRef.current || !enabled) return;

    try {
      isSavingRef.current = true;
      await onSave(data);
      previousDataRef.current = data;
      message.success(SUCCESS_MESSAGES.CHANGES_SAVED, 1);
    } catch (error: any) {
      message.error(error.message || 'Failed to save changes');
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Check if data has changed
    const hasChanged =
      JSON.stringify(data) !== JSON.stringify(previousDataRef.current);

    if (!hasChanged) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving: isSavingRef.current,
    save: () => save(),
  };
};

export default useAutoSave;
