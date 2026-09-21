type Flush = () => Promise<void>;

const flushers = new Map<number, Map<string, Flush>>();
const pending = new Map<number, Map<string, Promise<void>>>();

export const resumeSaveCoordinator = {
  register(resumeId: number, key: string, flush: Flush) {
    let entries = flushers.get(resumeId);
    if (!entries) { entries = new Map(); flushers.set(resumeId, entries); }
    entries.set(key, flush);
    return () => { entries?.delete(key); };
  },

  track<T>(resumeId: number, key: string, operation: Promise<T>): Promise<T> {
    let entries = pending.get(resumeId);
    if (!entries) { entries = new Map(); pending.set(resumeId, entries); }
    const settled = operation.then(() => undefined);
    entries.set(key, settled);
    void settled.finally(() => {
      if (pending.get(resumeId)?.get(key) === settled) pending.get(resumeId)?.delete(key);
    }).catch(() => undefined);
    return operation;
  },

  async flush(resumeId: number) {
    const registered = [...(flushers.get(resumeId)?.values() || [])];
    await Promise.all(registered.map((flush) => flush()));
    const operations = [...(pending.get(resumeId)?.values() || [])];
    await Promise.all(operations);
  },
};
