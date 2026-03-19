import React from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  FileCheck2,
  FileSearch,
  Filter,
  Link2,
  RefreshCcw,
  Search,
  Square,
  SquareCheckBig,
  Trash2,
  X,
} from 'lucide-react-native';
import { t } from '@poliverai/intl';
import type { ReportMetadata } from '../types/api';
import AppFooter from '../components/AppFooter';
import AppTopNav from '../components/AppTopNav';
import { ReportViewerModal, appAlphaColors, appColors } from '@poliverai/shared-ui';
import useReports from '../components/reports-ui/useReports';
import useSelection from '../components/reports-ui/useSelection';
import policyService from '../services/policyService';
import { formatDateTime, formatFileSize, isFullReport, normalizeStatus } from '../lib/reportHelpers';
import { getReportDownloadUrl } from '../lib/policyHelpers';

const PER_PAGE_OPTIONS = [10, 20, 30, 50];

const cardSurfaceShadow = Platform.select({
  web: {
    boxShadow: `0 10px 18px ${appAlphaColors.shadowCardSoft}`,
  },
  default: {
    shadowColor: appColors.ink900,
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
});

const rowSurfaceShadow = Platform.select({
  web: {
    boxShadow: `0 6px 12px ${appAlphaColors.shadowSofter}`,
  },
  default: {
    shadowColor: appColors.ink900,
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
});

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

function parseFilterDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('/');
    const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatStatusLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getReportRenderKey(report: ReportMetadata, index: number) {
  return [report.filename, report.created_at, report.path, report.gcs_url, index].filter(Boolean).join('::');
}

function matchesQuery(report: ReportMetadata, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${report.title || ''} ${report.document_name || ''} ${report.filename || ''}`.toLowerCase();
  return haystack.includes(q);
}

function matchesStatus(report: ReportMetadata, statusFilter: string) {
  if (!statusFilter || statusFilter === 'all') return true;
  if (statusFilter === 'full') return isFullReport(report);
  return normalizeStatus(report.verdict || report.status) === statusFilter;
}

function matchesDateRange(report: ReportMetadata, startDate: string, endDate: string) {
  const created = new Date(report.created_at);
  if (Number.isNaN(created.getTime())) return false;

  const start = parseFilterDate(startDate);
  if (start && created < start) return false;

  const end = parseFilterDate(endDate);
  if (end) {
    const inclusiveEnd = new Date(end);
    inclusiveEnd.setHours(23, 59, 59, 999);
    if (created > inclusiveEnd) return false;
  }

  return true;
}

function ToggleButton({
  label,
  onPress,
  icon,
  variant = 'secondary',
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionButton,
        variant === 'primary' ? styles.actionButtonPrimary : null,
        variant === 'secondary' ? styles.actionButtonSecondary : null,
        variant === 'ghost' ? styles.actionButtonGhost : null,
        variant === 'danger' ? styles.actionButtonDanger : null,
      ]}
    >
      <View style={styles.actionButtonInner}>
        {icon ? <View style={styles.actionButtonIcon}>{icon}</View> : null}
        <Text
          style={[
            styles.actionButtonText,
            variant === 'primary' ? styles.actionButtonTextPrimary : null,
            variant === 'secondary' ? styles.actionButtonTextSecondary : null,
            variant === 'ghost' ? styles.actionButtonTextGhost : null,
            variant === 'danger' ? styles.actionButtonTextDanger : null,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function FilterInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.filterField}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <View style={styles.inputIcon}>{icon}</View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          style={styles.input}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, selected ? styles.filterChipSelected : null]}>
      <Text style={[styles.filterChipText, selected ? styles.filterChipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

function RowCheckbox({
  checked,
  onPress,
}: {
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.checkboxButton}>
      {checked ? <SquareCheckBig size={18} color="#2563eb" /> : <Square size={18} color="#94a3b8" />}
    </Pressable>
  );
}

function ReportAction({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} style={styles.reportAction}>
      <View style={styles.reportActionInner}>
        {icon}
        <Text style={styles.reportActionText}>{label}</Text>
      </View>
    </Pressable>
  );
}

function ReportRow({
  report,
  selected,
  onToggle,
  onOpen,
  onView,
  onDownload,
  isDesktop,
}: {
  report: ReportMetadata;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onView: () => void;
  onDownload: () => void;
  isDesktop: boolean;
}) {
  const showOpen = isFullReport(report) || Boolean(report.gcs_url);
  const title = report.title || report.document_name || report.filename;
  const status = normalizeStatus(report.verdict || report.status) || 'report';

  return (
    <View style={[styles.reportRow, isDesktop ? styles.reportRowDesktop : null]}>
      <View style={styles.reportRowTop}>
        <RowCheckbox checked={selected} onPress={onToggle} />
        <View style={styles.reportMain}>
          <View style={styles.reportHeadingRow}>
            <View style={styles.reportTypeBadge}>
              <FileCheck2 size={15} color="#2563eb" />
              <Text style={styles.reportTypeText}>
                {status === 'report' ? 'policy' : formatStatusLabel(status)}
              </Text>
            </View>
            {isFullReport(report) ? (
              <View style={styles.reportKindBadge}>
                <Text style={styles.reportKindText}>{copy('reports.full_report', 'Full report')}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.reportTitle}>{title}</Text>
          <Text style={styles.reportDate}>{formatDateTime(report.created_at)}</Text>

          <View style={styles.reportMetaGroup}>
            <Text style={styles.reportMeta}>filename: {report.filename}</Text>
            <Text style={styles.reportMeta}>Size: {formatFileSize(report.file_size)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.reportActionsRow, isDesktop ? styles.reportActionsRowDesktop : null]}>
        {showOpen ? (
          <ReportAction label={copy('reports.open', 'Open')} onPress={onOpen} icon={<Link2 size={15} color="#2563eb" />} />
        ) : null}
        <ReportAction label={copy('reports.view', 'View')} onPress={onView} icon={<Eye size={15} color="#2563eb" />} />
        <ReportAction label={copy('reports.download', 'Download')} onPress={onDownload} icon={<Download size={15} color="#2563eb" />} />
      </View>
    </View>
  );
}

export default function ReportsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1080;
  const { reports, setReports, isLoading, error, fetchReports, page, setPage, limit, setLimit, total, totalPages } = useReports();
  const { selectedFiles, toggle, clear, getSelected, syncWithReports, setAll } = useSelection();

  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(isDesktop);
  const [verdictOptions, setVerdictOptions] = React.useState<string[]>([]);
  const [viewerUrl, setViewerUrl] = React.useState<string | null>(null);
  const [busyDelete, setBusyDelete] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteResultDialog, setDeleteResultDialog] = React.useState<null | { title: string; message: string; tone: 'success' | 'danger' }>(null);

  React.useEffect(() => {
    syncWithReports(reports);
  }, [reports, syncWithReports]);

  React.useEffect(() => {
    setShowFilters(isDesktop);
  }, [isDesktop]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await policyService.getReportVerdicts();
        if (mounted) setVerdictOptions(response?.verdicts || []);
      } catch (err) {
        console.warn('Failed to load report verdicts', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredReports = React.useMemo(() => {
    return reports.filter((report) => {
      return matchesQuery(report, query) && matchesStatus(report, statusFilter) && matchesDateRange(report, startDate, endDate);
    });
  }, [reports, query, statusFilter, startDate, endDate]);

  const visibleReports = filteredReports;
  const visibleNames = React.useMemo(() => visibleReports.map((report) => report.filename), [visibleReports]);
  const visibleAllSelected = visibleNames.length > 0 && visibleNames.every((name) => selectedFiles[name]);

  const clearFilters = React.useCallback(() => {
    setQuery('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    clear();
    setPage(1);
  }, [clear]);

  const handleToggleAllVisible = React.useCallback(() => {
    if (visibleNames.length === 0) return;
    if (visibleAllSelected) {
      visibleNames.forEach((name) => {
        if (selectedFiles[name]) toggle(name);
      });
      return;
    }
    const merged = Array.from(new Set([...getSelected(), ...visibleNames]));
    setAll(merged);
  }, [getSelected, selectedFiles, setAll, toggle, visibleAllSelected, visibleNames]);

  const openExternal = React.useCallback(async (url: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(url);
  }, []);

  const getPrimaryUrl = React.useCallback((report: ReportMetadata) => {
    return report.gcs_url || getReportDownloadUrl(report.filename);
  }, []);

  const handleOpen = React.useCallback(async (report: ReportMetadata) => {
    try {
      await openExternal(getPrimaryUrl(report));
    } catch (err) {
      console.error('Failed to open report', err);
    }
  }, [getPrimaryUrl, openExternal]);

  const handleView = React.useCallback((report: ReportMetadata) => {
    setViewerUrl(getPrimaryUrl(report));
  }, [getPrimaryUrl]);

  const handleDownload = React.useCallback(async (report: ReportMetadata) => {
    try {
      await openExternal(getReportDownloadUrl(report.filename));
    } catch (err) {
      console.error('Failed to download report', err);
    }
  }, [openExternal]);

  const handleDeleteSelected = React.useCallback(async () => {
    const filenames = getSelected();
    if (filenames.length === 0 || busyDelete) return;

    setBusyDelete(true);
    try {
      const deletedCounts = filenames.reduce(
        (acc, filename) => {
          const report = reports.find((item) => item.filename === filename);
          if (report?.type === 'revision') acc.revision += 1;
          else if ((report?.analysis_mode || '').toString() === 'fast') acc.free += 1;
          else if (report?.is_full_report) acc.full += 1;
          else acc.free += 1;
          return acc;
        },
        { full: 0, revision: 0, free: 0 }
      );

      await policyService.bulkDeleteReports(filenames);
      setReports((current) => current.filter((report) => !filenames.includes(report.filename)));
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reports:deleted', { detail: { counts: deletedCounts, filenames } }));
      }
      clear();
      void fetchReports();
      setDeleteResultDialog({
        title: filenames.length === 1 ? copy('reports.delete_success_title_single', 'Report deleted') : copy('reports.delete_success_title_multiple', 'Reports deleted'),
        message:
          filenames.length === 1
            ? copy('reports.delete_success_message_single', 'The selected report was deleted successfully.')
            : `${filenames.length} ${copy('reports.delete_success_message_multiple', 'reports were deleted successfully.')}`,
        tone: 'success',
      });
    } catch (err) {
      console.error('Failed to delete selected reports', err);
      setDeleteResultDialog({
        title: copy('reports.delete_failed_title', 'Delete failed'),
        message: err instanceof Error ? err.message : copy('reports.delete_failed_message', 'The selected reports could not be deleted.'),
        tone: 'danger',
      });
    } finally {
      setBusyDelete(false);
    }
  }, [busyDelete, clear, fetchReports, getSelected, reports, setReports]);

  const statusChoices = React.useMemo(() => {
    const normalized = verdictOptions
      .map((value) => normalizeStatus(value))
      .filter((value) => Boolean(value) && value !== 'compliant');
    return ['all', 'compliant', ...Array.from(new Set(normalized)), 'full'];
  }, [verdictOptions]);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <AppTopNav currentRoute="reports" />

        <View style={styles.pageWrap}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.pageTitle}>{copy('reports.title', 'Your Reports')}</Text>
            </View>

            <View style={[styles.headerActions, isDesktop ? styles.headerActionsDesktop : null]}>
              <ToggleButton
                label={showFilters ? copy('filters.hide', 'Hide Filters') : copy('filters.show', 'Show Filters')}
                onPress={() => setShowFilters((current) => !current)}
                icon={<Filter size={15} color="#1e293b" />}
                variant="secondary"
              />
              <ToggleButton
                label={copy('reports.refresh', 'Refresh')}
                onPress={() => {
                  void fetchReports();
                }}
                icon={<RefreshCcw size={15} color="#ffffff" />}
                variant="primary"
              />
              <ToggleButton
                label={copy('reports.delete_selected', 'Delete Selected')}
                onPress={() => {
                  if (getSelected().length > 0) setDeleteDialogOpen(true);
                }}
                icon={<Trash2 size={15} color={getSelected().length > 0 ? '#b91c1c' : appColors.slate400} />}
                variant="danger"
              />
            </View>
          </View>

          <View style={[styles.mainGrid, isDesktop && showFilters ? styles.mainGridDesktop : null]}>
            {showFilters ? (
              <View style={[styles.filtersCard, isDesktop ? styles.filtersCardDesktop : null]}>
                <View style={styles.filtersHeader}>
                  <View style={styles.filtersTitleRow}>
                    <Text style={styles.filtersTitle}>{copy('reports_filters.heading', 'Filters')}</Text>
                    <View style={styles.filtersHeaderIcon}>
                      <Filter size={16} color="#475569" />
                    </View>
                  </View>
                  <ToggleButton label={copy('reports_filters.clear', 'Clear filters')} onPress={clearFilters} icon={<X size={14} color="#475569" />} variant="ghost" />
                </View>

                <FilterInput
                  label={copy('reports_filters.search_label', 'Search')}
                  value={query}
                  onChangeText={(value) => {
                    setQuery(value);
                    setPage(1);
                  }}
                  placeholder={copy('reports_filters.search_placeholder', 'file name or title')}
                  icon={<Search size={15} color="#64748b" />}
                />

                <View style={styles.filterField}>
                  <Text style={styles.filterLabel}>{copy('reports_filters.verdict_status_label', 'Verdict / Status')}</Text>
                  <View style={styles.filterChipsWrap}>
                    {statusChoices.map((choice) => (
                      <FilterChip
                        key={choice}
                        label={
                          choice === 'all'
                            ? copy('reports_filters.option_all', 'All')
                            : choice === 'full'
                              ? copy('reports_filters.option_full', 'Full')
                              : formatStatusLabel(choice)
                        }
                        selected={statusFilter === choice}
                        onPress={() => {
                          setStatusFilter(choice);
                          setPage(1);
                        }}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.filterField}>
                  <Text style={styles.filterLabel}>{copy('reports_filters.date_range', 'Date range')}</Text>
                  <View style={styles.dateRow}>
                    <View style={[styles.inputWrap, styles.dateInputWrap]}>
                      <View style={styles.inputIcon}>
                        <CalendarDays size={15} color="#64748b" />
                      </View>
                      <TextInput
                        value={startDate}
                        onChangeText={(value) => {
                          setStartDate(value);
                          setPage(1);
                        }}
                        placeholder="dd/mm/yyyy"
                        placeholderTextColor="#94a3b8"
                        style={styles.input}
                      />
                    </View>
                    <View style={[styles.inputWrap, styles.dateInputWrap]}>
                      <View style={styles.inputIcon}>
                        <CalendarDays size={15} color="#64748b" />
                      </View>
                      <TextInput
                        value={endDate}
                        onChangeText={(value) => {
                          setEndDate(value);
                          setPage(1);
                        }}
                        placeholder="dd/mm/yyyy"
                        placeholderTextColor="#94a3b8"
                        style={styles.input}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={[styles.reportsCard, isDesktop ? styles.reportsCardDesktop : null]}>
              <View style={styles.toolbarRow}>
                <Pressable onPress={handleToggleAllVisible} style={styles.selectAllRow}>
                  <RowCheckbox checked={visibleAllSelected} onPress={handleToggleAllVisible} />
                  <Text style={styles.selectAllText}>{copy('toolbar.select_all', 'Select all')}</Text>
                </Pressable>

                <View style={[styles.toolbarMetaRow, isDesktop ? styles.toolbarMetaRowDesktop : null]}>
                  <Text style={styles.resultsText}>
                    {filteredReports.length} / {total ?? reports.length} {copy('toolbar.results_short', 'results')}
                  </Text>

                  <View style={[styles.listToolbarControls, isDesktop ? styles.listToolbarControlsDesktop : null]}>
                    <View style={[styles.controlGroup, isDesktop ? styles.controlGroupDesktop : null]}>
                      <Text style={styles.controlLabel}>{copy('toolbar.per_page', 'Per page')}</Text>
                      <View style={styles.miniSelect}>
                        {PER_PAGE_OPTIONS.map((option) => (
                          <Pressable
                            key={option}
                            onPress={() => {
                              setLimit(option);
                              setPage(1);
                            }}
                            style={[
                              styles.miniSelectOption,
                              option === PER_PAGE_OPTIONS[PER_PAGE_OPTIONS.length - 1] ? styles.miniSelectOptionLast : null,
                              limit === option ? styles.miniSelectOptionActive : null,
                            ]}
                          >
                            <Text style={[styles.miniSelectOptionText, limit === option ? styles.miniSelectOptionTextActive : null]}>{option}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    <View style={[styles.controlGroup, isDesktop ? styles.controlGroupDesktop : null]}>
                      <Text style={styles.controlLabel}>{copy('toolbar.page', 'Page')}</Text>
                      <View style={[styles.pageControls, isDesktop ? styles.pageControlsDesktop : null]}>
                        <Pressable
                          onPress={() => setPage((current) => Math.max(1, current - 1))}
                          style={[styles.pageButton, page <= 1 ? styles.pageButtonDisabled : null]}
                        >
                          <ChevronLeft size={15} color={page <= 1 ? '#94a3b8' : appColors.slate600} />
                          <Text style={[styles.pageButtonText, page <= 1 ? styles.pageButtonTextDisabled : null]}>{copy('toolbar.prev', 'Prev')}</Text>
                        </Pressable>
                        <View style={styles.pageCounter}>
                          <Text style={styles.pageCounterText}>{page} / {Math.max(1, totalPages)}</Text>
                        </View>
                        <Pressable
                          onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
                          style={[styles.pageButton, page >= totalPages ? styles.pageButtonDisabled : null]}
                        >
                          <Text style={[styles.pageButtonText, page >= totalPages ? styles.pageButtonTextDisabled : null]}>{copy('toolbar.next', 'Next')}</Text>
                          <ChevronRight size={15} color={page >= totalPages ? '#94a3b8' : appColors.slate600} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {isLoading ? (
                <View style={styles.stateWrap}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.stateText}>{copy('loading.reports', 'Loading reports...')}</Text>
                </View>
              ) : null}

              {!isLoading && error && reports.length === 0 ? (
                <View style={styles.stateWrap}>
                  <FileSearch size={34} color="#94a3b8" />
                  <Text style={styles.stateTitle}>{copy('reports.no_reports_title', 'No reports yet')}</Text>
                  <Text style={styles.stateText}>{error}</Text>
                </View>
              ) : null}

              {!isLoading && reports.length > 0 && visibleReports.length === 0 ? (
                <View style={styles.stateWrap}>
                  <Search size={34} color="#94a3b8" />
                  <Text style={styles.stateTitle}>{copy('reports.no_filtered_title', 'No matching reports')}</Text>
                  <Text style={styles.stateText}>{copy('reports.no_filtered_message', 'Try adjusting your filters.')}</Text>
                </View>
              ) : null}

              {!isLoading && visibleReports.length > 0 ? (
                <View style={styles.rowsWrap}>
                  {visibleReports.map((report, index) => (
                    <ReportRow
                      key={getReportRenderKey(report, index)}
                      report={report}
                      selected={Boolean(selectedFiles[report.filename])}
                      onToggle={() => toggle(report.filename)}
                      onOpen={() => {
                        void handleOpen(report);
                      }}
                      onView={() => handleView(report)}
                      onDownload={() => {
                        void handleDownload(report);
                      }}
                      isDesktop={isDesktop}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <AppFooter />
      </ScrollView>

      <ReportViewerModal
        open={Boolean(viewerUrl)}
        reportUrl={viewerUrl ?? undefined}
        title={copy('reports.viewer_title', 'Report')}
        onClose={() => setViewerUrl(null)}
      />

      <Modal
        visible={deleteDialogOpen}
        animationType="fade"
        transparent
        presentationStyle="overFullScreen"
        onRequestClose={() => setDeleteDialogOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDeleteDialogOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>{copy('reports.confirm_delete_title', 'Delete selected reports?')}</Text>
            <Text style={styles.modalBody}>
              {getSelected().length === 1
                ? copy('reports.confirm_delete_single', 'This report will be permanently removed.')
                : `${getSelected().length} ${copy('reports.confirm_delete_multiple', 'reports will be permanently removed.')}`}
            </Text>
            <View style={styles.modalActions}>
              <ToggleButton label={copy('common.cancel', 'Cancel')} onPress={() => setDeleteDialogOpen(false)} variant="secondary" />
              <ToggleButton
                label={busyDelete ? copy('reports.deleting', 'Deleting...') : copy('reports.confirm_delete', 'Delete')}
                onPress={() => {
                  setDeleteDialogOpen(false);
                  void handleDeleteSelected();
                }}
                icon={<Trash2 size={15} color="#b91c1c" />}
                variant="danger"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={Boolean(deleteResultDialog)}
        animationType="fade"
        transparent
        presentationStyle="overFullScreen"
        onRequestClose={() => setDeleteResultDialog(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDeleteResultDialog(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>{deleteResultDialog?.title}</Text>
            <Text style={styles.modalBody}>{deleteResultDialog?.message}</Text>
            <View style={styles.modalActions}>
              <ToggleButton
                label={copy('common.close', 'Close')}
                onPress={() => setDeleteResultDialog(null)}
                variant={deleteResultDialog?.tone === 'danger' ? 'secondary' : 'primary'}
                icon={deleteResultDialog?.tone === 'danger' ? <X size={15} color="#1e293b" /> : <FileCheck2 size={15} color="#ffffff" />}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appColors.sky50,
  },
  content: {
    flexGrow: 1,
  },
  pageWrap: {
    width: '100%',
    maxWidth: 1240,
    marginHorizontal: 'auto',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 20,
  },
  headerRow: {
    gap: 14,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerActionsDesktop: {
    justifyContent: 'flex-end',
  },
  pageTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: appColors.ink900,
  },
  mainGrid: {
    gap: 18,
  },
  mainGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  filtersCard: {
    backgroundColor: appColors.white,
    borderWidth: 1,
    borderColor: '#dbe7f5',
    borderRadius: 22,
    padding: 18,
    gap: 16,
    ...cardSurfaceShadow,
  },
  filtersCardDesktop: {
    width: 300,
    flexShrink: 0,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  filtersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: appColors.ink900,
  },
  filtersHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: appColors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportsCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: appColors.white,
    borderWidth: 1,
    borderColor: '#dbe7f5',
    borderRadius: 24,
    padding: 18,
    ...cardSurfaceShadow,
  },
  reportsCardDesktop: {
    flex: 1,
  },
  filterField: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.slate700,
  },
  inputWrap: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.slate300,
    backgroundColor: appColors.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    paddingLeft: 14,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: appColors.ink900,
    paddingRight: 14,
  },
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appColors.slate300,
    backgroundColor: appColors.sky50,
  },
  filterChipSelected: {
    backgroundColor: appColors.blue100,
    borderColor: '#60a5fa',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: appColors.slate600,
  },
  filterChipTextSelected: {
    color: appColors.blue700,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInputWrap: {
    flex: 1,
  },
  actionButton: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: appColors.blue600,
  },
  actionButtonSecondary: {
    backgroundColor: appColors.slate200,
  },
  actionButtonGhost: {
    backgroundColor: 'transparent',
  },
  actionButtonDanger: {
    backgroundColor: appColors.red100,
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonTextPrimary: {
    color: appColors.white,
  },
  actionButtonTextSecondary: {
    color: appColors.ink800,
  },
  actionButtonTextGhost: {
    color: appColors.slate600,
  },
  actionButtonTextDanger: {
    color: appColors.red700,
  },
  toolbarRow: {
    gap: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: appColors.slate200,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  checkboxButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: appColors.ink900,
  },
  toolbarMetaRow: {
    gap: 12,
  },
  toolbarMetaRowDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 16,
  },
  resultsText: {
    fontSize: 14,
    color: appColors.slate500,
  },
  listToolbarControls: {
    gap: 14,
  },
  listToolbarControlsDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'nowrap',
    gap: 18,
  },
  controlGroup: {
    gap: 8,
  },
  controlGroupDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 10,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: appColors.slate500,
  },
  miniSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.slate300,
    backgroundColor: appColors.white,
  },
  miniSelectOption: {
    minWidth: 42,
    height: 36,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: appColors.slate300,
  },
  miniSelectOptionLast: {
    borderRightWidth: 0,
  },
  miniSelectOptionActive: {
    backgroundColor: appColors.blue100,
  },
  miniSelectOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.slate600,
  },
  miniSelectOptionTextActive: {
    color: appColors.blue700,
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pageControlsDesktop: {
    flexWrap: 'nowrap',
  },
  pageButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.slate300,
    backgroundColor: appColors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageButtonDisabled: {
    backgroundColor: appColors.sky50,
    borderColor: appColors.slate200,
  },
  pageButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.slate600,
  },
  pageButtonTextDisabled: {
    color: appColors.slate400,
  },
  pageCounter: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageCounterText: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.blue700,
  },
  rowsWrap: {
    paddingTop: 16,
    gap: 12,
  },
  reportRow: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#dbe7f5',
    backgroundColor: appColors.white,
    padding: 16,
    gap: 14,
    ...rowSurfaceShadow,
  },
  reportRowDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportRowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  reportMain: {
    flex: 1,
    gap: 8,
  },
  reportHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  reportTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#eff6ff',
  },
  reportTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: appColors.blue600,
  },
  reportKindBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: appColors.slate100,
  },
  reportKindText: {
    fontSize: 12,
    fontWeight: '700',
    color: appColors.slate600,
  },
  reportTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: appColors.ink900,
  },
  reportDate: {
    fontSize: 13,
    color: appColors.slate500,
  },
  reportMetaGroup: {
    gap: 4,
  },
  reportMeta: {
    fontSize: 13,
    color: appColors.slate600,
  },
  reportActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  reportActionsRowDesktop: {
    justifyContent: 'flex-end',
  },
  reportAction: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
  },
  reportActionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.blue600,
  },
  stateWrap: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: appColors.ink900,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 14,
    lineHeight: 22,
    color: appColors.slate500,
    textAlign: 'center',
    maxWidth: 420,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: appColors.white,
    borderRadius: 24,
    padding: 24,
    gap: 14,
    ...cardSurfaceShadow,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: appColors.ink900,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 22,
    color: appColors.slate600,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
});
