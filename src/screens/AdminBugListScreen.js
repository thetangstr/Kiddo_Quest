import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, LoadingSpinner } from '../components/UI';

export default function AdminBugListScreen({ user, onBack }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      setError('');
      try {
        console.log('Attempting to fetch bug reports...');
        
        // Create a reference to the feedbackReports collection
        const feedbackCollection = collection(db, 'feedbackReports');
        
        // Query the collection with ordering
        const q = query(feedbackCollection, orderBy('createdAt', 'desc'));
        
        // Get the documents
        const snapshot = await getDocs(q);
        
        console.log(`Retrieved ${snapshot.docs.length} bug reports`);
        
        // Map the documents to a more usable format
        setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching bug reports:', err);
        setError(`Failed to fetch bug reports: ${err.message || 'Please try again.'}`);
      }
      setLoading(false);
    }
    fetchReports();
  }, []);

  if (!user || user.email !== 'thetangstr@gmail.com') {
    return <div className="p-8 text-center text-red-600">Access denied. Admins only.</div>;
  }
  if (loading) return <LoadingSpinner message="Loading bug reports..." />;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Bug & Feedback Reports</h1>
      <Button onClick={onBack} className="mb-4">Back</Button>
      {reports.length === 0 ? (
        <div className="text-gray-600">No reports submitted yet.</div>
      ) : (
        <ul className="space-y-4">
          {reports.map(report => (
            <li key={report.id} className="border rounded-lg p-4 bg-white shadow">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${report.severity === 'high' ? 'bg-red-100 text-red-700' : report.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'}`}>{report.severity || 'low'}</span>
                <span className="text-xs text-gray-500">{report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString() : ''}</span>
                <span className="text-xs text-gray-500">{report.status || 'open'}</span>
              </div>
              <div className="mb-2"><strong>Description:</strong> {report.description}</div>
              {report.steps && <div className="mb-2"><strong>Steps:</strong> {report.steps}</div>}
              <div className="mb-1 text-xs text-gray-500">Reported by: {report.userEmail || 'Unknown'}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
