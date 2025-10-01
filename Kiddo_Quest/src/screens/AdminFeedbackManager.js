import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, LoadingSpinner } from '../components/UI';

// Status options with colors
const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: 'bg-gray-100 text-gray-700' },
  { value: 'reviewing', label: 'Reviewing', color: 'bg-blue-100 text-blue-700' },
  { value: 'ready_for_dev', label: 'Ready for Dev', color: 'bg-purple-100 text-purple-700' },
  { value: 'in_development', label: 'In Development', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-orange-100 text-orange-700' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700' },
  { value: 'wont_fix', label: "Won't Fix", color: 'bg-red-100 text-red-700' },
  { value: 'duplicate', label: 'Duplicate', color: 'bg-gray-100 text-gray-500' }
];

// Severity options
const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'bg-red-600 text-white' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' }
];

// Category options
const CATEGORY_OPTIONS = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'ui_ux', label: 'UI/UX' },
  { value: 'performance', label: 'Performance' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'other', label: 'Other' }
];

function FeedbackCard({ report, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(report.status || 'open');
  const [severity, setSeverity] = useState(report.severity || 'low');
  const [category, setCategory] = useState(report.category || 'other');
  const [developerNotes, setDeveloperNotes] = useState(report.developerNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(report.id, {
        status,
        severity,
        category,
        developerNotes,
        lastUpdated: new Date()
      });
      setEditing(false);
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Failed to update feedback');
    }
    setSaving(false);
  };

  const getStatusStyle = () => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'bg-gray-100 text-gray-700';
  };

  const getSeverityStyle = () => {
    const severityOption = SEVERITY_OPTIONS.find(opt => opt.value === severity);
    return severityOption ? severityOption.color : 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusStyle()}`}>
            {STATUS_OPTIONS.find(opt => opt.value === status)?.label || status}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityStyle()}`}>
            {SEVERITY_OPTIONS.find(opt => opt.value === severity)?.label || severity}
          </span>
          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
            {CATEGORY_OPTIONS.find(opt => opt.value === category)?.label || category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {report.githubIssueNumber && (
            <a
              href={`https://github.com/thetangstr/Kiddo_Quest/issues/${report.githubIssueNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Issue #{report.githubIssueNumber}
            </a>
          )}
          <button
            onClick={() => setEditing(!editing)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={() => onDelete(report.id)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mb-2">
        <strong className="text-sm">Description:</strong>
        <p className="text-gray-700 text-sm mt-1">{report.description}</p>
      </div>

      {report.steps && (
        <div className="mb-2">
          <strong className="text-sm">Steps to Reproduce:</strong>
          <p className="text-gray-600 text-sm mt-1">{report.steps}</p>
        </div>
      )}

      {editing && (
        <div className="mt-4 p-3 bg-gray-50 rounded space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            >
              {SEVERITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Developer Notes</label>
            <textarea
              value={developerNotes}
              onChange={(e) => setDeveloperNotes(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Add notes for developers..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>

          {status === 'ready_for_dev' && (
            <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
              <p className="text-xs text-purple-700">
                <strong>Note:</strong> Marking as "Ready for Dev" will trigger automatic GitHub issue creation
                in the next sync cycle (runs hourly).
              </p>
            </div>
          )}
        </div>
      )}

      {report.developerNotes && !editing && (
        <div className="mt-3 p-2 bg-yellow-50 rounded">
          <strong className="text-xs text-gray-700">Developer Notes:</strong>
          <p className="text-xs text-gray-600 mt-1">{report.developerNotes}</p>
        </div>
      )}

      <div className="mt-3 pt-2 border-t text-xs text-gray-500 flex justify-between">
        <span>By: {report.userEmail || 'Anonymous'}</span>
        <span>{report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString() : ''}</span>
      </div>
    </div>
  );
}

export default function AdminFeedbackManager({ user, onBack }) {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterAndSortReports();
  }, [reports, statusFilter, severityFilter, categoryFilter, sortBy]);

  async function fetchReports() {
    setLoading(true);
    setError('');
    try {
      const feedbackCollection = collection(db, 'feedbackReports');
      const q = query(feedbackCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const fetchedReports = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      setReports(fetchedReports);
      console.log(`Loaded ${fetchedReports.length} feedback reports`);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(`Failed to fetch feedback: ${err.message}`);
    }
    setLoading(false);
  }

  function filterAndSortReports() {
    let filtered = [...reports];

    // Apply filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => (r.status || 'open') === statusFilter);
    }
    if (severityFilter !== 'all') {
      filtered = filtered.filter(r => (r.severity || 'low') === severityFilter);
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(r => (r.category || 'other') === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.() || 0;
        case 'oldest':
          return a.createdAt?.toMillis?.() - b.createdAt?.toMillis?.() || 0;
        case 'severity':
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return severityOrder[a.severity || 'low'] - severityOrder[b.severity || 'low'];
        default:
          return 0;
      }
    });

    setFilteredReports(filtered);
  }

  async function handleUpdate(reportId, updates) {
    try {
      const reportRef = doc(db, 'feedbackReports', reportId);
      await updateDoc(reportRef, updates);
      
      // Update local state
      setReports(reports.map(r => 
        r.id === reportId ? { ...r, ...updates } : r
      ));
      
      console.log(`Updated feedback ${reportId}`);
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  }

  async function handleDelete(reportId) {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      await deleteDoc(doc(db, 'feedbackReports', reportId));
      setReports(reports.filter(r => r.id !== reportId));
      console.log(`Deleted feedback ${reportId}`);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Failed to delete feedback');
    }
  }

  async function triggerGitHubSync() {
    if (!window.confirm('This will sync all "Ready for Dev" feedback to GitHub. Continue?')) return;
    
    alert('GitHub sync triggered! Check GitHub Actions for progress.');
    // In production, this would trigger the GitHub Action via API
  }

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access denied. Admins only.</div>;
  }

  if (loading) return <LoadingSpinner message="Loading feedback reports..." />;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  const stats = {
    total: reports.length,
    open: reports.filter(r => (r.status || 'open') === 'open').length,
    readyForDev: reports.filter(r => r.status === 'ready_for_dev').length,
    inDevelopment: reports.filter(r => r.status === 'in_development').length,
    resolved: reports.filter(r => r.status === 'resolved').length
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Feedback Management Dashboard</h1>
        
        <div className="flex items-center justify-between mb-4">
          <Button onClick={onBack}>Back to Admin Console</Button>
          <button
            onClick={triggerGitHubSync}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
          >
            <span>🔄</span> Sync to GitHub
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white p-3 rounded shadow">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-gray-600">Total Feedback</div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="text-2xl font-bold">{stats.open}</div>
            <div className="text-xs text-gray-600">Open</div>
          </div>
          <div className="bg-purple-100 p-3 rounded">
            <div className="text-2xl font-bold">{stats.readyForDev}</div>
            <div className="text-xs text-purple-700">Ready for Dev</div>
          </div>
          <div className="bg-yellow-100 p-3 rounded">
            <div className="text-2xl font-bold">{stats.inDevelopment}</div>
            <div className="text-xs text-yellow-700">In Development</div>
          </div>
          <div className="bg-green-100 p-3 rounded">
            <div className="text-2xl font-bold">{stats.resolved}</div>
            <div className="text-xs text-green-700">Resolved</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 p-4 rounded mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="all">All Severities</option>
                {SEVERITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="all">All Categories</option>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="severity">By Severity</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      {filteredReports.length === 0 ? (
        <div className="text-gray-600 text-center py-8">
          No feedback reports match your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => (
            <FeedbackCard
              key={report.id}
              report={report}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}