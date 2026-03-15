import { useState, useRef, useCallback } from 'react';

interface UseAIAssistantReturn {
  content: string;
  isGenerating: boolean;
  error: string | null;
  startGeneration: (streamFn: (callbacks: {
    onChunk: (chunk: string) => void;
    onDone: () => void;
    onError: (error: string) => void;
  }, signal: AbortSignal) => void) => void;
  cancel: () => void;
  reset: () => void;
}

export function useAIAssistant(): UseAIAssistantReturn {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startGeneration = useCallback(
    (streamFn: (callbacks: {
      onChunk: (chunk: string) => void;
      onDone: () => void;
      onError: (error: string) => void;
    }, signal: AbortSignal) => void) => {
      // Cancel any existing generation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setContent('');
      setError(null);
      setIsGenerating(true);

      streamFn(
        {
          onChunk: (chunk) => {
            setContent((prev) => prev + chunk);
          },
          onDone: () => {
            setIsGenerating(false);
          },
          onError: (errMsg) => {
            setError(errMsg);
            setIsGenerating(false);
          },
        },
        controller.signal
      );
    },
    []
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setContent('');
    setError(null);
  }, [cancel]);

  return { content, isGenerating, error, startGeneration, cancel, reset };
}
