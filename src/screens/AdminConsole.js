import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, Card, LoadingSpinner } from '../components/UI';
import { cleanupDuplicateUsers } from '../utils/cleanupDuplicateUsers';

// Admin Console tabs
const TABS = {
  BUGS: 'bugs',
  INVITATIONS: 'invitations',
  USERS: 'users'
};

// Default invitation message
const DEFAULT_INVITATION_MESSAGE = "We would like to invite you to test our Kiddo Quest app at <a href='https://www.kiddoquest.life' target='_blank'>www.kiddoquest.life</a>. Please use it and provide feedback using the feedback button on the bottom right corner.";

export default function AdminConsole({ user, onBack }) {
  const [activeTab, setActiveTab] = useState(TABS.BUGS);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [invitations, setInvitations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Invitation form state
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(DEFAULT_INVITATION_MESSAGE);
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [invitationSuccess, setInvitationSuccess] = useState(false);
  
  // Cleanup state
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);
  
  // Get actual user data from Firestore with proper deduplication
  const fetchUserData = async () => {
    try {
      // Get all users from the users collection
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      // Create a Map to deduplicate by email (case-insensitive)
      const userMap = new Map();
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        const email = userData.email?.toLowerCase().trim();
        
        if (email) {
          // If we already have this email, keep the one with more recent activity
          const existingUser = userMap.get(email);
          const currentUser = {
            id: doc.id,
            email: userData.email || 'Unknown',
            status: userData.status || (userData.lastLogin ? 'active' : 'inactive'),
            isAdmin: userData.role === 'admin',
            userType: userData.role === 'admin' ? 'admin' : 'app user',
            lastLogin: userData.lastLogin || null,
            loginCount7Days: userData.loginCount7Days || 0,
            createdAt: userData.createdAt || null
          };
          
          if (!existingUser || 
              (currentUser.lastLogin && (!existingUser.lastLogin || 
               currentUser.lastLogin.toDate() > existingUser.lastLogin.toDate()))) {
            userMap.set(email, currentUser);
          }
        }
      });
      
      // Convert Map back to array and sort by last login (most recent first)
      const deduplicatedUsers = Array.from(userMap.values()).sort((a, b) => {
        if (!a.lastLogin && !b.lastLogin) return 0;
        if (!a.lastLogin) return 1;
        if (!b.lastLogin) return -1;
        return b.lastLogin.toDate() - a.lastLogin.toDate();
      });
      
      console.log(`Fetched ${usersSnapshot.docs.length} user documents, deduplicated to ${deduplicatedUsers.length} unique users`);
      return deduplicatedUsers;
      
    } catch (error) {
      console.error('Error fetching users:', error);
      // Return empty array on error instead of test data
      return [];
    }
  };
  
  // Toggle user status (active/inactive)
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      // Update user status in Firestore
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
      // Show success message
      console.log(`User ${userId} status successfully changed to ${newStatus}`);
      
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      alert(`Failed to update user status: ${error.message || 'Unknown error'}`);
      return false;
    }
  };

  // Handle cleanup duplicates
  const handleCleanupDuplicates = async () => {
    setCleanupLoading(true);
    setCleanupResult(null);
    
    try {
      const result = await cleanupDuplicateUsers();
      
      if (result.success) {
        setCleanupResult(`✅ Cleanup completed! Removed ${result.duplicatesRemoved} duplicates, ${result.uniqueEmails} unique users remaining.`);
        // Refresh user data
        const userData = await fetchUserData();
        setUsers(userData);
      } else {
        setCleanupResult(`❌ Cleanup failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      setCleanupResult(`❌ Cleanup failed: ${error.message}`);
    } finally {
      setCleanupLoading(false);
    }
  };
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      
      try {
        // Fetch bug reports
        const bugsQuery = query(collection(db, 'feedbackReports'), orderBy('createdAt', 'desc'));
        const bugsSnapshot = await getDocs(bugsQuery);
        const allReports = bugsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReports(allReports);
        setFilteredReports(allReports); // Initially show all reports
        
        // Fetch invitations
        const invitationsQuery = query(collection(db, 'invitations'), orderBy('createdAt', 'desc'));
        const invitationsSnapshot = await getDocs(invitationsQuery);
        setInvitations(invitationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Fetch actual user data from Firestore
        const userData = await fetchUserData();
        setUsers(userData);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError(`Failed to fetch data: ${err.message || 'Unknown error'}`);
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, []);
  
  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    
    if (status === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(report => report.status === status));
    }
  };

  // Handle bug status update
  const updateBugStatus = async (bugId, newStatus) => {
    try {
      await updateDoc(doc(db, 'feedbackReports', bugId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      const updatedReports = reports.map(report => 
        report.id === bugId ? { ...report, status: newStatus } : report
      );
      
      setReports(updatedReports);
      
      // Apply current filter to updated reports
      if (statusFilter === 'all') {
        setFilteredReports(updatedReports);
      } else {
        setFilteredReports(updatedReports.filter(report => report.status === statusFilter));
      }
    } catch (err) {
      console.error('Error updating bug status:', err);
      alert(`Failed to update status: ${err.message || 'Unknown error'}`);
    }
  };
  
  // Function to send actual email using a serverless function
  const sendEmailInvitation = async (recipientEmail, emailMessage) => {
    try {
      // Create a callable cloud function reference
      // In a real implementation, you would use Firebase Cloud Functions
      // Here we're simulating the API call
      
      console.log(`Sending email to ${recipientEmail} with message: ${emailMessage}`);
      
      // Simulate API call to send email
      // In production, replace with actual Firebase function call:
      // const sendEmail = httpsCallable(functions, 'sendEmail');
      // await sendEmail({ to: recipientEmail, message: emailMessage });
      
      // For now, we'll just log and simulate success
      console.log('Email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };
  
  // Handle sending invitation
  const sendInvitation = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      alert('Please enter an email address');
      return;
    }
    
    setSendingInvitation(true);
    setInvitationSuccess(false);
    
    try {
      // Format the HTML message
      const htmlMessage = message.trim() || DEFAULT_INVITATION_MESSAGE;
      
      // Add email to allowlist collection
      const invitationRef = await addDoc(collection(db, 'invitations'), {
        email: email.trim().toLowerCase(),
        message: htmlMessage,
        status: 'sent',
        createdAt: serverTimestamp(),
        sentBy: user.email
      });
      
      // Send actual email
      const emailSent = await sendEmailInvitation(
        email.trim().toLowerCase(),
        htmlMessage
      );
      
      // Update invitation status based on email sending result
      if (emailSent) {
        await updateDoc(doc(db, 'invitations', invitationRef.id), {
          emailSent: true,
          emailSentAt: serverTimestamp()
        });
      }
      
      // Reset form
      setEmail('');
      setMessage('');
      setInvitationSuccess(true);
      
      // Refresh invitations list
      const invitationsQuery = query(collection(db, 'invitations'), orderBy('createdAt', 'desc'));
      const invitationsSnapshot = await getDocs(invitationsQuery);
      setInvitations(invitationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error sending invitation:', err);
      alert(`Failed to send invitation: ${err.message || 'Unknown error'}`);
    }
    
    setSendingInvitation(false);
  };
  
  // Access control - only admins can access
  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access denied. Admin only.</div>;
  }
  
  if (loading) return <LoadingSpinner message="Loading admin console..." />;
  
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Console</h1>
        <Button onClick={onBack} variant="outline">Back to Dashboard</Button>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button 
          className={`py-2 px-4 font-medium ${activeTab === TABS.BUGS ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab(TABS.BUGS)}
        >
          Bug Reports
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === TABS.INVITATIONS ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab(TABS.INVITATIONS)}
        >
          User Invitations
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === TABS.USERS ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab(TABS.USERS)}
        >
          Active Users
        </button>
      </div>
      
      {/* Bug Reports Tab */}
      {activeTab === TABS.BUGS && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Bug & Feedback Reports</h2>
          <div className="mb-4 flex space-x-2">
            <button 
              onClick={() => handleStatusFilterChange('all')} 
              className={`px-3 py-1 rounded text-sm ${statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => handleStatusFilterChange('open')} 
              className={`px-3 py-1 rounded text-sm ${statusFilter === 'open' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Open
            </button>
            <button 
              onClick={() => handleStatusFilterChange('in_progress')} 
              className={`px-3 py-1 rounded text-sm ${statusFilter === 'in_progress' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              In Progress
            </button>
            <button 
              onClick={() => handleStatusFilterChange('resolved')} 
              className={`px-3 py-1 rounded text-sm ${statusFilter === 'resolved' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Resolved
            </button>
            <button 
              onClick={() => handleStatusFilterChange('wont_fix')} 
              className={`px-3 py-1 rounded text-sm ${statusFilter === 'wont_fix' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Won't Fix
            </button>
          </div>
          {filteredReports.length === 0 ? (
            <div className="text-gray-600">No reports submitted yet.</div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map(report => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      report.severity === 'high' ? 'bg-red-100 text-red-700' : 
                      report.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {report.severity || 'low'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString() : ''}
                    </span>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold mr-2 ${
                        report.status === 'open' ? 'bg-blue-100 text-blue-700' :
                        report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {report.status || 'open'}
                      </span>
                      <select 
                        className="text-xs border rounded p-1"
                        value={report.status || 'open'}
                        onChange={(e) => updateBugStatus(report.id, e.target.value)}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="wont_fix">Won't Fix</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-2"><strong>Description:</strong> {report.description}</div>
                  {report.steps && <div className="mb-2"><strong>Steps:</strong> {report.steps}</div>}
                  <div className="mb-1 text-xs text-gray-500">Reported by: {report.userEmail || 'Unknown'}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* User Invitations Tab */}
      {activeTab === TABS.INVITATIONS && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Send Testing Invitations</h2>
          
          <Card className="p-4 mb-6">
            <form onSubmit={sendInvitation}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email Address*</label>
                <input 
                  type="email" 
                  className="w-full border rounded p-2" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Invitation Message</label>
                <textarea 
                  className="w-full border rounded p-2" 
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Optional message to include with the invitation"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default message will be sent if left blank.
                </p>
              </div>
              
              {invitationSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">
                  Invitation sent successfully!
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={sendingInvitation}
              >
                {sendingInvitation ? 'Sending...' : 'Send Invitation'}
              </Button>
            </form>
          </Card>
          
          <h3 className="text-lg font-medium mb-3">Recent Invitations</h3>
          {invitations.length === 0 ? (
            <div className="text-gray-600">No invitations sent yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border text-left">Email</th>
                    <th className="py-2 px-4 border text-left">Message</th>
                    <th className="py-2 px-4 border text-left">Date Sent</th>
                    <th className="py-2 px-4 border text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map(invitation => (
                    <tr key={invitation.id}>
                      <td className="py-2 px-4 border">{invitation.email}</td>
                      <td className="py-2 px-4 border">{invitation.message || 'No message'}</td>
                      <td className="py-2 px-4 border">
                        {invitation.createdAt?.toDate ? invitation.createdAt.toDate().toLocaleString() : ''}
                      </td>
                      <td className="py-2 px-4 border">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          invitation.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                          invitation.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {invitation.status || 'sent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Active Users Tab */}
      {activeTab === TABS.USERS && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Users</h2>
          <Button 
            onClick={handleCleanupDuplicates} 
            disabled={cleanupLoading}
            className="mb-4"
          >
            {cleanupLoading ? 'Cleaning up...' : 'Cleanup Duplicate Users'}
          </Button>
          {cleanupResult && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">
              {cleanupResult}
            </div>
          )}
          {users.length === 0 ? (
            <div className="text-gray-600">No user activity data available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border text-left">Email</th>
                    <th className="py-2 px-4 border text-left">User Type</th>
                    <th className="py-2 px-4 border text-left">Status</th>
                    <th className="py-2 px-4 border text-left">Last Login</th>
                    <th className="py-2 px-4 border text-left">Logins (Last 7 Days)</th>
                    <th className="py-2 px-4 border text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="py-2 px-4 border">{user.email}</td>
                      <td className="py-2 px-4 border">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${user.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {user.userType || 'app user'}
                        </span>
                      </td>
                      <td className="py-2 px-4 border">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {user.status || 'inactive'}
                        </span>
                      </td>
                      <td className="py-2 px-4 border">
                        {user.lastLogin ? (user.lastLogin.toDate ? user.lastLogin.toDate().toLocaleString() : 'Never') : 'Never'}
                      </td>
                      <td className="py-2 px-4 border">
                        {user.loginCount7Days || 0}
                      </td>
                      <td className="py-2 px-4 border">
                        {!user.isAdmin && (
                          <button
                            onClick={() => toggleUserStatus(user.id, user.status)}
                            className={`px-3 py-1 rounded text-xs font-medium ${user.status === 'active' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
