import { useCallback, useEffect, useRef, useState } from 'react';
import resumeService, { type ResumeExport } from '@/services/resumeService';

export type StablePdfStatus = 'idle' | 'queued' | 'rendering' | 'ready' | 'stale' | 'failed';
export interface StablePdfResult { url?: string; error?: string }

const POLL_INTERVAL_MS = 650;
const POLL_TIMEOUT_MS = 90_000;

/** Owns a single immutable export Blob and prevents superseded async responses from changing the UI. */
export const useStablePdfExport = () => {
  const [status, setStatus] = useState<StablePdfStatus>('idle');
  const [error, setError] = useState<string>();
  const [exportTask, setExportTask] = useState<ResumeExport>();
  const [blobUrl, setBlobUrl] = useState<string>();
  const requestRef = useRef(0);
  const blobRef = useRef<string | undefined>(undefined);

  const clearBlob = useCallback(() => {
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    blobRef.current = undefined;
    setBlobUrl(undefined);
  }, []);

  const markStale = useCallback(() => {
    requestRef.current += 1;
    clearBlob();
    setExportTask(undefined);
    setError(undefined);
    setStatus((previous) => previous === 'idle' ? 'idle' : 'stale');
  }, [clearBlob]);

  const fetchBlob = useCallback(async (task: ResumeExport, token: number): Promise<string | undefined> => {
    const blob = await resumeService.getExportFile(task.resumeId, task.id);
    if (token !== requestRef.current) return undefined;
    clearBlob();
    const url = URL.createObjectURL(blob);
    blobRef.current = url;
    setBlobUrl(url);
    return url;
  }, [clearBlob]);

  const generate = useCallback(async (resumeId: number, locale: string): Promise<StablePdfResult> => {
    const token = ++requestRef.current;
    clearBlob(); setError(undefined); setExportTask(undefined); setStatus('queued');
    try {
      let task = await resumeService.createExport(resumeId, { locale, templateVersion: 'minimal-v2' });
      if (token !== requestRef.current) return {};
      const deadline = Date.now() + POLL_TIMEOUT_MS;
      while (task.status === 'queued' || task.status === 'rendering') {
        setStatus(task.status);
        if (Date.now() >= deadline) throw new Error('PDF rendering timed out. Please retry.');
        await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
        task = await resumeService.getExport(resumeId, task.id);
        if (token !== requestRef.current) return {};
      }
      setExportTask(task);
      if (task.status !== 'ready') throw new Error(task.errorMessage || 'PDF rendering failed. Please retry.');
      const url = await fetchBlob(task, token);
      if (token === requestRef.current) setStatus('ready');
      return { url };
    } catch (cause) {
      if (token !== requestRef.current) return {};
      const detail = cause instanceof Error ? cause.message : String(cause);
      setStatus('failed');
      setError(detail);
      return { error: detail };
    }
  }, [clearBlob, fetchBlob]);

  const download = useCallback(() => {
    if (!blobUrl || !exportTask) return false;
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = exportTask.fileName || 'resume.pdf';
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    return true;
  }, [blobUrl, exportTask]);

  useEffect(() => () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); }, []);
  return { status, error, exportTask, blobUrl, generate, download, markStale };
};

export default useStablePdfExport;
