/**
 * Admin Role Management System
 * Database-driven admin role assignment instead of hardcoded emails
 */

import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import logger from './logger';

/**
 * Check if a user has admin privileges
 * @param {string} userId - The user's UID
 * @returns {Promise<boolean>} True if user is admin
 */
export async function isUserAdmin(userId) {
  try {
    if (!userId) return false;

    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    return userData.role === 'admin' && userData.status === 'active';
  } catch (error) {
    logger.error('Error checking admin status', error, { userId });
    return false;
  }
}

/**
 * Get all admin users
 * @returns {Promise<Array>} List of admin users
 */
export async function getAllAdmins() {
  try {
    const adminsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'admin'),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(adminsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error('Error fetching admin users', error);
    return [];
  }
}

/**
 * Promote a user to admin role
 * @param {string} userId - The user ID to promote
 * @param {string} promotedBy - The admin performing the promotion
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function promoteToAdmin(userId, promotedBy) {
  try {
    // Verify the person doing the promotion is an admin
    const isPromoteAdmin = await isUserAdmin(promotedBy);
    if (!isPromoteAdmin) {
      return { success: false, error: 'Only admins can promote users' };
    }

    // Check if user exists
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    // Update user role
    await updateDoc(doc(db, 'users', userId), {
      role: 'admin',
      promotedAt: new Date().toISOString(),
      promotedBy: promotedBy
    });

    logger.info('User promoted to admin', { userId, promotedBy });
    return { success: true };
  } catch (error) {
    logger.error('Error promoting user to admin', error, { userId, promotedBy });
    return { success: false, error: error.message };
  }
}

/**
 * Demote an admin to parent role
 * @param {string} userId - The admin user ID to demote
 * @param {string} demotedBy - The admin performing the demotion
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function demoteFromAdmin(userId, demotedBy) {
  try {
    // Verify the person doing the demotion is an admin
    const isDemoteAdmin = await isUserAdmin(demotedBy);
    if (!isDemoteAdmin) {
      return { success: false, error: 'Only admins can demote users' };
    }

    // Prevent self-demotion
    if (userId === demotedBy) {
      return { success: false, error: 'Cannot demote yourself' };
    }

    // Check if user exists
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    // Ensure at least one admin remains
    const allAdmins = await getAllAdmins();
    if (allAdmins.length <= 1) {
      return { success: false, error: 'Cannot demote the last admin' };
    }

    // Update user role
    await updateDoc(doc(db, 'users', userId), {
      role: 'parent',
      demotedAt: new Date().toISOString(),
      demotedBy: demotedBy
    });

    logger.info('Admin demoted to parent', { userId, demotedBy });
    return { success: true };
  } catch (error) {
    logger.error('Error demoting admin', error, { userId, demotedBy });
    return { success: false, error: error.message };
  }
}

/**
 * Initialize the first admin user (migration helper)
 * This should only be run once during initial setup
 * @param {string} email - Email of the first admin
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function initializeFirstAdmin(email) {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email.toLowerCase())
    );

    const snapshot = await getDocs(usersQuery);

    if (snapshot.empty) {
      return { success: false, error: 'User not found with that email' };
    }

    const userDoc = snapshot.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), {
      role: 'admin',
      promotedAt: new Date().toISOString(),
      promotedBy: 'system',
      isFoundingAdmin: true
    });

    logger.info('First admin initialized', { email, userId: userDoc.id });
    return { success: true, userId: userDoc.id };
  } catch (error) {
    logger.error('Error initializing first admin', error, { email });
    return { success: false, error: error.message };
  }
}

export default {
  isUserAdmin,
  getAllAdmins,
  promoteToAdmin,
  demoteFromAdmin,
  initializeFirstAdmin
};
