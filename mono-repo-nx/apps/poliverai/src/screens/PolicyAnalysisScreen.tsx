import React from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  Download,
  FileCheck,
  FileText,
  RefreshCcw,
  Save,
  ShieldAlert,
  UploadCloud,
  WalletCards,
  X,
} from 'lucide-react-native';
import { CrossPlatformModal, EnterInstructionsModal, EnterTitleModal, InsufficientCreditsModal, appAlphaColors, appColors } from '@poliverai/shared-ui';
import { t, useAuth } from '@poliverai/intl';
import { brandAssets } from '@assets/brand';
import AppFooter from '../components/AppFooter';
import AppTopNav from '../components/AppTopNav';
import policyService, { type ReportDetail, type UploadFile } from '../services/policyService';
import { isDocumentPickerCancel, pickDocument } from '../lib/documentPicker';
import { getReportDownloadUrl } from '../lib/policyHelpers';
import type { ComplianceResult, Finding } from '../types/api';

type AnalysisTab = 'free' | 'full' | 'revised';
type SelectedFile = File | UploadFile;

const cardSurfaceShadow = Platform.select({
  web: {
    boxShadow: `0 12px 28px ${appAlphaColors.shadowCard}`,
  },
  macos: undefined,
  default: {
    shadowColor: appColors.ink900,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
});

const mutedCardShadow = Platform.select({
  web: {
    boxShadow: `0 8px 18px ${appAlphaColors.shadowSoft}`,
  },
  macos: undefined,
  default: {
    shadowColor: appColors.ink900,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
});

function formatBytes(bytes?: number | null) {
  const value = Number(bytes ?? 0);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function verdictLabel(value?: string | null) {
  return String(value ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function confidencePct(value?: number | null) {
  return `${Math.round(Number(value ?? 0) * 100)}%`;
}

function percentValue(value?: number | null) {
  return `${Math.round(Number(value ?? 0))}%`;
}

function severityTone(severity?: string | null) {
  switch (String(severity ?? '').toLowerCase()) {
    case 'high':
      return { bg: appColors.red100, text: appColors.red700, label: 'HIGH' };
    case 'medium':
      return { bg: appColors.yellow100, text: appColors.amber700, label: 'MEDIUM' };
    default:
      return { bg: appColors.green100, text: appColors.green700, label: 'LOW' };
  }
}

function statusDialogFromError(err: unknown, fallbackTitle: string) {
  return {
    title: fallbackTitle,
    message: err instanceof Error ? err.message : 'Something went wrong.',
    tone: 'danger' as const,
  };
}

function asFinding(value: Record<string, unknown>): Finding {
  const rawSeverity = String(value.severity ?? 'low').toLowerCase();
  const severity: Finding['severity'] =
    rawSeverity === 'high' || rawSeverity === 'medium' || rawSeverity === 'low' ? rawSeverity : 'low';

  return {
    article: String(value.article ?? ''),
    issue: String(value.issue ?? ''),
    severity,
    confidence: Number(value.confidence ?? 0),
  };
}

function detailSummary(detail: ReportDetail | null, fallback?: string | null) {
  if (!detail?.content) return fallback ?? 'No summary available.';
  const trimmed = detail.content.trim();
  if (trimmed.startsWith('%PDF-')) return fallback ?? 'No summary available.';
  if (!trimmed) return fallback ?? 'No summary available.';
  return trimmed.length > 320 ? `${trimmed.slice(0, 317)}...` : trimmed;
}

function recommendationText(value: Record<string, unknown>) {
  const suggestion = String(value.suggestion ?? value.recommendation ?? '').trim();
  const article = String(value.article ?? '').trim();
  if (suggestion && article) return `${suggestion} (${article})`;
  return suggestion || article || 'Recommendation available';
}

function ReportBrandMark() {
  return (
    <View style={styles.reportBrandWrap}>
      <View style={styles.reportBrandCard}>
        <Image source={brandAssets.poliveraiLogo} style={styles.reportBrandImage} resizeMode="contain" />
      </View>
    </View>
  );
}

function evidenceExcerpt(value: Record<string, unknown>) {
  return String(value.policy_excerpt ?? value.excerpt ?? value.text ?? '').trim();
}

function isStructuredFullReport(value: ReportDetail | null) {
  if (!value) return false;
  if ((value.findings?.length ?? 0) > 0) return true;
  if ((value.recommendations?.length ?? 0) > 0) return true;
  if (value.metrics && Object.keys(value.metrics).length > 0) return true;
  const content = typeof value.content === 'string' ? value.content.trim() : '';
  if (content && !content.startsWith('%PDF-')) return true;
  return false;
}

function buildInlineSaveContent(result: ComplianceResult | null, detailedContent: string | null) {
  if (detailedContent) return detailedContent;
  if (!result) return '';

  const lines: string[] = [];
  lines.push('# Compliance Report');
  lines.push('');
  lines.push(`Verdict: ${verdictLabel(result.verdict)}`);
  lines.push(`Score: ${percentValue(result.score)}`);
  lines.push(`Confidence: ${confidencePct(result.confidence)}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(result.summary);
  lines.push('');

  if (result.findings?.length) {
    lines.push('## Top Findings');
    result.findings.forEach((finding) => {
      lines.push(`- ${finding.article}: ${finding.issue} (confidence ${confidencePct(finding.confidence)})`);
    });
  }

  return lines.join('\n');
}

function ScoreStars({ score }: { score?: number | null }) {
  const rounded = Math.max(0, Math.min(5, Math.round((Number(score ?? 0) / 100) * 5)));
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Text key={index} style={[styles.starGlyph, index < rounded ? styles.starGlyphActive : null]}>
          ★
        </Text>
      ))}
      <Text style={styles.starPercent}>{percentValue(score)}</Text>
    </View>
  );
}

function FindingPill({ finding }: { finding: Finding }) {
  const tone = severityTone(finding.severity);
  return (
    <View style={styles.sidebarFindingItem}>
      <View style={[styles.sidebarSeverityPill, { backgroundColor: tone.bg }]}>
        <Text style={[styles.sidebarSeverityPillText, { color: tone.text }]}>{tone.label}</Text>
      </View>
      <Text style={styles.sidebarFindingArticle}>{finding.article}</Text>
      <Text style={styles.sidebarFindingIssue}>{finding.issue}</Text>
    </View>
  );
}

function PanelAction({
  label,
  onPress,
  icon,
  variant = 'secondary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.panelAction,
        variant === 'primary' ? styles.panelActionPrimary : null,
        variant === 'secondary' ? styles.panelActionSecondary : null,
        variant === 'danger' ? styles.panelActionDanger : null,
        variant === 'ghost' ? styles.panelActionGhost : null,
        disabled ? styles.panelActionDisabled : null,
      ]}
    >
      <View style={styles.panelActionInner}>
        {icon ? <View style={styles.panelActionIcon}>{icon}</View> : null}
        <Text
          style={[
            styles.panelActionText,
            variant === 'primary' ? styles.panelActionTextPrimary : null,
            variant === 'secondary' ? styles.panelActionTextSecondary : null,
            variant === 'danger' ? styles.panelActionTextDanger : null,
            variant === 'ghost' ? styles.panelActionTextGhost : null,
            disabled ? styles.panelActionTextDisabled : null,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function PolicyAnalysisScreen() {
  const { isAuthenticated = false, loading = false, refreshUser } = useAuth() as unknown as {
    isAuthenticated?: boolean;
    loading?: boolean;
    refreshUser?: () => Promise<void>;
  };
  const { width } = useWindowDimensions();
  const [contentWidth, setContentWidth] = React.useState(0);
  const effectiveWidth = contentWidth > 0 ? contentWidth : width;
  const isDesktop = effectiveWidth >= 1100;
  const isWideFullReport = effectiveWidth >= 1200;
  const handleContentLayout = React.useCallback((nextWidth: number) => {
    setContentWidth((current) => (Math.abs(current - nextWidth) > 1 ? nextWidth : current));
  }, []);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const progressIntervalRef = React.useRef<number | null>(null);

  const [file, setFile] = React.useState<SelectedFile | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [message, setMessage] = React.useState('');
  const [result, setResult] = React.useState<ComplianceResult | null>(null);
  const [reportFilename, setReportFilename] = React.useState<string | null>(null);
  const [revisedReportFilename, setRevisedReportFilename] = React.useState<string | null>(null);
  const [userReportsCount, setUserReportsCount] = React.useState<number | null>(null);
  const [detailedReport, setDetailedReport] = React.useState<ReportDetail | null>(null);
  const [detailedContent, setDetailedContent] = React.useState<string | null>(null);
  const [revisedPolicy, setRevisedPolicy] = React.useState<ReportDetail | null>(null);
  const [activeTab, setActiveTab] = React.useState<AnalysisTab>('free');
  const [loadingDetailed, setLoadingDetailed] = React.useState(false);
  const [loadingRevised, setLoadingRevised] = React.useState(false);
  const [titleModalOpen, setTitleModalOpen] = React.useState(false);
  const [instructionsModalOpen, setInstructionsModalOpen] = React.useState(false);
  const [insufficientOpen, setInsufficientOpen] = React.useState(false);
  const [statusDialog, setStatusDialog] = React.useState<null | { title: string; message: string; tone: 'success' | 'danger' }>(null);

  const isBusyFree = progress > 0 && progress < 100;
  const isBusyCurrentTab = activeTab === 'full' ? loadingDetailed : activeTab === 'revised' ? loadingRevised : isBusyFree;
  const findingsCount = result?.findings?.length ?? 0;
  const currentFilename = activeTab === 'revised' ? revisedReportFilename : reportFilename;
  const currentDownloadUrl = currentFilename ? getReportDownloadUrl(currentFilename) : null;
  const fullReportSource = React.useMemo(() => {
    if (isStructuredFullReport(detailedReport)) {
      return {
        verdict: detailedReport?.verdict ?? result?.verdict,
        score: detailedReport?.score ?? result?.score,
        confidence: result?.confidence,
        summary: detailSummary(detailedReport, result?.summary),
        findings: (detailedReport?.findings?.length ? detailedReport.findings : result?.findings) ?? [],
        recommendations: (detailedReport?.recommendations?.length ? detailedReport.recommendations : result?.recommendations) ?? [],
        evidence: result?.evidence ?? [],
        metrics: detailedReport?.metrics ?? result?.metrics ?? { total_violations: 0, total_fulfills: 0, critical_violations: 0 },
      } as const;
    }

    if (result) {
      return {
        verdict: result.verdict,
        score: result.score,
        confidence: result.confidence,
        summary: result.summary,
        findings: result.findings ?? [],
        recommendations: result.recommendations ?? [],
        evidence: result.evidence ?? [],
        metrics: result.metrics ?? { total_violations: 0, total_fulfills: 0, critical_violations: 0 },
      } as const;
    }

    return null;
  }, [detailedReport, result]);
  const revisedContent = revisedPolicy?.content ?? detailedContent;
  const selectedFileSize = file && 'size' in file && typeof file.size === 'number' ? file.size : null;

  const stopIndeterminateProgress = React.useCallback(() => {
    if (progressIntervalRef.current !== null && typeof window !== 'undefined') {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const startIndeterminateProgress = React.useCallback((initialMessage: string) => {
    setMessage(initialMessage);
    setProgress(5);
    stopIndeterminateProgress();

    if (typeof window !== 'undefined') {
      progressIntervalRef.current = window.setInterval(() => {
        setProgress((current) => {
          if (current >= 90) return current;
          const increment = current < 50 ? Math.floor(Math.random() * 6) + 4 : Math.floor(Math.random() * 3) + 1;
          return Math.min(90, current + increment);
        });
      }, 320);
    }
  }, [stopIndeterminateProgress]);

  const refreshReportsCount = React.useCallback(async () => {
    try {
      const count = await policyService.getUserReportsCount();
      setUserReportsCount(count ?? 0);
    } catch {
      setUserReportsCount(0);
    }
  }, []);

  React.useEffect(() => {
    void refreshReportsCount();
    return () => {
      stopIndeterminateProgress();
    };
  }, [refreshReportsCount, stopIndeterminateProgress]);

  const openExternal = React.useCallback(async (url: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
  }, []);

  const loadDetailed = React.useCallback(async (filename: string, mode: 'full' | 'revised') => {
    if (!filename) return;

    if (mode === 'full') setLoadingDetailed(true);
    else setLoadingRevised(true);

    try {
      const detail = await policyService.getDetailedReport(filename);
      if (mode === 'full') {
        setDetailedReport(detail);
        setDetailedContent(detail.content ?? null);
      } else {
        setRevisedPolicy(detail);
      }
      setProgress(100);
      setMessage('Loaded');
    } catch (err) {
      if (mode === 'full') setDetailedReport(null);
      else setRevisedPolicy(null);
      setStatusDialog(statusDialogFromError(err, 'Failed to load report'));
    } finally {
      if (mode === 'full') setLoadingDetailed(false);
      else setLoadingRevised(false);
    }
  }, []);

  const handleAnalyze = React.useCallback(async () => {
    if (!file) return;

    setActiveTab('free');
    setResult(null);
    setReportFilename(null);
    setRevisedReportFilename(null);
    setDetailedReport(null);
    setDetailedContent(null);
    setRevisedPolicy(null);
    startIndeterminateProgress('Analyzing');

    try {
      const analysis = await policyService.analyzePolicyStreaming(file as unknown as UploadFile, 'fast', (nextProgress, nextMessage) => {
        if (typeof nextProgress === 'number') setProgress(nextProgress);
        if (nextMessage) setMessage(nextMessage);
      });
      stopIndeterminateProgress();
      setResult(analysis);
      setMessage('Completed');
      setProgress(100);
      await Promise.allSettled([refreshUser?.(), refreshReportsCount()]);
    } catch (err) {
      stopIndeterminateProgress();
      setProgress(0);
      setMessage(err instanceof Error ? err.message : 'Analysis failed');
      setStatusDialog(statusDialogFromError(err, 'Analysis failed'));
    }
  }, [file, refreshReportsCount, refreshUser, startIndeterminateProgress, stopIndeterminateProgress]);

  const handleGenerateFullReport = React.useCallback(async () => {
    if (!result) return;

    setActiveTab('full');
    startIndeterminateProgress('Generating full report');

    try {
      const response = await policyService.generateVerificationReport(result, file?.name ?? 'policy', 'balanced');
      const inlineDetail = response as Record<string, unknown>;
      const looksStructured =
        Array.isArray(inlineDetail.findings) ||
        Array.isArray(inlineDetail.recommendations) ||
        typeof inlineDetail.verdict === 'string' ||
        (typeof inlineDetail.content === 'string' && !String(inlineDetail.content).trim().startsWith('%PDF-'));

      if (looksStructured) {
        const detail = response as unknown as ReportDetail;
        setDetailedReport(detail);
        setDetailedContent(typeof detail.content === 'string' && !detail.content.trim().startsWith('%PDF-') ? detail.content : null);
        if (detail.filename) setReportFilename(detail.filename);
      } else {
        const filename = (response as { filename?: string }).filename;
        if (filename) {
          setReportFilename(filename);
          await loadDetailed(filename, 'full');
        }
      }
      stopIndeterminateProgress();
      setProgress(100);
      setMessage('Full report generated');
      await Promise.allSettled([refreshUser?.(), refreshReportsCount()]);
      setStatusDialog({
        title: 'Full report generated',
        message: 'Your detailed compliance report is ready.',
        tone: 'success',
      });
    } catch (err) {
      stopIndeterminateProgress();
      try {
        const maybe = err as { status?: number };
        if (maybe?.status === 402) setInsufficientOpen(true);
      } catch {}
      setStatusDialog(statusDialogFromError(err, 'Full report generation failed'));
    }
  }, [file?.name, loadDetailed, refreshReportsCount, refreshUser, result, startIndeterminateProgress, stopIndeterminateProgress]);

  const handleGenerateRevision = React.useCallback(async (instructions?: string) => {
    if (!result) return;

    setActiveTab('revised');
    startIndeterminateProgress('Generating revised policy');

    try {
      const original = file && 'text' in file ? await file.text() : '';
      const response = await policyService.generatePolicyRevision(
        original,
        result.findings as unknown as Record<string, unknown>[],
        result.recommendations as unknown as Record<string, unknown>[],
        result.evidence as unknown as Record<string, unknown>[],
        file?.name ?? 'policy',
        'comprehensive',
        instructions
      );
      if (response?.filename) {
        setRevisedReportFilename(response.filename);
        await loadDetailed(response.filename, 'revised');
      }
      stopIndeterminateProgress();
      setProgress(100);
      setMessage('Revised policy generated');
      await Promise.allSettled([refreshUser?.(), refreshReportsCount()]);
      setStatusDialog({
        title: 'Revised policy generated',
        message: 'Your revised policy draft is ready for review.',
        tone: 'success',
      });
    } catch (err) {
      stopIndeterminateProgress();
      try {
        const maybe = err as { status?: number };
        if (maybe?.status === 402) setInsufficientOpen(true);
      } catch {}
      setStatusDialog(statusDialogFromError(err, 'Revision failed'));
    }
  }, [file, loadDetailed, refreshReportsCount, refreshUser, result, startIndeterminateProgress, stopIndeterminateProgress]);

  const handleSaveReport = React.useCallback(async (title?: string) => {
    try {
      if (reportFilename) {
        await policyService.saveReport(reportFilename, title ?? file?.name ?? undefined, { is_quick: !detailedReport });
      } else {
        const content = buildInlineSaveContent(result, detailedContent);
        const saved = await policyService.saveReportInline(content, undefined, title ?? file?.name ?? undefined, { is_quick: true, save_type: 'regular' });
        if (saved?.filename) setReportFilename(saved.filename);
      }
      await refreshReportsCount();
      setStatusDialog({
        title: 'Report saved',
        message: 'Your report has been saved successfully.',
        tone: 'success',
      });
    } catch (err) {
      setStatusDialog(statusDialogFromError(err, 'Save failed'));
    } finally {
      setTitleModalOpen(false);
    }
  }, [detailedContent, detailedReport, file?.name, refreshReportsCount, reportFilename, result]);

  const handleReset = React.useCallback(() => {
    stopIndeterminateProgress();
    setFile(null);
    setProgress(0);
    setMessage('');
    setResult(null);
    setReportFilename(null);
    setRevisedReportFilename(null);
    setDetailedReport(null);
    setDetailedContent(null);
    setRevisedPolicy(null);
    setActiveTab('free');
  }, [stopIndeterminateProgress]);

  const triggerBrowse = React.useCallback(() => {
    void pickDocument({
      allowedExtensions: ['pdf', 'docx', 'html', 'xhtml', 'txt'],
      types: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/html',
        'application/xhtml+xml',
        'text/plain',
      ],
    })
      .then((picked) => {
        if (picked.file) {
          setFile(picked.file);
          return;
        }

        setFile({
          uri: picked.uri ?? '',
          name: picked.name ?? 'policy',
          type: picked.type ?? 'application/octet-stream',
        });
      })
      .catch((err) => {
        if (!isDocumentPickerCancel(err)) {
          setStatusDialog(statusDialogFromError(err, 'Unable to open file picker'));
        }
      });
  }, []);

  const onFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
  }, []);

  const handleDownload = React.useCallback(async () => {
    if (!currentDownloadUrl) return;
    await openExternal(currentDownloadUrl);
  }, [currentDownloadUrl, openExternal]);

  const renderFreeTab = () => {
    if (isBusyCurrentTab) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingStateTitle}>Analyzing policy...</Text>
          <Text style={styles.loadingStateBody}>{message || 'Streaming results from the backend.'}</Text>
        </View>
      );
    }

    if (!result) {
      return (
        <View style={styles.emptyState}>
          <ShieldAlert size={34} color="#94a3b8" />
          <Text style={styles.emptyStateTitle}>No analysis yet</Text>
          <Text style={styles.emptyStateBody}>Upload a policy file and run the analysis to see the result preview here.</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabScrollContent}>
        <View style={styles.heroRow}>
          <View>
            <View style={styles.metricCaptionRow}>
              <CheckCircle2 size={15} color="#16a34a" />
              <Text style={styles.metricCaption}>Verdict</Text>
            </View>
            <Text style={styles.heroTitle}>{verdictLabel(result.verdict)}</Text>
            <Text style={styles.heroSubtext}>Confidence: {confidencePct(result.confidence)}</Text>
          </View>

          <View>
            <Text style={styles.metricCaption}>Score</Text>
            <ScoreStars score={result.score} />
          </View>
        </View>

        <Text style={styles.summaryText}>{result.summary}</Text>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeadingRow}>
            <AlertTriangle size={17} color="#dc2626" />
            <Text style={styles.sectionHeading}>Top Findings</Text>
          </View>
          {result.findings?.length ? (
            result.findings.slice(0, 6).map((finding, index) => (
              <View key={`${finding.article}-${index}`} style={styles.findingCard}>
                <Text style={styles.findingArticle}>{finding.article}</Text>
                <Text style={styles.findingIssue}>{finding.issue}</Text>
                <Text style={styles.findingConfidence}>Confidence: {confidencePct(finding.confidence)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.mutedBody}>No findings detected.</Text>
          )}
        </View>

        <ReportBrandMark />
      </ScrollView>
    );
  };

  const renderFullTab = () => {
    if (loadingDetailed) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingStateTitle}>Loading full report...</Text>
        </View>
      );
    }

    if (!fullReportSource) {
      return (
        <View style={styles.emptyState}>
          <FileCheck size={34} color="#94a3b8" />
          <Text style={styles.emptyStateTitle}>No full report generated yet</Text>
          <Text style={styles.emptyStateBody}>Generate a full report to see the detailed compliance dashboard.</Text>
        </View>
      );
    }

    const metrics = fullReportSource.metrics ?? { total_violations: 0, total_fulfills: 0, critical_violations: 0 };
    const fullFindings = (fullReportSource.findings ?? []).map((item) => asFinding(item as Record<string, unknown>));
    const recommendations = (fullReportSource.recommendations ?? []) as Array<Record<string, unknown>>;
    const evidence = (fullReportSource.evidence ?? []) as unknown as Array<Record<string, unknown>>;
    const fullConfidence = Number(fullReportSource.confidence ?? 0);

    return (
      <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabScrollContent}>
        <View style={styles.heroRow}>
          <View>
            <View style={styles.metricCaptionRow}>
              <CheckCircle2 size={15} color="#16a34a" />
              <Text style={styles.metricCaption}>Verdict</Text>
            </View>
            <Text style={styles.heroTitle}>{verdictLabel(fullReportSource.verdict)}</Text>
            <Text style={styles.heroSubtext}>Confidence: {confidencePct(fullConfidence)}</Text>
          </View>
          <View>
            <Text style={styles.metricCaption}>Score</Text>
            <ScoreStars score={fullReportSource.score} />
          </View>
        </View>

        <View style={[styles.fullGrid, isWideFullReport ? styles.fullGridDesktop : styles.fullGridMobile]}>
          <View style={[styles.fullMainColumn, isWideFullReport ? styles.fullMainColumnDesktop : null]}>
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeadingRow}>
                <FileText size={17} color="#475569" />
                <Text style={styles.sectionHeading}>Summary</Text>
              </View>
              <Text style={styles.summaryText}>{String(fullReportSource.summary ?? result?.summary ?? 'No summary available.')}</Text>
            </View>

            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeadingRow}>
                <AlertTriangle size={17} color="#dc2626" />
                <Text style={styles.sectionHeading}>Top Findings</Text>
              </View>
              {fullFindings.length ? (
                fullFindings.map((finding, index) => {
                  const tone = severityTone(finding.severity);
                  return (
                    <View key={`${finding.article}-${index}`} style={styles.fullFindingCard}>
                      <View style={[styles.fullFindingBadge, { backgroundColor: tone.bg }]}>
                        <Text style={[styles.fullFindingBadgeText, { color: tone.text }]}>{tone.label}</Text>
                      </View>
                      <Text style={styles.findingArticle}>{finding.article}</Text>
                      <Text style={styles.findingIssue}>{finding.issue}</Text>
                      <Text style={styles.findingConfidence}>Confidence: {confidencePct(finding.confidence)}</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.mutedBody}>No findings detected.</Text>
              )}
            </View>

            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeadingRow}>
                <Bot size={17} color="#ca8a04" />
                <Text style={styles.sectionHeading}>Recommendations</Text>
              </View>
              {recommendations.length ? (
                recommendations.map((recommendation, index) => (
                  <Text key={`${String(recommendation.article ?? 'recommendation')}-${index}`} style={styles.recommendationItem}>
                    • {recommendationText(recommendation)}
                  </Text>
                ))
              ) : (
                <Text style={styles.mutedBody}>No recommendations available.</Text>
              )}
            </View>
          </View>

          <View style={[styles.fullSideColumn, isWideFullReport ? styles.fullSideColumnDesktop : styles.fullSideColumnMobile]}>
            <View style={styles.metricsCard}>
              <View style={styles.sectionHeadingRow}>
                <BarChart3 size={17} color="#2563eb" />
                <Text style={styles.sectionHeading}>Metrics</Text>
              </View>
              <Text style={styles.metricLine}>Total violations: {String(metrics.total_violations ?? 0)}</Text>
              <Text style={styles.metricLine}>Requirements met: {String(metrics.total_fulfills ?? 0)}</Text>
              <Text style={styles.metricLineDanger}>Critical violations: {String(metrics.critical_violations ?? 0)}</Text>
            </View>

            <View style={styles.metricsCard}>
              <View style={styles.sectionHeadingRow}>
                <FileText size={17} color="#64748b" />
                <Text style={styles.sectionHeading}>Evidence ({evidence.length})</Text>
              </View>
              {evidence.length ? (
                evidence.slice(0, 6).map((item, index) => (
                  <View key={`${String(item.article ?? 'evidence')}-${index}`} style={styles.evidenceCard}>
                    <Text style={styles.evidenceArticle}>{String(item.article ?? '')}</Text>
                    <Text style={styles.evidenceExcerpt}>{evidenceExcerpt(item) || 'Evidence available in generated report.'}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.mutedBody}>No evidence excerpts.</Text>
              )}
            </View>
          </View>
        </View>

        <ReportBrandMark />
      </ScrollView>
    );
  };

  const renderRevisedTab = () => {
    if (loadingRevised) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingStateTitle}>Loading revised policy...</Text>
        </View>
      );
    }

    if (!revisedContent && !revisedReportFilename) {
      return (
        <View style={styles.emptyState}>
          <Bot size={34} color="#94a3b8" />
          <Text style={styles.emptyStateTitle}>No revised policy yet</Text>
          <Text style={styles.emptyStateBody}>Generate a revised policy after creating a full report.</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabScrollContent}>
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeadingRow}>
            <Bot size={17} color="#7c3aed" />
            <Text style={styles.sectionHeading}>Revised Policy Preview</Text>
          </View>
          {revisedContent ? (
            <Text style={styles.revisedContent}>{revisedContent}</Text>
          ) : (
            <Text style={styles.mutedBody}>The revised policy was generated. Use Download File to open the saved document.</Text>
          )}
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <AppTopNav currentRoute="analyze" />
        <View style={styles.authState}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.authStateText}>Loading...</Text>
        </View>
        <AppFooter />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <AppTopNav currentRoute="analyze" />
        <View style={styles.authState}>
          <Text style={styles.authStateTitle}>Sign in required</Text>
          <Text style={styles.authStateText}>Please sign in to analyze your policy.</Text>
        </View>
        <AppFooter />
      </View>
    );
  }

  return (
    <View
      style={styles.screen}
      onLayout={(event) => handleContentLayout(event.nativeEvent.layout.width)}
    >
      <AppTopNav currentRoute="analyze" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pageWrap}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.pageTitle}>Policy Analysis</Text>
            </View>

            <View style={styles.topActions}>
              <PanelAction label="Reset" onPress={handleReset} icon={<RefreshCcw size={15} color="#ffffff" />} variant="danger" disabled={!file && !result && !reportFilename} />
              <PanelAction label="Full Report" onPress={() => { void handleGenerateFullReport() }} icon={<FileCheck size={15} color="#ffffff" />} variant="primary" disabled={!result} />
              <PanelAction label="Save" onPress={() => setTitleModalOpen(true)} icon={<Save size={15} color="#ffffff" />} variant="primary" disabled={!result && !reportFilename} />
              {reportFilename ? (
                <PanelAction label="Revised Policy" onPress={() => setInstructionsModalOpen(true)} icon={<Bot size={15} color="#ffffff" />} variant="secondary" disabled={!result} />
              ) : null}
            </View>
          </View>

          {(file || result || reportFilename) ? (
            <View style={styles.workInProgressPill}>
              <Text style={styles.workInProgressText}>Work In Progress</Text>
            </View>
          ) : null}

          <View style={[styles.mainGrid, isDesktop ? styles.mainGridDesktop : styles.mainGridMobile]}>
            <View style={[styles.sidebar, isDesktop ? styles.sidebarDesktop : styles.sidebarMobile]}>
              {Platform.OS === 'web' ? (
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.html,.htm,.txt"
                  style={{ display: 'none' }}
                  onChange={onFileChange}
                />
              ) : null}

              <Text style={styles.uploadLabel}>Upload policy</Text>
              <Pressable style={styles.uploadZone} onPress={triggerBrowse}>
                <UploadCloud size={34} color="#2563eb" />
                <Text style={styles.uploadZoneTitle}>Drag & drop a policy file here, or click to browse</Text>
                <Text style={styles.uploadZoneMeta}>Supports PDF, DOCX, HTML, TXT</Text>
                <View style={styles.uploadActions}>
                  <PanelAction label="Browse files" onPress={triggerBrowse} icon={<UploadCloud size={15} color="#ffffff" />} variant="primary" />
                  {file ? <PanelAction label="Remove" onPress={() => setFile(null)} icon={<X size={15} color="#475569" />} variant="ghost" /> : null}
                </View>
              </Pressable>

              {file ? (
                <View style={styles.selectedFileCard}>
                  <Text style={styles.selectedFileLabel}>Selected file</Text>
                  <Text style={styles.selectedFileMeta}>{file.name} • {formatBytes(selectedFileSize)} • {file.type || 'document'}</Text>
                </View>
              ) : null}

              <View style={styles.sidebarBlock}>
                <PanelAction label="Analyze" onPress={() => { void handleAnalyze() }} icon={<FileText size={15} color="#ffffff" />} variant="primary" disabled={!file} />
              </View>

              <View style={styles.sidebarBlock}>
                <View style={styles.sectionHeadingRow}>
                  <FileText size={17} color="#64748b" />
                  <Text style={styles.sectionHeading}>Summary</Text>
                </View>
                <Text style={styles.sidebarSummary}>{result?.summary || 'No report generated yet'}</Text>
              </View>

              <View style={styles.sidebarBlock}>
                <View style={styles.sectionHeadingRow}>
                  <AlertTriangle size={17} color="#dc2626" />
                  <Text style={styles.sectionHeading}>Findings ({findingsCount})</Text>
                </View>
                {result?.findings?.length ? (
                  result.findings.map((finding, index) => <FindingPill key={`${finding.article}-${index}`} finding={finding} />)
                ) : (
                  <Text style={styles.mutedBody}>No findings yet.</Text>
                )}
              </View>

              <View style={styles.sidebarBlock}>
                <Text style={styles.sectionHeading}>Total Saved Past Reports ({userReportsCount ?? 0} total)</Text>
                <Text style={styles.sidebarSummary}>{reportFilename || 'No report generated yet'}</Text>
              </View>
            </View>

            <View style={[styles.mainPanel, isDesktop ? styles.mainPanelDesktop : styles.mainPanelMobile]}>
              <View style={styles.mainPanelHeader}>
                <View>
                  <Text style={styles.mainPanelEyebrow}>{activeTab === 'free' ? 'Free Analysis Result' : activeTab === 'full' ? 'Detailed Compliance Dashboard' : 'Revised Policy Preview'}</Text>
                  <Text style={styles.mainPanelTitle}>Result Broken Down / Report Preview</Text>
                </View>
                <View style={styles.mainPanelMeta}>
                  <Text style={styles.mainPanelMetaText}>{verdictLabel(result?.verdict || detailedReport?.verdict || revisedPolicy?.verdict || 'Pending')}</Text>
                  <Text style={styles.mainPanelMetaText}>•</Text>
                  <Text style={styles.mainPanelMetaText}>Score {Math.round(Number(result?.score ?? detailedReport?.score ?? 0))}</Text>
                </View>
              </View>

              {progress > 0 ? (
                <View style={styles.progressWrap}>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${Math.max(4, Math.min(100, progress))}%` }]} />
                  </View>
                  <View style={styles.progressInfoRow}>
                    <Text style={styles.progressLabel}>{message || 'Completed'}</Text>
                    <Text style={styles.progressPercent}>{progress}%</Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.tabRow}>
                {(['free', 'full', 'revised'] as AnalysisTab[]).map((tab) => (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tabButton, activeTab === tab ? styles.tabButtonActive : null]}
                  >
                    <View style={styles.tabButtonInner}>
                      {tab === 'free' ? <WalletCards size={15} color={activeTab === tab ? '#1d4ed8' : appColors.slate600} /> : null}
                      {tab === 'full' ? <FileCheck size={15} color={activeTab === tab ? '#1d4ed8' : appColors.slate600} /> : null}
                      {tab === 'revised' ? <Bot size={15} color={activeTab === tab ? '#1d4ed8' : appColors.slate600} /> : null}
                      <Text style={[styles.tabButtonText, activeTab === tab ? styles.tabButtonTextActive : null]}>
                        {tab === 'free' ? 'Free' : tab === 'full' ? 'Full' : 'Revised'}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              <View style={styles.mainPanelToolbar}>
                <PanelAction label="Download File" onPress={() => { void handleDownload() }} icon={<Download size={15} color="#ffffff" />} variant="primary" disabled={!currentDownloadUrl} />
              </View>

              <View style={styles.tabContainer}>
                {activeTab === 'free' ? renderFreeTab() : activeTab === 'full' ? renderFullTab() : renderRevisedTab()}
              </View>
            </View>
          </View>
        </View>
        <AppFooter />
      </ScrollView>

      <EnterTitleModal open={titleModalOpen} initial={file?.name ?? ''} onClose={() => setTitleModalOpen(false)} onConfirm={async (title?: string) => { await handleSaveReport(title); }} />
      <EnterInstructionsModal open={instructionsModalOpen} initial="" onClose={() => setInstructionsModalOpen(false)} onConfirm={async (instructions?: string) => { await handleGenerateRevision(instructions); setInstructionsModalOpen(false); }} />
      <InsufficientCreditsModal open={insufficientOpen} onClose={() => setInsufficientOpen(false)} />

      <CrossPlatformModal open={Boolean(statusDialog)} animationType="fade" onRequestClose={() => setStatusDialog(null)}>
        <Pressable style={styles.dialogBackdrop} onPress={() => setStatusDialog(null)}>
          <Pressable style={styles.dialogCard} onPress={() => undefined}>
            <Text style={styles.dialogTitle}>{statusDialog?.title}</Text>
            <Text style={styles.dialogBody}>{statusDialog?.message}</Text>
            <View style={styles.dialogActions}>
              <PanelAction
                label="Close"
                onPress={() => setStatusDialog(null)}
                icon={statusDialog?.tone === 'danger' ? <X size={15} color="#1e293b" /> : <CheckCircle2 size={15} color="#ffffff" />}
                variant={statusDialog?.tone === 'danger' ? 'secondary' : 'primary'}
              />
            </View>
          </Pressable>
        </Pressable>
      </CrossPlatformModal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appColors.sky50,
  },
  content: {
    width: '100%',
  },
  pageWrap: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  pageTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: appColors.ink900,
  },
  topActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  workInProgressPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: appColors.yellow100,
  },
  workInProgressText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  mainGrid: {
    alignItems: 'flex-start',
    gap: 22,
  },
  mainGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  mainGridMobile: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  sidebar: {
    backgroundColor: appColors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#dbe7f5',
    padding: 20,
    gap: 16,
    ...cardSurfaceShadow,
  },
  sidebarDesktop: {
    width: 360,
    flexShrink: 0,
  },
  sidebarMobile: {
    width: '100%',
    maxWidth: '100%',
  },
  uploadLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: appColors.ink900,
  },
  uploadZone: {
    minHeight: 220,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  uploadZoneTitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: appColors.ink900,
  },
  uploadZoneMeta: {
    textAlign: 'center',
    fontSize: 13,
    color: appColors.slate500,
  },
  uploadActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 8,
  },
  selectedFileCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: appColors.sky50,
    borderWidth: 1,
    borderColor: '#dbe7f5',
    gap: 4,
  },
  selectedFileLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.slate700,
  },
  selectedFileMeta: {
    fontSize: 13,
    lineHeight: 20,
    color: appColors.slate600,
  },
  sidebarBlock: {
    gap: 10,
  },
  sidebarSummary: {
    fontSize: 14,
    lineHeight: 22,
    color: appColors.slate600,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: appColors.ink900,
  },
  mutedBody: {
    fontSize: 14,
    lineHeight: 22,
    color: appColors.slate500,
  },
  sidebarFindingItem: {
    borderRadius: 16,
    backgroundColor: appColors.sky50,
    borderWidth: 1,
    borderColor: appColors.slate200,
    padding: 12,
    gap: 6,
  },
  sidebarSeverityPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sidebarSeverityPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sidebarFindingArticle: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.ink900,
  },
  sidebarFindingIssue: {
    fontSize: 13,
    lineHeight: 19,
    color: appColors.slate600,
  },
  mainPanel: {
    backgroundColor: appColors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#dbe7f5',
    padding: 22,
    gap: 16,
    ...cardSurfaceShadow,
  },
  mainPanelDesktop: {
    flex: 1,
    minWidth: 0,
  },
  mainPanelMobile: {
    width: '100%',
  },
  mainPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  mainPanelEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: appColors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  mainPanelTitle: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '800',
    color: appColors.ink900,
  },
  mainPanelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainPanelMetaText: {
    fontSize: 14,
    fontWeight: '700',
    color: appColors.slate600,
  },
  progressWrap: {
    gap: 8,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: appColors.slate200,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: appColors.blue600,
    borderRadius: 999,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.slate700,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: appColors.blue600,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: appColors.slate100,
    borderWidth: 1,
    borderColor: appColors.slate200,
  },
  tabButtonActive: {
    backgroundColor: appColors.blue100,
    borderColor: '#60a5fa',
  },
  tabButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.slate600,
  },
  tabButtonTextActive: {
    color: appColors.blue700,
  },
  mainPanelToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  tabContainer: {
    minHeight: 560,
    borderRadius: 22,
    backgroundColor: appColors.sky50,
    borderWidth: 1,
    borderColor: appColors.slate200,
    overflow: 'hidden',
  },
  tabScroll: {
    flex: 1,
  },
  tabScrollContent: {
    padding: 20,
    gap: 18,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricCaption: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.slate500,
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: '800',
    color: appColors.ink900,
  },
  heroSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: appColors.slate500,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
  },
  starGlyph: {
    fontSize: 20,
    color: appColors.slate300,
  },
  starGlyphActive: {
    color: '#f59e0b',
  },
  starPercent: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '700',
    color: appColors.slate600,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 24,
    color: appColors.slate700,
  },
  sectionBlock: {
    borderRadius: 20,
    backgroundColor: appColors.white,
    borderWidth: 1,
    borderColor: appColors.slate200,
    padding: 18,
    gap: 12,
    ...mutedCardShadow,
  },
  findingCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff7f7',
    padding: 14,
    gap: 6,
  },
  findingArticle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
    color: appColors.ink900,
  },
  findingIssue: {
    fontSize: 14,
    lineHeight: 22,
    color: appColors.slate600,
  },
  findingConfidence: {
    fontSize: 12,
    fontWeight: '700',
    color: appColors.slate500,
  },
  fullGrid: {
    gap: 18,
  },
  fullGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'nowrap',
  },
  fullGridMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    flexWrap: 'nowrap',
  },
  fullMainColumn: {
    gap: 16,
  },
  fullMainColumnDesktop: {
    flex: 1,
    minWidth: 0,
  },
  fullSideColumn: {
    gap: 16,
  },
  fullSideColumnDesktop: {
    width: 280,
    flexShrink: 0,
  },
  fullSideColumnMobile: {
    width: '100%',
  },
  fullFindingCard: {
    borderRadius: 16,
    backgroundColor: appColors.white,
    borderWidth: 1,
    borderColor: appColors.slate200,
    padding: 14,
    gap: 8,
  },
  fullFindingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  fullFindingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  recommendationItem: {
    fontSize: 14,
    lineHeight: 22,
    color: appColors.slate700,
  },
  metricsCard: {
    borderRadius: 20,
    backgroundColor: appColors.white,
    borderWidth: 1,
    borderColor: appColors.slate200,
    padding: 18,
    gap: 10,
    ...mutedCardShadow,
  },
  metricLine: {
    fontSize: 14,
    lineHeight: 22,
    color: appColors.slate700,
  },
  metricLineDanger: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    color: appColors.red700,
  },
  evidenceCard: {
    borderRadius: 16,
    backgroundColor: appColors.green700,
    padding: 14,
    gap: 8,
  },
  evidenceArticle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: appColors.white,
  },
  evidenceExcerpt: {
    fontSize: 12,
    lineHeight: 18,
    color: appColors.green100,
  },
  reportBrandWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  reportBrandCard: {
    borderRadius: 18,
    backgroundColor: appColors.white,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: appColors.slate200,
    ...mutedCardShadow,
  },
  reportBrandImage: {
    width: 180,
    height: 42,
  },
  revisedContent: {
    fontSize: 14,
    lineHeight: 22,
    color: appColors.slate700,
  },
  emptyState: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: appColors.ink900,
  },
  emptyStateBody: {
    fontSize: 14,
    lineHeight: 22,
    color: appColors.slate500,
    textAlign: 'center',
    maxWidth: 460,
  },
  loadingState: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  loadingStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: appColors.ink900,
  },
  loadingStateBody: {
    fontSize: 14,
    lineHeight: 22,
    color: appColors.slate500,
    textAlign: 'center',
    maxWidth: 420,
  },
  authState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  authStateTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: appColors.ink900,
  },
  authStateText: {
    fontSize: 14,
    lineHeight: 22,
    color: appColors.slate500,
  },
  panelAction: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
  },
  panelActionPrimary: {
    backgroundColor: appColors.blue600,
    borderColor: appColors.blue600,
  },
  panelActionSecondary: {
    backgroundColor: appColors.ink900,
    borderColor: appColors.ink900,
  },
  panelActionDanger: {
    backgroundColor: appColors.red600,
    borderColor: appColors.red600,
  },
  panelActionGhost: {
    backgroundColor: appColors.white,
    borderColor: appColors.slate300,
  },
  panelActionDisabled: {
    opacity: 0.45,
  },
  panelActionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  panelActionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  panelActionTextPrimary: {
    color: appColors.white,
  },
  panelActionTextSecondary: {
    color: appColors.white,
  },
  panelActionTextDanger: {
    color: appColors.white,
  },
  panelActionTextGhost: {
    color: appColors.slate600,
  },
  panelActionTextDisabled: {
    color: appColors.white,
  },
  dialogBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: appAlphaColors.overlayDark45,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    backgroundColor: appColors.white,
    padding: 24,
    gap: 14,
    ...cardSurfaceShadow,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: appColors.ink900,
  },
  dialogBody: {
    fontSize: 14,
    lineHeight: 22,
    color: appColors.slate600,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
});
