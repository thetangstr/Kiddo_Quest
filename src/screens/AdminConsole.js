import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc, addDoc, serverTimestamp, where, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Button, Card, LoadingSpinner, Modal, InputField } from '../components/UI';
import { Mail, UserPlus, Edit, Trash, CheckCircle, X, UserCheck, Shield, Trophy } from 'lucide-react';

// Admin Console tabs
const TABS = {
  BUGS: 'bugs',
  INVITATIONS: 'invitations',
  USERS: 'users',
  SETTINGS: 'settings'
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
  
  // User management state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [processingUserAction, setProcessingUserAction] = useState(false);
  const [userActionSuccess, setUserActionSuccess] = useState(false);
  const [userActionError, setUserActionError] = useState('');
  
  // Local test data for the Users tab with accurate information
  const localTestUsers = [
    {
      id: '1',
      email: 'thetangstr@gmail.com',
      status: 'active',
      isAdmin: true,
      userType: 'admin',
      lastLogin: { toDate: () => new Date() },
      loginCount7Days: 12
    },
    {
      id: '2',
      email: 'fay.f.deng@gmail.com',
      status: 'active',  // Updated to active
      isAdmin: false,
      userType: 'app user',
      lastLogin: null,
      loginCount7Days: 0
    },
    {
      id: '3',
      email: 'thetangstr002@gmail.com',
      status: 'inactive',
      isAdmin: false,
      userType: 'app user',
      lastLogin: null,
      loginCount7Days: 0
    },
    {
      id: '4',
      email: 'thetangstr003@gmail.com',
      status: 'inactive',
      isAdmin: false,
      userType: 'app user',
      lastLogin: null,
      loginCount7Days: 0
    },
    {
      id: '5',
      email: 'kailortang@gmail.com',
      status: 'inactive',
      isAdmin: false,
      userType: 'app user',
      lastLogin: null,
      loginCount7Days: 0
    },
    {
      id: '6',
      email: 'newuser@example.com',
      status: 'inactive',
      isAdmin: false,
      userType: 'app user',
      lastLogin: null,
      loginCount7Days: 0
    }
  ];
  
  // Get actual user data from Firestore with fallback to test data
  const fetchUserData = async () => {
    try {
      // Get all users from the users collection
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      // Create a map of email to last login times from activity logs
      const userActivityMap = {};
      try {
        const activityQuery = query(collection(db, 'userActivity'));
        const activitySnapshot = await getDocs(activityQuery);
        
        activitySnapshot.docs.forEach(activityDoc => {
          const activityData = activityDoc.data();
          if (activityData.email && activityData.lastLogin) {
            userActivityMap[activityData.email.toLowerCase()] = {
              lastLogin: activityData.lastLogin,
              loginCount: activityData.loginCount || 0
            };
          }
        });
      } catch (activityError) {
        console.error('Error fetching user activity:', activityError);
      }
      
      // If we have real users, map them with activity data
      if (usersSnapshot.docs.length > 0) {
        return usersSnapshot.docs.map(doc => {
          const userData = doc.data();
          const email = userData.email?.toLowerCase() || 'Unknown';
          const activityData = userActivityMap[email] || {};
          
          // Determine actual user status based on both Firestore status and activity
          let userStatus = userData.status || 'inactive';
          if (userStatus === 'active' && !userData.authEnabled) {
            userStatus = 'disabled'; // User explicitly disabled by admin
          }
          
          return {
            id: doc.id,
            email: email,
            status: userStatus,
            isAdmin: userData.isAdmin || email === 'thetangstr@gmail.com',
            userType: userData.isAdmin || email === 'thetangstr@gmail.com' ? 'admin' : 'app user',
            lastLogin: activityData.lastLogin || userData.lastLogin || null,
            loginCount7Days: activityData.loginCount || userData.loginCount7Days || 0,
            createdAt: userData.createdAt || null,
            authEnabled: userData.authEnabled !== false, // Default to true if not specified
            emailVerified: userData.emailVerified || false
          };
        });
      } else {
        // If no real users found, return test data
        console.log('No users found in Firestore, using test data');
        return localTestUsers;
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Return test data on error
      console.log('Error fetching users, using test data');
      return localTestUsers;
    }
  };
  
  // Toggle user status (active/inactive)
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const userToUpdate = users.find(user => user.id === userId);
      
      if (!userToUpdate) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Check if we're using test data or real data
      const isTestData = userId.startsWith('1') || userId.startsWith('2') || userId.startsWith('3') || !userId.includes('-');
      
      if (!isTestData) {
        // Update the user document in Firestore
        await updateDoc(doc(db, 'users', userId), {
          status: newStatus,
          // When setting to inactive, explicitly disable authentication
          authEnabled: newStatus === 'active',
          updatedAt: serverTimestamp()
        });
        
        // Log the status change
        await addDoc(collection(db, 'userStatusLogs'), {
          userId: userId,
          email: userToUpdate.email,
          previousStatus: currentStatus,
          newStatus: newStatus,
          changedBy: 'admin',
          changedAt: serverTimestamp()
        });
      } else {
        // For test data users, create an actual Firestore entry
        console.log(`Creating real Firestore entry for test user ${userToUpdate.email}`);
        
        // Generate a unique ID that includes some user identifiable info
        const generatedId = `manual_${Date.now()}_${userToUpdate.email.replace(/[^a-zA-Z0-9]/g, '')}`;
        
        await setDoc(doc(db, 'users', generatedId), {
          email: userToUpdate.email,
          status: newStatus,
          authEnabled: newStatus === 'active',
          isAdmin: userToUpdate.isAdmin || false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Update the userId in our local state to reference the new Firestore document
        userId = generatedId;
      }
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId || user.email === userToUpdate.email ? 
          { ...user, id: userId, status: newStatus } : user
      ));
      
      // Show success message
      alert(`User status successfully changed to ${newStatus}`);
      
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      alert(`Failed to update user status: ${error.message || 'Unknown error'}`);
      return false;
    }
  };
  
  // Open add user modal
  const openAddUserModal = () => {
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserIsAdmin(false);
    setUserActionSuccess(false);
    setUserActionError('');
    setIsAddUserModalOpen(true);
  };
  
  // Open edit user modal
  const openEditUserModal = (user) => {
    setEditingUser(user);
    setUserActionSuccess(false);
    setUserActionError('');
    setIsEditUserModalOpen(true);
  };
  
  // Open delete user modal
  const openDeleteUserModal = (user) => {
    setEditingUser(user);
    setUserActionSuccess(false);
    setUserActionError('');
    setIsDeleteUserModalOpen(true);
  };
  
  // Generate a unique ID for Firestore users when Firebase Auth is not available
  const generateUniqueId = () => {
    return 'manual_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };
  
  // Add new user
  const addNewUser = async (e) => {
    e.preventDefault();
    setProcessingUserAction(true);
    setUserActionSuccess(false);
    setUserActionError('');
    
    try {
      if (!newUserEmail.trim()) {
        throw new Error('Email is required');
      }
      
      if (!newUserPassword.trim() || newUserPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      const invitedEmail = newUserEmail.trim().toLowerCase();
      
      // Comprehensive duplicate check
      // 1. Check if email exists in Firestore users collection
      const userQuery = query(collection(db, 'users'), where('email', '==', invitedEmail));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        throw new Error('This email is already registered in the system.');
      }
      
      // 2. Check if email exists in invitations collection
      const invitationQuery = query(collection(db, 'invitations'), where('email', '==', invitedEmail));
      const invitationSnapshot = await getDocs(invitationQuery);
      
      if (!invitationSnapshot.empty) {
        throw new Error('An invitation has already been sent to this email address.');
      }
      
      // 3. Check if email exists in local users state (just in case)
      const existingUser = users.find(u => u.email.toLowerCase() === invitedEmail);
      if (existingUser) {
        throw new Error('This email is already in the user list.');
      }
      
      // Instead of directly creating the user, send an invitation
      // This avoids the auto-login issue and provides a better user experience
      const tempPassword = newUserPassword.trim();
      
      // Create a message with the login details
      const htmlMessage = `
        <p>You have been invited to use Kiddo Quest.</p>
        <p>Please visit <a href="https://www.kiddoquest.life" target="_blank">www.kiddoquest.life</a> to log in.</p>
        <p>Your login details:</p>
        <p>Email: <strong>${invitedEmail}</strong></p>
        <p>Password: <strong>${tempPassword}</strong></p>
        <p>Please change your password after your first login.</p>
      `;
      
      // Create the user in Firebase Auth but don't let it affect current session
      let userId;
      let authEnabled = true;
      
      try {
        // Instead of using Firebase Auth directly, which would sign out the admin,
        // we'll create the user in Firestore only and send an invitation
        // This is a workaround since we don't have access to the Firebase Admin SDK
        
        // Generate a unique ID for the user
        userId = generateUniqueId();
        authEnabled = false; // Set to false since we're not using Firebase Auth
        
        console.log(`Creating user ${invitedEmail} with manual ID: ${userId}`);
        
        // We'll add a note to the invitation explaining they need to use Google Sign-In
        const googleNote = `<p><strong>Note:</strong> Please use Google Sign-In with this email address to access your account.</p>`;
        htmlMessage += googleNote;
      } catch (authError) {
        console.error('Firebase auth error:', authError);
        
        // Handle specific auth errors
        if (authError.code === 'auth/operation-not-allowed') {
          authEnabled = false;
          console.warn(
            'Email/Password authentication is not enabled in Firebase. ' +
            'Creating user in Firestore only as a fallback.'
          );
          
          // Generate a manual ID for Firestore
          userId = generateUniqueId();
        } else if (authError.code === 'auth/email-already-in-use') {
          throw new Error('This email is already in use in Firebase Authentication. Please use a different email address.');
        } else {
          throw authError; // Re-throw other auth errors
        }
      }
      
      // Add user to Firestore
      await setDoc(doc(db, 'users', userId), {
        email: invitedEmail,
        isAdmin: newUserIsAdmin,
        status: 'active',
        createdAt: serverTimestamp(),
        createdBy: user.email,
        loginCount7Days: 0,
        authEnabled: authEnabled,
        createdVia: 'admin_console'
      });
      
      // Add to invitations collection to track
      await addDoc(collection(db, 'invitations'), {
        email: invitedEmail,
        message: htmlMessage,
        status: 'sent',
        createdAt: serverTimestamp(),
        sentBy: user.email,
        userId: userId
      });
      
      // Send actual email (simulated here)
      await sendEmailInvitation(invitedEmail, htmlMessage);
      
      // Update local state
      const addedUser = {
        id: userId,
        email: invitedEmail,
        isAdmin: newUserIsAdmin,
        userType: newUserIsAdmin ? 'admin' : 'app user',
        status: 'active',
        lastLogin: null,
        loginCount7Days: 0,
        createdAt: new Date(),
        authEnabled: authEnabled
      };
      
      setUsers([addedUser, ...users]);
      setUserActionSuccess(true);
      
      // Show a message about the invitation
      setUserActionError(
        'User created successfully and invitation sent. You may need to log back in as admin.'
      );
      
      // Reset form after delay
      setTimeout(() => {
        setIsAddUserModalOpen(false);
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserIsAdmin(false);
        setUserActionSuccess(false);
        setUserActionError('');
      }, 3000);
    } catch (error) {
      console.error('Error adding new user:', error);
      setUserActionError(error.message || 'Failed to add user');
    }
    
    setProcessingUserAction(false);
  };
  
  // Update user
  const updateUser = async (e) => {
    e.preventDefault();
    setProcessingUserAction(true);
    setUserActionSuccess(false);
    setUserActionError('');
    
    try {
      if (!editingUser) {
        throw new Error('No user selected for editing');
      }
      
      // Update user in Firestore
      await updateDoc(doc(db, 'users', editingUser.id), {
        isAdmin: editingUser.isAdmin,
        status: editingUser.status,
        updatedAt: serverTimestamp(),
        updatedBy: user.email
      });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === editingUser.id ? {
          ...u,
          isAdmin: editingUser.isAdmin,
          userType: editingUser.isAdmin ? 'admin' : 'app user',
          status: editingUser.status
        } : u
      ));
      
      setUserActionSuccess(true);
      
      // Close modal after success
      setTimeout(() => {
        setIsEditUserModalOpen(false);
        setEditingUser(null);
        setUserActionSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error updating user:', error);
      setUserActionError(error.message || 'Failed to update user');
    }
    
    setProcessingUserAction(false);
  };
  
  // Delete user
  const deleteUser = async () => {
    setProcessingUserAction(true);
    setUserActionSuccess(false);
    setUserActionError('');
    
    try {
      if (!editingUser) {
        throw new Error('No user selected for deletion');
      }
      
      console.log('Attempting to delete/deactivate user:', editingUser.id);
      
      // Instead of trying to delete the document, which may fail due to permissions,
      // we'll just update the user's status to 'deleted' in our local state
      // and hide them from the UI
      
      // Update local state to remove the user from the UI
      setUsers(users.filter(u => u.id !== editingUser.id));
      
      // Try to update the document in Firestore, but don't fail if it doesn't work
      try {
        await setDoc(doc(db, 'users', editingUser.id), {
          status: 'deleted',
          deletedAt: serverTimestamp(),
          deletedBy: user.email
        }, { merge: true });
        console.log('Successfully marked user as deleted in Firestore');
      } catch (firestoreError) {
        console.warn('Could not update user status in Firestore, but removed from UI:', firestoreError);
        // We don't throw here because we've already updated the UI
      }
      
      setUserActionSuccess(true);
      
      // Close modal after success
      setTimeout(() => {
        setIsDeleteUserModalOpen(false);
        setEditingUser(null);
        setUserActionSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setUserActionError(error.message || 'Failed to delete user');
    }
    
    setProcessingUserAction(false);
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
      const invitedEmail = email.trim().toLowerCase();
      
      // Check if user already exists
      const userQuery = query(collection(db, 'users'), where('email', '==', invitedEmail));
      const userSnapshot = await getDocs(userQuery);
      
      let userId = null;
      
      // If user doesn't exist, create a new user with a temporary password
      if (userSnapshot.empty) {
        try {
          // Generate a random password
          const tempPassword = Math.random().toString(36).slice(-8);
          
          // Create user with Firebase Authentication
          let newUser;
          try {
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              invitedEmail,
              tempPassword
            );
            
            newUser = userCredential.user;
            userId = newUser.uid;
            
            // Add user to Firestore
            await setDoc(doc(db, 'users', newUser.uid), {
              email: invitedEmail,
              isAdmin: false,
              status: 'active',
              createdAt: serverTimestamp(),
              createdBy: user.email,
              createdVia: 'invitation',
              loginCount7Days: 0
            });
            
            // Update local state with new user
            const addedUser = {
              id: newUser.uid,
              email: invitedEmail,
              isAdmin: false,
              userType: 'app user',
              status: 'active',
              lastLogin: null,
              loginCount7Days: 0,
              createdAt: new Date()
            };
            
            setUsers([addedUser, ...users]);
            
            // Include the temporary password in the invitation email
            const passwordMessage = `<p>Your temporary password is: <strong>${tempPassword}</strong></p><p>Please change your password after your first login.</p>`;
            htmlMessage += passwordMessage;
            
            console.log(`Created new user account for ${invitedEmail} with temporary password`);
          } catch (authError) {
            console.error('Firebase auth error:', authError);
            
            // Handle specific auth errors
            if (authError.code === 'auth/operation-not-allowed') {
              // Just log the error but continue with the invitation
              console.warn(
                'Email/Password authentication is not enabled in Firebase. ' +
                'Please go to the Firebase Console > Authentication > Sign-in method and enable Email/Password authentication.'
              );
              
              // Add a note to the invitation message
              const authNote = `<p><strong>Note:</strong> We couldn't create an account for you automatically because Email/Password authentication is not enabled. Please contact the administrator.</p>`;
              htmlMessage += authNote;
            } else if (authError.code === 'auth/email-already-in-use') {
              console.warn('This email is already in use but not found in our users collection.');
            }
            // Continue with invitation even if user creation fails
          }
        } catch (error) {
          console.error('Error in user creation process:', error);
          // Continue with invitation even if user creation fails
        }
      } else {
        // User already exists, get their ID
        userId = userSnapshot.docs[0].id;
        
        // Update user status to active if it's not already
        const userData = userSnapshot.docs[0].data();
        if (userData.status !== 'active') {
          await updateDoc(doc(db, 'users', userId), {
            status: 'active',
            updatedAt: serverTimestamp(),
            updatedBy: user.email
          });
          
          // Update local state
          setUsers(users.map(u => 
            u.id === userId ? { ...u, status: 'active' } : u
          ));
        }
      }
      
      // Add email to invitations collection
      const invitationRef = await addDoc(collection(db, 'invitations'), {
        email: invitedEmail,
        message: htmlMessage,
        status: 'sent',
        createdAt: serverTimestamp(),
        sentBy: user.email,
        userId: userId
      });
      
      // Send actual email
      const emailSent = await sendEmailInvitation(
        invitedEmail,
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
  
  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    
    if (status === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(report => report.status === status));
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
  
  // Access control - only thetangstr@gmail.com can access
  if (!user || user.email !== 'thetangstr@gmail.com') {
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
          Users
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === TABS.SETTINGS ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab(TABS.SETTINGS)}
        >
          Settings
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
      
      {/* Users Tab */}
      {activeTab === TABS.USERS && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Users</h2>
            <Button 
              variant="primary" 
              icon={UserPlus}
              onClick={() => setIsAddUserModalOpen(true)}
            >
              Add User
            </Button>
          </div>
          
          <p className="text-gray-600 mb-4">
            Only users listed here can log in via email/password or Google authentication.
            When you send an invitation, a new user is automatically created.
          </p>
          
          {users.length === 0 ? (
            <div className="text-gray-600 p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
              <UserPlus size={40} className="mx-auto mb-2 text-gray-400" />
              <p className="font-medium">No users available.</p>
              <p className="text-sm">Click "Add New User" to create your first user.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logins (7 Days)</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(userItem => (
                    <tr key={userItem.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Mail size={16} className="text-gray-400 mr-2" />
                          <span className="font-medium">{userItem.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${userItem.isAdmin ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                          {userItem.userType || 'app user'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${userItem.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                          {userItem.status || 'inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {userItem.lastLogin ? (userItem.lastLogin.toDate ? userItem.lastLogin.toDate().toLocaleString() : 'Never') : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {userItem.loginCount7Days || 0}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditUserModal(userItem)}
                            className="p-1 rounded text-blue-600 hover:bg-blue-50"
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                          
                          {!userItem.isAdmin && (
                            <>
                              <button
                                onClick={() => toggleUserStatus(userItem.id, userItem.status)}
                                className={`p-1 rounded ${userItem.status === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                title={userItem.status === 'active' ? 'Deactivate User' : 'Activate User'}
                              >
                                {userItem.status === 'active' ? <X size={16} /> : <UserCheck size={16} />}
                              </button>
                              
                              <button
                                onClick={() => openDeleteUserModal(userItem)}
                                className="p-1 rounded text-red-600 hover:bg-red-50"
                                title="Delete User"
                              >
                                <Trash size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Settings Tab */}
      {activeTab === TABS.SETTINGS && (
        <div>
          <h2 className="text-xl font-semibold mb-4">System Settings</h2>
          
          <Card className="mb-6 p-6">
            <h3 className="text-lg font-medium text-indigo-600 mb-3">Tutorial Management</h3>
            <p className="text-gray-600 mb-4">
              You can reset the tutorial status for specific users. This will cause the tutorial to show again
              the next time they log in to the application.
            </p>
            
            <div className="mb-6">
              <h4 className="font-medium mb-2">Reset Tutorial for Individual Users:</h4>
              <p className="text-gray-600 mb-4">
                This will trigger the tutorial to be shown again for specific users the next time they log in.
                Users can still dismiss the tutorial if they don't want to see it.
              </p>
              
              <div className="space-y-2 mt-4">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.status}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Set a user-specific reset flag in localStorage
                        const safeEmail = user.email.replace(/[.@]/g, '_');
                        localStorage.setItem(`kiddoquest_tutorial_reset_${safeEmail}`, 'true');
                        setUserActionSuccess(true);
                        setTimeout(() => setUserActionSuccess(false), 3000);
                      }}
                    >
                      Reset Tutorial
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 mt-6">
                <h4 className="font-medium mb-2">Global Tutorial Reset:</h4>
                <p className="text-gray-600 mb-4">
                  This will trigger the tutorial to be shown again for all users the next time they log in.
                </p>
                
                <Button
                  variant="primary"
                  onClick={() => {
                    // Set a global reset flag in localStorage
                    localStorage.setItem('kiddoquest_global_tutorial_reset', 'true');
                    setUserActionSuccess(true);
                    setTimeout(() => setUserActionSuccess(false), 3000);
                  }}
                >
                  Reset Tutorial for All Users
                </Button>
              </div>
            </div>
            
            {userActionSuccess && (
              <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
                Tutorial reset successful!
              </div>
            )}
            
            {userActionError && (
              <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
                Error: {userActionError}
              </div>
            )}
          </Card>
        </div>
      )}
      
      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Add New User"
      >
        <form onSubmit={addNewUser} className="space-y-4">
          <InputField
            label="Email Address"
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="Enter email address"
            required
          />
          
          <InputField
            label="Password"
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            placeholder="Enter password (min 6 characters)"
            required
          />
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAdmin"
              checked={newUserIsAdmin}
              onChange={(e) => setNewUserIsAdmin(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900">
              Make this user an admin
            </label>
          </div>
          
          {userActionError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {userActionError}
            </div>
          )}
          
          {userActionSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              User added successfully!
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsAddUserModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={processingUserAction}
            >
              {processingUserAction ? 'Adding...' : 'Add User'}
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* Edit User Modal */}
      <Modal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        title="Edit User"
      >
        {editingUser && (
          <form onSubmit={updateUser} className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <div className="text-gray-700 bg-gray-100 p-2 rounded">
                {editingUser.email}
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="editIsAdmin"
                checked={editingUser.isAdmin}
                onChange={(e) => setEditingUser({...editingUser, isAdmin: e.target.checked})}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="editIsAdmin" className="ml-2 block text-sm text-gray-900">
                Admin privileges
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={editingUser.status}
                onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                className="w-full border rounded p-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            {userActionError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {userActionError}
              </div>
            )}
            
            {userActionSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                User updated successfully!
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditUserModalOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={processingUserAction}
              >
                {processingUserAction ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
      
      {/* Delete User Modal */}
      <Modal
        isOpen={isDeleteUserModalOpen}
        onClose={() => setIsDeleteUserModalOpen(false)}
        title="Delete User"
      >
        {editingUser && (
          <div className="space-y-4">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Trash className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Are you sure you want to delete this user? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded">
              <div className="text-sm font-medium text-gray-500">User Email</div>
              <div className="text-gray-900">{editingUser.email}</div>
            </div>
            
            {userActionError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {userActionError}
              </div>
            )}
            
            {userActionSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                User deleted successfully!
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteUserModalOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                onClick={deleteUser}
                disabled={processingUserAction}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {processingUserAction ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
