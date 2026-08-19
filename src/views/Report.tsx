import { useMemo, useState } from 'react';
import { FileText, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import type { Ticket, Category } from '../types';

interface ReportProps {
  tickets: Ticket[];
}

const DEPARTMENTS = ['All Departments', 'IT Service Desk', 'Human Resources', 'Finance Operations', 'Operations & Facilities'];

export function Report({ tickets }: ReportProps) {
  const [department, setDepartment] = useState('All Departments');
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);

  const scoped = useMemo(() => {
    if (department === 'All Departments') return tickets;
    return tickets.filter((t) => t.department === department);
  }, [tickets, department]);

  const report = useMemo(() => {
    const catCounts: Record<Category, number> = { IT: 0, HR: 0, Finance: 0, Operations: 0 };
    const statusCounts = { Open: 0, 'In Progress': 0, Resolved: 0, Escalated: 0 };
    let totalResponse = 0;
    let totalRisk = 0;

    scoped.forEach((t) => {
      catCounts[t.category]++;
      statusCounts[t.status]++;
      totalResponse += t.response_time_ms;
      totalRisk += t.risk_score;
    });

    const avgResponse = scoped.length ? (totalResponse / scoped.length / 1000).toFixed(1) : '0';
    const avgRisk = scoped.length ? Math.round(totalRisk / scoped.length) : 0;
    const resolutionRate = scoped.length ? Math.round((statusCounts.Resolved / scoped.length) * 100) : 0;
    const topCategory = (Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0])[0];

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 7);
    const periodEnd = new Date();

    return { catCounts, statusCounts, avgResponse, avgRisk, resolutionRate, topCategory, periodStart, periodEnd };
  }, [scoped]);

  function generateReport() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1200);
  }

  function downloadPDF() {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 48;
    let y = margin;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageH - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    // Header band
    pdf.setFillColor(15, 118, 110);
    pdf.rect(0, 0, pageW, 80, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('NexusDesk AI', margin, 38);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text('Weekly Business Report', margin, 56);
    pdf.setFontSize(9);
    pdf.text(`${department}`, pageW - margin, 38, { align: 'right' });
    pdf.text(`${report.periodStart.toLocaleDateString()} — ${report.periodEnd.toLocaleDateString()}`, pageW - margin, 56, { align: 'right' });
    y = 110;

    // Stats row
    const stats = [
      { label: 'Total Tickets', value: `${scoped.length}` },
      { label: 'Resolution Rate', value: `${report.resolutionRate}%` },
      { label: 'Avg Response', value: `${report.avgResponse}s` },
      { label: 'Avg Risk Score', value: `${report.avgRisk}/100` },
    ];
    const cardW = (pageW - margin * 2 - 24) / 4;
    stats.forEach((s, i) => {
      const x = margin + i * (cardW + 8);
      pdf.setFillColor(245, 247, 250);
      pdf.roundedRect(x, y, cardW, 60, 6, 6, 'F');
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(s.label.toUpperCase(), x + 12, y + 20);
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text(s.value, x + 12, y + 44);
    });
    y += 80;

    // Executive Summary
    ensureSpace(60);
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('Executive Summary', margin, y);
    y += 18;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(51, 65, 85);
    const summary = `During this reporting period, ${department.toLowerCase()} processed ${scoped.length} tickets with a resolution rate of ${report.resolutionRate}%. The ${report.topCategory} category generated the highest volume of requests. Average response time was ${report.avgResponse} seconds, and the mean compliance risk score was ${report.avgRisk}/100, indicating ${report.avgRisk > 30 ? 'elevated' : 'acceptable'} risk exposure across automated responses.`;
    const summaryLines = pdf.splitTextToSize(summary, pageW - margin * 2);
    ensureSpace(summaryLines.length * 14 + 10);
    pdf.text(summaryLines, margin, y);
    y += summaryLines.length * 14 + 16;

    // Category Breakdown
    ensureSpace(100);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Category Breakdown', margin, y);
    y += 20;
    (['IT', 'HR', 'Finance', 'Operations'] as Category[]).forEach((c) => {
      const count = report.catCounts[c];
      const pctVal = scoped.length ? (count / scoped.length) * 100 : 0;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      pdf.text(c, margin, y);
      pdf.setFillColor(226, 232, 240);
      pdf.roundedRect(margin + 60, y - 8, pageW - margin * 2 - 60 - 40, 10, 3, 3, 'F');
      pdf.setFillColor(15, 118, 110);
      pdf.roundedRect(margin + 60, y - 8, ((pageW - margin * 2 - 60 - 40) * pctVal) / 100, 10, 3, 3, 'F');
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${count}`, pageW - margin, y, { align: 'right' });
      y += 22;
    });
    y += 8;

    // Status Breakdown
    ensureSpace(100);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Status Breakdown', margin, y);
    y += 20;
    (['Open', 'In Progress', 'Resolved', 'Escalated'] as const).forEach((s) => {
      pdf.setFillColor(245, 247, 250);
      pdf.roundedRect(margin, y - 12, pageW - margin * 2, 28, 4, 4, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      pdf.text(s, margin + 12, y + 4);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${report.statusCounts[s]}`, pageW - margin - 12, y + 4, { align: 'right' });
      y += 34;
    });
    y += 8;

    // Key Insights
    ensureSpace(100);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Key Insights & Recommendations', margin, y);
    y += 20;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(51, 65, 85);
    const insights = [
      `${report.topCategory} generated the highest ticket volume this period.`,
      `Resolution rate of ${report.resolutionRate}% ${report.resolutionRate >= 80 ? 'meets' : 'is below'} the 80% service target.`,
      report.statusCounts.Escalated > 2 ? 'Escalation volume above normal — review incident patterns.' : 'Escalation volume within normal range.',
      report.avgRisk > 30 ? 'Schedule compliance review for sensitive data handling.' : 'No immediate compliance actions required.',
      `Consider capacity planning for ${report.topCategory} based on current trends.`,
    ];
    insights.forEach((insight) => {
      const lines = pdf.splitTextToSize(`•  ${insight}`, pageW - margin * 2);
      ensureSpace(lines.length * 14 + 6);
      pdf.text(lines, margin, y);
      y += lines.length * 14 + 6;
    });

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, pageH - 32, pageW - margin, pageH - 32);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Generated by NexusDesk AI Reporting Engine', margin, pageH - 18);
      pdf.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 18, { align: 'right' });
    }

    pdf.save(`nexusdesk-weekly-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-accent-500/30 bg-accent-500/10 p-2.5">
              <FileText size={22} className="text-accent-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Weekly Business Report</h2>
              <p className="mt-0.5 text-sm text-slate-400">Automated executive reporting with department-level customisation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setGenerated(false); }}
              className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-500"
            >
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={generateReport}
          disabled={generating}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {generating ? <><RefreshCw size={16} className="animate-spin" /> Generating...</> : <><CheckCircle2 size={16} /> Generate Report</>}
        </button>
        {generated && (
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 rounded-xl border border-good-500/40 bg-good-50 px-5 py-2.5 text-sm font-semibold text-good-600 transition hover:bg-good-100"
          >
            <Download size={16} /> Download PDF
          </button>
        )}
      </div>

      {generated && (
        <div className="animate-slide-up rounded-2xl border border-ink-700 bg-ink-900 p-8 text-slate-200 shadow-glow">
          <div className="border-b-2 border-ink-700 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">NexusDesk AI</h1>
                <p className="text-sm text-slate-400">Weekly Business Report</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>{department}</p>
                <p>{report.periodStart.toLocaleDateString()} — {report.periodEnd.toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Total Tickets', value: scoped.length },
              { label: 'Resolution Rate', value: `${report.resolutionRate}%` },
              { label: 'Avg Response', value: `${report.avgResponse}s` },
              { label: 'Avg Risk Score', value: `${report.avgRisk}/100` },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-ink-700 bg-ink-850 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-lg font-bold">Executive Summary</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              During this reporting period, the {department.toLowerCase()} processed <strong>{scoped.length} tickets</strong> with a resolution rate of{' '}
              <strong>{report.resolutionRate}%</strong>. The {report.topCategory} category generated the highest volume of requests.
              Average response time was <strong>{report.avgResponse} seconds</strong>, and the mean compliance risk score was{' '}
              <strong>{report.avgRisk}/100</strong>, indicating {report.avgRisk > 30 ? 'elevated' : 'acceptable'} risk exposure across automated responses.
            </p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-base font-bold">Category Breakdown</h3>
              <div className="space-y-2">
                {(['IT', 'HR', 'Finance', 'Operations'] as Category[]).map((c) => {
                  const count = report.catCounts[c];
                  const pctVal = scoped.length ? (count / scoped.length) * 100 : 0;
                  return (
                    <div key={c} className="flex items-center gap-3">
                      <span className="w-20 text-sm font-medium">{c}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-700">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pctVal}%` }} />
                      </div>
                      <span className="w-12 text-right text-sm font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-base font-bold">Status Breakdown</h3>
              <div className="space-y-2">
                {(['Open', 'In Progress', 'Resolved', 'Escalated'] as const).map((s) => (
                  <div key={s} className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-850 px-4 py-2">
                    <span className="text-sm font-medium">{s}</span>
                    <span className="text-sm font-bold">{report.statusCounts[s]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-base font-bold">Key Insights & Recommendations</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex gap-2"><span className="text-slate-300">•</span> {report.topCategory} generated the highest ticket volume this period.</li>
              <li className="flex gap-2"><span className="text-slate-300">•</span> Resolution rate of {report.resolutionRate}% {report.resolutionRate >= 80 ? 'meets' : 'is below'} the 80% service target.</li>
              {report.statusCounts.Escalated > 2 && <li className="flex gap-2"><span className="text-slate-300">•</span> Escalation volume above normal — review incident patterns.</li>}
              {report.avgRisk > 30 && <li className="flex gap-2"><span className="text-slate-300">•</span> Schedule compliance review for sensitive data handling.</li>}
              <li className="flex gap-2"><span className="text-slate-300">•</span> Consider capacity planning for {report.topCategory} based on current trends.</li>
            </ul>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-ink-700 pt-4 text-xs text-slate-500">
            <span>Generated by NexusDesk AI Reporting Engine</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
