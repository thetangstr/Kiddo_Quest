import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Button } from './UI';

export default function FeedbackModal({ open, onClose, user }) {
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [severity, setSeverity] = useState('low');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Check if user is authenticated
    if (!user?.uid) {
      setError('You must be logged in to submit feedback. Please log in and try again.');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Submitting feedback with userId:', user.uid);
      
      // Ensure the collection exists by attempting to create it
      const feedbackCollection = collection(db, 'feedbackReports');
      
      // Add the document to the collection
      await addDoc(feedbackCollection, {
        userId: user.uid,
        userEmail: user.email || '',
        description,
        steps,
        severity,
        createdAt: serverTimestamp(),
        status: 'open',
      });
      
      console.log('Feedback submitted successfully');
      setSuccess(true);
      setDescription('');
      setSteps('');
      setSeverity('low');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      console.error('Error details:', { 
        code: err.code, 
        message: err.message,
        userId: user?.uid,
        userEmail: user?.email 
      });
      setError(`Failed to submit feedback: ${err.message || 'Please try again.'}`);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Feedback / Bug Report</h2>
        {success ? (
          <div className="text-green-600 mb-4">Thank you for your feedback!</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block mb-2 font-medium">Description*</label>
            <textarea className="w-full border rounded p-2 mb-4" required rows={3} value={description} onChange={e => setDescription(e.target.value)} />
            <label className="block mb-2 font-medium">Steps to Reproduce</label>
            <textarea className="w-full border rounded p-2 mb-4" rows={2} value={steps} onChange={e => setSteps(e.target.value)} />
            <label className="block mb-2 font-medium">Severity</label>
            <select className="w-full border rounded p-2 mb-4" value={severity} onChange={e => setSeverity(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
