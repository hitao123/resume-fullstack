import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { resumeSaveCoordinator } from '@/utils/resumeSaveCoordinator';

/** Blocks a final PDF while a section still has a modal/local-only draft. */
export const useExportDraftGuard = (key: string, hasLocalDraft: boolean) => {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (!id) return;
    return resumeSaveCoordinator.register(Number(id), `draft-${key}`, async () => {
      if (hasLocalDraft) throw new Error('Finish saving or discard the open section draft before exporting.');
    });
  }, [hasLocalDraft, id, key]);
};

export default useExportDraftGuard;
