import { useState } from 'react';
import { Download, Copy, Printer, X, Check, Loader2 } from 'lucide-react';
import { exportReportAsPDF } from '@/lib/exportPDF';

interface FloatingExportBarProps {
  report: string;
  onDismiss: () => void;
}

export function FloatingExportBar({ report, onDismiss }: FloatingExportBarProps) {
  const [copied, setCopied] = useState(false);
  const [pdfState, setPdfState] = useState<'idle' | 'generating' | 'done'>('idle');

  const handleCopyMd = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePdf = async () => {
    setPdfState('generating');
    try {
      await exportReportAsPDF(report);
      setPdfState('done');
      setTimeout(() => setPdfState('idle'), 2000);
    } catch {
      setPdfState('idle');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-primary/30 bg-card/95 backdrop-blur-lg shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
        <span className="text-xs text-muted-foreground font-medium mr-1">Report ready</span>
        <div className="w-px h-5 bg-border" />

        <button
          onClick={handlePdf}
          disabled={pdfState === 'generating'}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
        >
          {pdfState === 'generating' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : pdfState === 'done' ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {pdfState === 'generating' ? 'Generating…' : pdfState === 'done' ? 'PDF Saved' : 'Download PDF'}
        </button>

        <button
          onClick={handleCopyMd}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-all border border-transparent hover:border-border"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy Markdown'}
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-all border border-transparent hover:border-border"
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </button>

        <div className="w-px h-5 bg-border" />
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
