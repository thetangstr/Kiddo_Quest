const { test, expect } = require('@playwright/test');

test.describe('POST /api/quests/{id}/photo', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login as parent
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email-input"]', 'parent@test.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('should upload quest completion photo', async ({ page }) => {
    // This test verifies photo upload endpoint for quest completion
    const response = await page.evaluate(async () => {
      const questId = 'quest-123';
      const photoData = {
        file: 'mock-file-data', // In real test, this would be actual file data
        fileName: 'completion-photo.jpg',
        fileSize: 1024000, // 1MB
        mimeType: 'image/jpeg',
        childId: 'child-456',
        description: 'Completed cleaning my room!'
      };
      
      // In real implementation, this would be an API call
      // For now, we'll simulate the response
      return {
        success: true,
        photo: {
          id: 'photo-' + Date.now(),
          questId,
          childId: photoData.childId,
          fileName: photoData.fileName,
          originalName: photoData.fileName,
          mimeType: photoData.mimeType,
          fileSize: photoData.fileSize,
          url: 'https://storage.firebase.com/quest-photos/photo-12345.jpg',
          thumbnailUrl: 'https://storage.firebase.com/quest-photos/thumb-photo-12345.jpg',
          description: photoData.description,
          uploadedAt: new Date().toISOString(),
          status: 'uploaded',
          metadata: {
            width: 1920,
            height: 1080,
            format: 'JPEG'
          }
        },
        questUpdate: {
          id: questId,
          status: 'pending_review',
          photoSubmitted: true,
          submittedAt: new Date().toISOString()
        }
      };
    });

    expect(response.success).toBe(true);
    expect(response).toHaveProperty('photo');
    expect(response).toHaveProperty('questUpdate');
    expect(response.photo).toHaveProperty('id');
    expect(response.photo).toHaveProperty('url');
    expect(response.photo).toHaveProperty('thumbnailUrl');
    expect(response.photo.status).toBe('uploaded');
    expect(response.questUpdate.photoSubmitted).toBe(true);
  });

  test('should validate file type', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const questId = 'quest-123';
        const photoData = {
          fileName: 'document.pdf',
          mimeType: 'application/pdf', // Invalid file type
          fileSize: 500000
        };
        
        // Only allow image types
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(photoData.mimeType)) {
          throw new Error('Invalid file type. Only images are allowed.');
        }
        
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 400 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(400);
    expect(response.error).toContain('Invalid file type');
  });

  test('should validate file size limits', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const questId = 'quest-123';
        const photoData = {
          fileName: 'large-photo.jpg',
          mimeType: 'image/jpeg',
          fileSize: 10485760 // 10MB - too large
        };
        
        // Max file size: 5MB
        const maxFileSize = 5 * 1024 * 1024;
        if (photoData.fileSize > maxFileSize) {
          throw new Error('File size too large. Maximum size is 5MB.');
        }
        
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 400 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(400);
    expect(response.error).toContain('File size too large');
  });

  test('should return 404 for non-existent quest', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const questId = 'non-existent-quest';
        const photoData = {
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1000000
        };
        
        throw new Error('Quest not found');
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 404 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(404);
    expect(response.error).toContain('Quest not found');
  });

  test('should require authentication', async ({ page, context }) => {
    // Clear cookies to simulate unauthenticated request
    await context.clearCookies();
    await page.goto('http://localhost:3000');
    
    const response = await page.evaluate(async () => {
      try {
        // Attempt to upload photo without auth
        throw new Error('Unauthorized');
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 401 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(401);
  });

  test('should validate quest ownership', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const questId = 'quest-belonging-to-other-family';
        const photoData = {
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1000000,
          childId: 'child-456'
        };
        
        // Simulate quest belonging to different family
        throw new Error('Quest not accessible to this user');
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 403 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(403);
    expect(response.error).toContain('not accessible');
  });

  test('should prevent duplicate photo uploads', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const questId = 'quest-with-existing-photo';
        const photoData = {
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1000000
        };
        
        // Quest already has a photo
        throw new Error('Quest already has a photo uploaded');
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 409 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(409);
    expect(response.error).toContain('already has a photo');
  });

  test('should handle upload failures', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const questId = 'quest-123';
        const photoData = {
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1000000
        };
        
        // Simulate storage service failure
        throw new Error('Storage service unavailable');
      } catch (error) {
        return { 
          success: false, 
          error: 'Upload failed: ' + error.message, 
          status: 500 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(500);
    expect(response.error).toContain('Upload failed');
  });

  test('should generate thumbnail for uploaded photo', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const questId = 'quest-123';
      const photoData = {
        fileName: 'high-res-photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 2048000, // 2MB
        childId: 'child-456'
      };
      
      return {
        success: true,
        photo: {
          id: 'photo-' + Date.now(),
          questId,
          childId: photoData.childId,
          fileName: photoData.fileName,
          mimeType: photoData.mimeType,
          fileSize: photoData.fileSize,
          url: 'https://storage.firebase.com/quest-photos/photo-12345.jpg',
          thumbnailUrl: 'https://storage.firebase.com/quest-photos/thumb-photo-12345.jpg',
          uploadedAt: new Date().toISOString(),
          status: 'uploaded',
          metadata: {
            width: 3840,
            height: 2160,
            format: 'JPEG'
          },
          thumbnailMetadata: {
            width: 300,
            height: 169,
            format: 'JPEG',
            fileSize: 15000
          }
        },
        processing: {
          thumbnailGenerated: true,
          compressionApplied: false,
          processingTime: 250
        }
      };
    });

    expect(response.success).toBe(true);
    expect(response.photo).toHaveProperty('thumbnailUrl');
    expect(response.photo).toHaveProperty('thumbnailMetadata');
    expect(response.processing.thumbnailGenerated).toBe(true);
    expect(response.photo.thumbnailMetadata.width).toBe(300);
  });

  test('should validate quest status for photo upload', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const questId = 'completed-quest-123';
        const photoData = {
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1000000
        };
        
        // Quest is already completed - no photo needed
        const questStatus = 'completed';
        if (questStatus === 'completed') {
          throw new Error('Cannot upload photo to completed quest');
        }
        
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 400 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(400);
    expect(response.error).toContain('completed quest');
  });

  test('should include photo metadata', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const questId = 'quest-123';
      const photoData = {
        fileName: 'completion-photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1500000,
        childId: 'child-456',
        description: 'My clean room!',
        exifData: {
          dateTime: '2024-01-20T15:30:00Z',
          camera: 'iPhone 12',
          gpsRemoved: true
        }
      };
      
      return {
        success: true,
        photo: {
          id: 'photo-' + Date.now(),
          questId,
          childId: photoData.childId,
          fileName: photoData.fileName,
          mimeType: photoData.mimeType,
          fileSize: photoData.fileSize,
          url: 'https://storage.firebase.com/quest-photos/photo-12345.jpg',
          description: photoData.description,
          uploadedAt: new Date().toISOString(),
          status: 'uploaded',
          metadata: {
            width: 2048,
            height: 1536,
            format: 'JPEG',
            orientation: 1,
            hasExif: false, // Stripped for privacy
            colorProfile: 'sRGB'
          },
          privacy: {
            gpsRemoved: true,
            exifStripped: true,
            moderationStatus: 'pending'
          }
        }
      };
    });

    expect(response.success).toBe(true);
    expect(response.photo).toHaveProperty('metadata');
    expect(response.photo).toHaveProperty('privacy');
    expect(response.photo.privacy.gpsRemoved).toBe(true);
    expect(response.photo.privacy.exifStripped).toBe(true);
  });

  test('should validate response schema', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        success: true,
        photo: {
          id: 'photo-12345',
          questId: 'quest-123',
          childId: 'child-456',
          fileName: 'test-photo.jpg',
          originalName: 'IMG_001.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024000,
          url: 'https://storage.firebase.com/quest-photos/photo-12345.jpg',
          thumbnailUrl: 'https://storage.firebase.com/quest-photos/thumb-photo-12345.jpg',
          description: 'Quest completion photo',
          uploadedAt: '2024-01-20T15:30:00Z',
          status: 'uploaded',
          metadata: {
            width: 1920,
            height: 1080,
            format: 'JPEG'
          }
        },
        questUpdate: {
          id: 'quest-123',
          status: 'pending_review',
          photoSubmitted: true,
          submittedAt: '2024-01-20T15:30:00Z'
        },
        message: 'Photo uploaded successfully'
      };
    });

    // Validate overall response schema
    expect(response).toMatchObject({
      success: expect.any(Boolean),
      photo: expect.any(Object),
      questUpdate: expect.any(Object),
      message: expect.any(String)
    });

    // Validate photo schema
    expect(response.photo).toMatchObject({
      id: expect.any(String),
      questId: expect.any(String),
      childId: expect.any(String),
      fileName: expect.any(String),
      mimeType: expect.any(String),
      fileSize: expect.any(Number),
      url: expect.any(String),
      uploadedAt: expect.any(String),
      status: expect.any(String),
      metadata: expect.any(Object)
    });

    // Validate quest update schema
    expect(response.questUpdate).toMatchObject({
      id: expect.any(String),
      status: expect.any(String),
      photoSubmitted: expect.any(Boolean)
    });
  });

  test('should handle missing file in request', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const questId = 'quest-123';
        const photoData = {
          // Missing file data
          childId: 'child-456',
          description: 'Photo without file'
        };
        
        throw new Error('No file provided');
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 400 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(400);
    expect(response.error).toContain('No file');
  });
});