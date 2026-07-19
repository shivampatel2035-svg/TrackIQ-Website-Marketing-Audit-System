import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';

// The backend (trackiq-backend/server.js) listens on a fixed port.
const API_BASE_URL = 'http://localhost:5000';
const SCAN_TIMEOUT_MS = 30000;
// POST /api/report/pdf re-runs the full audit server-side (it has no
// way to accept already-computed results), so it needs at least as
// long as a scan - a bit more, to leave headroom for PDF assembly on
// top of that.
const PDF_TIMEOUT_MS = 40000;

export type ScanStatus = 'idle' | 'loading' | 'success' | 'error';
export type PdfStatus = 'idle' | 'generating' | 'error';

// Shape of a successful POST /api/scan response - confirmed directly
// against trackiq-backend/server.js and modules/auditRunner.js, not
// guessed. Nested shapes are kept loose on purpose: Phase 1 only needs
// to receive and store this, not render it (that's Phase 2, wiring it
// into the dashboard components' existing prop types).
export interface ScanApiResponse {
  success: true;
  url: string;
  statusCode: number;
  htmlLength: number;
  tracking: {
    results: Record<string, string>;
    score: number;
    // Per-tracker evidence, confirmed against trackingDetector.js's
    // detectTracking() return shape.
    details: Record<
      string,
      {
        detected: boolean;
        confidence: number;
        matchedEvidence: string[];
        matchedSignatures: string[];
        reason: string;
      }
    >;
  };
  seo: {
    results: Record<string, string>;
    score: number;
  };
  performance: {
    metrics: Record<string, string | number>;
    score: number;
  };
  overall: {
    score: number;
    status: string;
  };
  // Confirmed against recommendationEngine.js: always string[], no
  // richer objects - the backend has no title/impact/category fields.
  recommendations: string[];
  message: string;
}

// One completed scan's headline result, kept in-memory for this
// browser session only (never persisted, never sent anywhere) so the
// dashboard's "Score Trend" chart can show real scores across the
// scans actually run in this session instead of fabricated history -
// the backend has no database/scan-history endpoint (by design, per
// the SRS), so this is the only honest source for that chart.
export interface ScanHistoryEntry {
  url: string;
  score: number;
}

interface ScanCtx {
  status: ScanStatus;
  error: string | null;
  report: ScanApiResponse | null;
  scannedUrl: string;
  history: ScanHistoryEntry[];
  runScan: (url: string) => Promise<void>;
  reset: () => void;
  pdfStatus: PdfStatus;
  pdfError: string | null;
  downloadPdf: (url: string) => Promise<void>;
}

const ScanContext = createContext<ScanCtx>({
  status: 'idle',
  error: null,
  report: null,
  scannedUrl: '',
  history: [],
  runScan: async () => {},
  reset: () => {},
  pdfStatus: 'idle',
  pdfError: null,
  downloadPdf: async () => {},
});

// Turns a scanned URL into a filesystem-safe filename fragment, e.g.
// "https://www.nike.in/" -> "www.nike.in". Falls back to the raw
// input if it isn't a parseable URL (matches how the backend itself
// tolerates protocol-less input rather than rejecting it outright).
function hostnameForFilename(url: string): string {
  try {
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withScheme).hostname.replace(/[^a-z0-9.-]/gi, '-');
  } catch {
    return 'report';
  }
}

// Cap on how many past scans this session's trend chart keeps -
// matches the 6 bars the original chart design showed.
const MAX_HISTORY_ENTRIES = 6;

export function ScanProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ScanApiResponse | null>(null);
  const [scannedUrl, setScannedUrl] = useState('');
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [pdfStatus, setPdfStatus] = useState<PdfStatus>('idle');
  const [pdfError, setPdfError] = useState<string | null>(null);

  const runScan = useCallback(async (url: string) => {
    setStatus('loading');
    setError(null);
    setScannedUrl(url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_BASE_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error('The server sent back a response we could not read.');
      }

      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'The scan could not be completed.');
      }

      const typedData = data as ScanApiResponse;
      setReport(typedData);
      setStatus('success');
      setHistory((prev: ScanHistoryEntry[]) =>
        [...prev, { url, score: typedData.overall.score }].slice(-MAX_HISTORY_ENTRIES)
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('The scan is taking too long. The site may be slow or unreachable — try again.');
      } else if (err instanceof TypeError) {
        // fetch() rejects with a generic TypeError when the request
        // can't reach the server at all (offline, wrong port, CORS).
        setError('Could not reach the TrackIQ backend. Make sure the server is running on http://localhost:5000.');
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong during the scan.');
      }
      setReport(null);
      setStatus('error');
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setReport(null);
    setScannedUrl('');
    setPdfStatus('idle');
    setPdfError(null);
  }, []);

  // Calls the backend's real PDF endpoint (POST /api/report/pdf) and
  // downloads the returned file. Note: this endpoint has no way to
  // accept already-computed audit data - it always re-runs the full
  // scan server-side from the URL alone, exactly like /api/scan does.
  // For a site whose content is stable that reproduces the same
  // report already on screen; for a site that changes between the two
  // requests, the PDF could in principle differ slightly from what's
  // displayed. There's no separate backend route to export the
  // in-memory report as-is, so re-scanning is the only way to produce
  // a PDF today.
  const downloadPdf = useCallback(async (url: string) => {
    setPdfStatus('generating');
    setPdfError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PDF_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_BASE_URL}/api/report/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // On failure the backend sends JSON ({ success: false, error }),
        // not a PDF - try to read that message before falling back.
        let message = 'Could not generate the PDF report.';
        try {
          const errBody = await res.json();
          if (errBody?.error) message = errBody.error;
        } catch {
          // Response wasn't JSON either - keep the generic message.
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `trackiq-report-${hostnameForFilename(url)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      setPdfStatus('idle');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setPdfError('PDF generation is taking too long. The site may be slow or unreachable — try again.');
      } else if (err instanceof TypeError) {
        setPdfError('Could not reach the TrackIQ backend. Make sure the server is running on http://localhost:5000.');
      } else {
        setPdfError(err instanceof Error ? err.message : 'Something went wrong while generating the PDF.');
      }
      setPdfStatus('error');
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  return (
    <ScanContext.Provider
      value={{ status, error, report, scannedUrl, history, runScan, reset, pdfStatus, pdfError, downloadPdf }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export const useScan = () => useContext(ScanContext);
