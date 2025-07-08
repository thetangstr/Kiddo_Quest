// Invitation manager for Kiddo Quest
// Handles creation, validation, and processing of user invitations

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  updateDoc, 
  doc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// Invitation status constants
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

// User roles
export const USER_ROLES = {
  PARENT: 'parent',
  CHILD: 'child',
  GUARDIAN: 'guardian'
};

/**
 * Create a new invitation in the database
 * @param {string} email - Email address of the invitee
 * @param {string} role - Role to assign (parent, child, guardian)
 * @param {string} familyId - ID of the family the invitee will join
 * @param {string} inviterId - ID of the user sending the invitation
 * @param {string} inviterName - Name of the user sending the invitation (optional)
 * @param {number} expiresInDays - Number of days until the invitation expires (default: 7)
 * @returns {Promise<object>} - The created invitation object
 */
export const createInvitation = async (
  email, 
  role, 
  familyId, 
  inviterId, 
  inviterName = '',
  expiresInDays = 7
) => {
  try {
    // Check if there's already a pending invitation for this email in this family
    const existingInvitations = await checkExistingInvitations(email, familyId);
    
    if (existingInvitations.length > 0) {
      return { 
        success: false, 
        error: 'An invitation has already been sent to this email address' 
      };
    }
    
    // Calculate expiration date (current time + expiration days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    // Create the invitation object
    const invitation = {
      email: email.toLowerCase().trim(),
      role,
      familyId,
      createdBy: inviterId,
      inviterName,
      status: INVITATION_STATUS.PENDING,
      createdAt: serverTimestamp(),
      expiresAt,
      // Generate a unique token for verification
      // This is a simple implementation - in production, use a more secure method
      token: generateInvitationToken()
    };
    
    // Add to Firestore
    const invitationRef = await addDoc(collection(db, 'invitations'), invitation);
    
    return { 
      success: true, 
      id: invitationRef.id,
      ...invitation
    };
  } catch (error) {
    console.error('Error creating invitation:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create invitation' 
    };
  }
};

/**
 * Check if there are existing pending invitations for an email in a family
 * @param {string} email - Email to check
 * @param {string} familyId - Family ID
 * @returns {Promise<Array>} - Array of matching invitations
 */
export const checkExistingInvitations = async (email, familyId) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    const q = query(
      collection(db, 'invitations'), 
      where('email', '==', normalizedEmail),
      where('familyId', '==', familyId),
      where('status', '==', INVITATION_STATUS.PENDING)
    );
    
    const querySnapshot = await getDocs(q);
    
    const invitations = [];
    querySnapshot.forEach(doc => {
      invitations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return invitations;
  } catch (error) {
    console.error('Error checking existing invitations:', error);
    return [];
  }
};

/**
 * Get all invitations for a family
 * @param {string} familyId - ID of the family
 * @returns {Promise<Array>} - Array of invitation objects
 */
export const getFamilyInvitations = async (familyId) => {
  try {
    const q = query(
      collection(db, 'invitations'), 
      where('familyId', '==', familyId)
    );
    
    const querySnapshot = await getDocs(q);
    
    const invitations = [];
    querySnapshot.forEach(doc => {
      invitations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return invitations;
  } catch (error) {
    console.error('Error getting family invitations:', error);
    return [];
  }
};

/**
 * Get invitations sent to a specific email
 * @param {string} email - Email to check for invitations
 * @returns {Promise<Array>} - Array of invitation objects
 */
export const getInvitationsByEmail = async (email) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    const q = query(
      collection(db, 'invitations'), 
      where('email', '==', normalizedEmail),
      where('status', '==', INVITATION_STATUS.PENDING)
    );
    
    const querySnapshot = await getDocs(q);
    
    const invitations = [];
    querySnapshot.forEach(doc => {
      invitations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return invitations;
  } catch (error) {
    console.error('Error getting email invitations:', error);
    return [];
  }
};

/**
 * Verify an invitation token and get the invitation details
 * @param {string} token - The invitation token
 * @returns {Promise<object>} - The invitation details or error
 */
export const verifyInvitation = async (token) => {
  try {
    const q = query(
      collection(db, 'invitations'), 
      where('token', '==', token),
      where('status', '==', INVITATION_STATUS.PENDING)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { 
        success: false, 
        error: 'Invalid or expired invitation' 
      };
    }
    
    // Get the invitation data
    const invitationDoc = querySnapshot.docs[0];
    const invitation = {
      id: invitationDoc.id,
      ...invitationDoc.data()
    };
    
    // Check if invitation has expired
    const now = new Date();
    const expiresAt = invitation.expiresAt.toDate();
    
    if (now > expiresAt) {
      // Update the status to expired
      await updateDoc(doc(db, 'invitations', invitation.id), {
        status: INVITATION_STATUS.EXPIRED
      });
      
      return { 
        success: false, 
        error: 'This invitation has expired' 
      };
    }
    
    return { success: true, invitation };
  } catch (error) {
    console.error('Error verifying invitation:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to verify invitation' 
    };
  }
};

/**
 * Accept an invitation
 * @param {string} invitationId - ID of the invitation
 * @param {string} userId - ID of the user accepting the invitation
 * @returns {Promise<object>} - Success or error response
 */
export const acceptInvitation = async (invitationId, userId) => {
  try {
    const invitationRef = doc(db, 'invitations', invitationId);
    const invitationSnap = await getDoc(invitationRef);
    
    if (!invitationSnap.exists()) {
      return { 
        success: false, 
        error: 'Invitation not found' 
      };
    }
    
    const invitation = invitationSnap.data();
    
    // Check if invitation is still pending
    if (invitation.status !== INVITATION_STATUS.PENDING) {
      return { 
        success: false, 
        error: `This invitation has already been ${invitation.status}` 
      };
    }
    
    // Update invitation status
    await updateDoc(invitationRef, {
      status: INVITATION_STATUS.ACCEPTED,
      acceptedBy: userId,
      acceptedAt: serverTimestamp()
    });
    
    return { 
      success: true, 
      invitation: {
        id: invitationSnap.id,
        ...invitation,
        status: INVITATION_STATUS.ACCEPTED
      }
    };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to accept invitation' 
    };
  }
};

/**
 * Reject an invitation
 * @param {string} invitationId - ID of the invitation
 * @returns {Promise<object>} - Success or error response
 */
export const rejectInvitation = async (invitationId) => {
  try {
    const invitationRef = doc(db, 'invitations', invitationId);
    await updateDoc(invitationRef, {
      status: INVITATION_STATUS.REJECTED,
      rejectedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to reject invitation' 
    };
  }
};

/**
 * Delete an invitation
 * @param {string} invitationId - ID of the invitation to delete
 * @returns {Promise<object>} - Success or error response
 */
export const deleteInvitation = async (invitationId) => {
  try {
    await deleteDoc(doc(db, 'invitations', invitationId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to delete invitation' 
    };
  }
};

/**
 * Generate a unique token for invitation verification
 * @returns {string} - A unique token
 */
const generateInvitationToken = () => {
  // Simple token generation - in production, use a more secure method
  const timestamp = new Date().getTime().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomStr}`;
};
