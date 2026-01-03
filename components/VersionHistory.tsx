import React, { useState, useEffect } from 'react';
import {
  Clock,
  Save,
  RotateCcw,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  versionControl,
  PresentationVersion,
  VersionDiff,
} from '../services/version-control';

interface VersionHistoryProps {
  presentationId: string;
  currentSnapshot?: any;
  onRestore: (snapshot: any) => void;
  onClose: () => void;
}

export function VersionHistory({
  presentationId,
  currentSnapshot,
  onRestore,
  onClose,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<PresentationVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PresentationVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<PresentationVersion | null>(null);
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saveDescription, setSaveDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [presentationId]);

  useEffect(() => {
    if (selectedVersion && compareVersion) {
      const versionDiff = versionControl.compareVersions(compareVersion, selectedVersion);
      setDiff(versionDiff);
    } else {
      setDiff(null);
    }
  }, [selectedVersion, compareVersion]);

  const loadVersions = async () => {
    setLoading(true);
    const data = await versionControl.getVersions(presentationId);
    setVersions(data);
    setLoading(false);
  };

  const handleSaveVersion = async () => {
    // Use current snapshot if provided, otherwise use placeholder
    const snapshot = currentSnapshot || { slides: [], metadata: {} };

    await versionControl.createVersion(
      presentationId,
      snapshot,
      saveDescription || undefined
    );

    setSaveDescription('');
    setShowSaveDialog(false);
    loadVersions();
  };

  const handleRestore = async (version: PresentationVersion) => {
    const restored = await versionControl.restoreVersion(
      presentationId,
      version.version_number
    );

    if (restored) {
      onRestore(restored);
      setShowRestoreConfirm(false);
      loadVersions();
    }
  };

  const handleDelete = async (version: PresentationVersion) => {
    if (confirm('Are you sure you want to delete this version?')) {
      await versionControl.deleteVersion(presentationId, version.version_number);
      loadVersions();
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold">Version History</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Version
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Version List */}
          <div className="w-1/3 border-r overflow-y-auto">
            <div className="p-4 space-y-2">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading versions...</div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No versions yet</p>
                  <p className="text-sm">Save your first version to get started</p>
                </div>
              ) : (
                versions.map((version) => (
                  <div
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedVersion?.id === version.id
                        ? 'bg-indigo-50 border-2 border-indigo-600'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold">
                          Version {version.version_number}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(version.created_at)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(version);
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                    {version.description && (
                      <div className="text-sm text-gray-700 mt-1">
                        {version.description}
                      </div>
                    )}
                    {version.description?.includes('[Auto-save]') && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Auto-saved
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Preview & Diff */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedVersion ? (
              <div className="space-y-6">
                {/* Version Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">
                    Version {selectedVersion.version_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedVersion.created_at).toLocaleString()}
                  </p>
                  {selectedVersion.description && (
                    <p className="text-sm mt-2">{selectedVersion.description}</p>
                  )}
                </div>

                {/* Compare Selector */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Compare with:</label>
                  <select
                    value={compareVersion?.id || ''}
                    onChange={(e) => {
                      const version = versions.find((v) => v.id === e.target.value);
                      setCompareVersion(version || null);
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select a version</option>
                    {versions
                      .filter((v) => v.id !== selectedVersion.id)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          Version {v.version_number} - {formatDate(v.created_at)}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Diff View */}
                {diff && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Changes</h3>

                    {/* Added Items */}
                    {diff.added.length > 0 && (
                      <div className="border border-green-200 rounded-lg">
                        <button
                          onClick={() => toggleSection('added')}
                          className="w-full flex items-center justify-between p-4 hover:bg-green-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {expandedSections.has('added') ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                            <span className="font-medium text-green-700">
                              Added ({diff.added.length})
                            </span>
                          </div>
                        </button>
                        {expandedSections.has('added') && (
                          <div className="p-4 pt-0 space-y-2">
                            {diff.added.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-green-50 border border-green-200 rounded p-3"
                              >
                                <div className="text-sm font-medium text-green-800">
                                  {item.type === 'slide'
                                    ? `Slide ${item.index + 1}`
                                    : `Metadata: ${item.key}`}
                                </div>
                                <pre className="text-xs mt-2 overflow-x-auto">
                                  {JSON.stringify(item.content || item.value, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Modified Items */}
                    {diff.modified.length > 0 && (
                      <div className="border border-yellow-200 rounded-lg">
                        <button
                          onClick={() => toggleSection('modified')}
                          className="w-full flex items-center justify-between p-4 hover:bg-yellow-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {expandedSections.has('modified') ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                            <span className="font-medium text-yellow-700">
                              Modified ({diff.modified.length})
                            </span>
                          </div>
                        </button>
                        {expandedSections.has('modified') && (
                          <div className="p-4 pt-0 space-y-2">
                            {diff.modified.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-yellow-50 border border-yellow-200 rounded p-3"
                              >
                                <div className="text-sm font-medium text-yellow-800 mb-2">
                                  {item.type === 'slide'
                                    ? `Slide ${item.index + 1}`
                                    : `Metadata: ${item.key}`}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-xs font-medium text-gray-600 mb-1">
                                      Before
                                    </div>
                                    <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                                      {JSON.stringify(item.old, null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-gray-600 mb-1">
                                      After
                                    </div>
                                    <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                                      {JSON.stringify(item.new, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Removed Items */}
                    {diff.removed.length > 0 && (
                      <div className="border border-red-200 rounded-lg">
                        <button
                          onClick={() => toggleSection('removed')}
                          className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {expandedSections.has('removed') ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                            <span className="font-medium text-red-700">
                              Removed ({diff.removed.length})
                            </span>
                          </div>
                        </button>
                        {expandedSections.has('removed') && (
                          <div className="p-4 pt-0 space-y-2">
                            {diff.removed.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-red-50 border border-red-200 rounded p-3"
                              >
                                <div className="text-sm font-medium text-red-800">
                                  {item.type === 'slide'
                                    ? `Slide ${item.index + 1}`
                                    : `Metadata: ${item.key}`}
                                </div>
                                <pre className="text-xs mt-2 overflow-x-auto">
                                  {JSON.stringify(item.content || item.value, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {diff.added.length === 0 &&
                      diff.modified.length === 0 &&
                      diff.removed.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No changes between these versions</p>
                        </div>
                      )}
                  </div>
                )}

                {/* Restore Button */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowRestoreConfirm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restore This Version
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a version to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Save New Version</h3>
              <textarea
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Enter a description for this version (optional)"
                className="w-full px-3 py-2 border rounded-lg resize-none"
                rows={3}
              />
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVersion}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save Version
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Restore Confirmation */}
        {showRestoreConfirm && selectedVersion && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                <h3 className="text-xl font-bold">Restore Version?</h3>
              </div>
              <p className="text-gray-700 mb-4">
                This will replace your current presentation with Version{' '}
                {selectedVersion.version_number}. Your current state will be saved as a
                new version before restoring.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowRestoreConfirm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRestore(selectedVersion)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Restore
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
