import { useCallback, useEffect, useRef, useState } from 'react';
import type { GenerationJob } from '../types/api';
import { getJob } from '../api/jobs';

const POLL_INTERVAL_MS = 2000;

export function useJobPolling(jobId: string | null) {
  const [job, setJob] = useState<GenerationJob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setJob(null);
    if (!jobId) return;

    let cancelled = false;

    async function poll() {
      const latest = await getJob(jobId!);
      if (cancelled) return;
      setJob(latest);
      if (latest.status === 'DONE' || latest.status === 'FAILED' || latest.status === 'CANCELLED') {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }

    void poll();
    timerRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [jobId]);

  // Lets callers (e.g. after selecting a variant) pull the latest job state
  // immediately instead of waiting for the next poll tick (which may have
  // already stopped, since polling ends once a job reaches a final status).
  const refetch = useCallback(async () => {
    if (!jobId) return;
    setJob(await getJob(jobId));
  }, [jobId]);

  return { job, refetch };
}
