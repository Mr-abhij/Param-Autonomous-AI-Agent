import ReactMarkdown from 'react-markdown';
import { Copy, Check, Download, Sparkles, FileDown, Printer, Mail, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { exportReportAsPDF } from '@/lib/exportPDF';

interface FinalReportProps {
  report: string;
}

export function FinalReport({ report }: FinalReportProps) {
  const [copied, setCopied] = useState(false);
  const [pdfState, setPdfState] = useState<'idle' | 'generating' | 'done'>('idle');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedSections, setSelectedSections] = useState({
    full: true,
    hotels: false,
    places: false,
    budget: false,
    restaurants: false,
  });
  const contentRef = useRef<HTMLDivElement>(null);

  if (!report) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-report-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (pdfState === 'generating') return;
    setPdfState('generating');
    try {
      await exportReportAsPDF(report);
      setPdfState('done');
      setTimeout(() => setPdfState('idle'), 2000);
    } catch (e) {
      console.error('PDF generation failed:', e);
      setPdfState('idle');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    if (!email.trim()) return;

    // Filter report based on selected sections
    let contentToSend = report;
    if (!selectedSections.full) {
      const sections: string[] = [];
      if (selectedSections.hotels) sections.push('hotels', 'accommodation', 'stay');
      if (selectedSections.places) sections.push('places', 'attractions', 'visit', 'sightseeing');
      if (selectedSections.budget) sections.push('budget', 'cost', 'price', 'money');
      if (selectedSections.restaurants) sections.push('restaurants', 'food', 'dining', 'eat');

      if (sections.length > 0) {
        const keywords = sections.join('|');
        const lines = report.split('\n').filter(line =>
          new RegExp(keywords, 'i').test(line)
        );
        contentToSend = lines.join('\n') || report;
      } else {
        contentToSend = report;
      }
    }

    // Use mailto link - opens email app with report pre-filled
    const subject = encodeURIComponent('PARAM Agent Report');
    const body = encodeURIComponent(contentToSend);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');

    setShowEmailModal(false);
    setEmail('');
    setSelectedSections({ full: true, hotels: false, places: false, budget: false, restaurants: false });
  };

  return (
    <div className="border border-primary/30 rounded-xl bg-card/80 overflow-hidden animate-slide-up shadow-[0_0_30px_hsl(var(--primary)/0.12)]">
      {/* Gradient top bar */}
      <div className="h-1 bg-gradient-to-r from-primary via-[hsl(162_72%_46%)] to-primary" />

      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-gradient-to-r from-primary/8 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/15 border border-primary/20 shadow-[0_0_10px_hsl(var(--primary)/0.2)]">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              Final Report
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-success/15 text-success border border-success/20">
                READY
              </span>
            </h3>
            <p className="text-[10px] text-muted-foreground">AI-generated comprehensive analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all px-2.5 py-1.5 rounded-lg hover:bg-secondary border border-transparent hover:border-border"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownloadMd}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all px-2.5 py-1.5 rounded-lg hover:bg-secondary border border-transparent hover:border-border"
          >
            <Download className="h-3.5 w-3.5" />
            .md
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all px-2.5 py-1.5 rounded-lg hover:bg-secondary border border-transparent hover:border-border"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all px-2.5 py-1.5 rounded-lg hover:bg-secondary border border-transparent hover:border-border"
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfState === 'generating'}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <FileDown className="h-3.5 w-3.5" />
            {pdfState === 'generating' ? 'Generating…' : pdfState === 'done' ? 'PDF Saved ✓' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div
        ref={contentRef}
        className="p-8 prose prose-invert prose-base max-w-none
          prose-headings:text-foreground
          prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:border-border prose-h1:pb-4 prose-h1:mb-8 prose-h1:mt-4
          prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-5 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/50
          prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-4
          prose-h4:text-base prose-h4:font-semibold prose-h4:mt-6 prose-h4:mb-3
          prose-p:text-secondary-foreground prose-p:leading-8 prose-p:mb-5 prose-p:text-sm
          prose-strong:text-foreground prose-strong:font-semibold
          prose-code:text-primary prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-xs
          prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4
          prose-ul:my-6 prose-ul:space-y-2.5 prose-ul:pl-6
          prose-ol:my-6 prose-ol:space-y-2.5 prose-ol:pl-6
          prose-li:text-secondary-foreground prose-li:marker:text-primary prose-li:leading-7 prose-li:text-sm
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-table:border prose-table:border-border prose-table:rounded-lg prose-table:overflow-hidden prose-table:my-8
          prose-thead:bg-muted/60
          prose-th:px-4 prose-th:py-3 prose-th:text-xs prose-th:font-semibold prose-th:text-foreground prose-th:border-b prose-th:border-border
          prose-td:px-4 prose-td:py-3 prose-td:text-sm prose-td:border-t prose-td:border-border/50
          prose-hr:border-border prose-hr:my-10
          prose-blockquote:border-l-4 prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:my-6 prose-blockquote:text-sm
        "
      >
        <ReactMarkdown>{report}</ReactMarkdown>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Send Report via Email</h3>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Your Email
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:bg-secondary/80 transition-all"
                />
              </div>

              {/* Section Selection */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  What to Send
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="section"
                      checked={selectedSections.full}
                      onChange={() => setSelectedSections({ full: true, hotels: false, places: false, budget: false, restaurants: false })}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Full Report</span>
                  </label>
                  <div className={`pl-7 space-y-2 ${selectedSections.full ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSections.hotels}
                        onChange={(e) => {
                          setSelectedSections(prev => ({ ...prev, full: false, hotels: e.target.checked }));
                        }}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">Hotels & Accommodation</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSections.places}
                        onChange={(e) => {
                          setSelectedSections(prev => ({ ...prev, full: false, places: e.target.checked }));
                        }}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">Places to Visit</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSections.budget}
                        onChange={(e) => {
                          setSelectedSections(prev => ({ ...prev, full: false, budget: e.target.checked }));
                        }}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">Budget & Costs</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSections.restaurants}
                        onChange={(e) => {
                          setSelectedSections(prev => ({ ...prev, full: false, restaurants: e.target.checked }));
                        }}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">Restaurants & Food</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendEmail}
                disabled={!email.trim()}
                className="w-full py-2.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Open Email App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
