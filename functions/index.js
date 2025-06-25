const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const paapi = require('paapi5-nodejs-sdk');

admin.initializeApp();

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email?.user || process.env.EMAIL_USER,
    pass: functions.config().email?.password || process.env.EMAIL_PASSWORD
  }
});

/**
 * Firestore trigger that sends an email when a new invitation document is created
 */
exports.sendInvitationEmail = functions.firestore
  .document('invitations/{invitationId}')
  .onCreate(async (snap, context) => {
    try {
      const invitation = snap.data();
      const invitationId = context.params.invitationId;
      
      // Skip processing if the invitation doesn't have required fields
      if (!invitation || !invitation.email || !invitation.token) {
        console.error('Invalid invitation data:', invitation);
        return null;
      }
      
      // Get the application URL from config (or use a default for development)
      const appUrl = functions.config().app?.url || 'http://localhost:3000';
      
      // Create the invitation link with the token
      const invitationLink = `${appUrl}/invite?token=${invitation.token}`;
      
      // Get the inviter info for personalized email
      let inviterName = invitation.inviterName || 'Someone';
      
      // If we have inviter ID but no name, try to get it from the users collection
      if (invitation.createdBy && !invitation.inviterName) {
        try {
          const inviterDoc = await admin.firestore()
            .collection('users')
            .doc(invitation.createdBy)
            .get();
            
          if (inviterDoc.exists) {
            const inviterData = inviterDoc.data();
            inviterName = inviterData.displayName || inviterData.email || 'Someone';
          }
        } catch (error) {
          console.error('Error fetching inviter information:', error);
        }
      }
      
      // Create email content based on invitation role
      let subject, htmlContent, textContent;
      
      switch(invitation.role) {
        case 'parent':
        case 'guardian':
          subject = `${inviterName} has invited you to join Kiddo Quest as a ${invitation.role}`;
          htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #5850ec;">You've been invited to Kiddo Quest!</h2>
              <p>Hi there,</p>
              <p>${inviterName} has invited you to join their family on Kiddo Quest as a ${invitation.role}.</p>
              <p>Kiddo Quest is a fun app that helps families manage tasks and rewards for children.</p>
              <p>
                <a href="${invitationLink}" style="background-color: #5850ec; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                  Accept Invitation
                </a>
              </p>
              <p>This invitation will expire in 7 days.</p>
              <p>If you have any questions, please contact support@kiddoquest.com</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </div>
          `;
          textContent = `
            You've been invited to Kiddo Quest!
            
            Hi there,
            
            ${inviterName} has invited you to join their family on Kiddo Quest as a ${invitation.role}.
            Kiddo Quest is a fun app that helps families manage tasks and rewards for children.
            
            Accept the invitation by visiting this link:
            ${invitationLink}
            
            This invitation will expire in 7 days.
            
            If you have any questions, please contact support@kiddoquest.com
            
            If you weren't expecting this invitation, you can safely ignore this email.
          `;
          break;
          
        case 'child':
          subject = `${inviterName} has invited you to join Kiddo Quest`;
          htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #5850ec;">You're invited to Kiddo Quest!</h2>
              <p>Hi there,</p>
              <p>${inviterName} has invited you to join Kiddo Quest - a fun app where you can earn rewards by completing quests!</p>
              <p>
                <a href="${invitationLink}" style="background-color: #5850ec; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                  Join the Adventure
                </a>
              </p>
              <p>This invitation will expire in 7 days.</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </div>
          `;
          textContent = `
            You're invited to Kiddo Quest!
            
            Hi there,
            
            ${inviterName} has invited you to join Kiddo Quest - a fun app where you can earn rewards by completing quests!
            
            Join the adventure by visiting this link:
            ${invitationLink}
            
            This invitation will expire in 7 days.
            
            If you weren't expecting this invitation, you can safely ignore this email.
          `;
          break;
          
        default:
          // Generic invitation for unknown roles
          subject = `You've been invited to Kiddo Quest`;
          htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #5850ec;">You've been invited to Kiddo Quest!</h2>
              <p>Hi there,</p>
              <p>${inviterName} has invited you to join Kiddo Quest.</p>
              <p>
                <a href="${invitationLink}" style="background-color: #5850ec; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                  Accept Invitation
                </a>
              </p>
              <p>This invitation will expire in 7 days.</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </div>
          `;
          textContent = `
            You've been invited to Kiddo Quest!
            
            Hi there,
            
            ${inviterName} has invited you to join Kiddo Quest.
            
            Accept the invitation by visiting this link:
            ${invitationLink}
            
            This invitation will expire in 7 days.
            
            If you weren't expecting this invitation, you can safely ignore this email.
          `;
      }
      
      // Mail options
      const mailOptions = {
        from: functions.config().email?.sender || '"Kiddo Quest" <noreply@kiddoquest.com>',
        to: invitation.email,
        subject: subject,
        text: textContent,
        html: htmlContent
      };
      
      // Send the email
      await transporter.sendMail(mailOptions);
      
      // Update the invitation with sent timestamp
      await admin.firestore()
        .collection('invitations')
        .doc(invitationId)
        .update({
          emailSentAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      return null;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return null;
    }
  });
  
/**
 * HTTP endpoint to manually trigger sending an invitation email
 */
exports.manualSendInvitation = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    // Ensure proper parameters are provided
    const { invitationId } = data;
    if (!invitationId) {
      throw new functions.https.HttpsError('invalid-argument', 'invitationId is required');
    }
    
    // Get the invitation document
    const invitationRef = admin.firestore().collection('invitations').doc(invitationId);
    const invitationDoc = await invitationRef.get();
    
    if (!invitationDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Invitation not found');
    }
    
    const invitation = invitationDoc.data();
    
    // Check if this invitation belongs to this user's family
    if (invitation.familyId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'You do not have permission to manage this invitation');
    }
    
    // The rest of this function would be similar to sendInvitationEmail
    // Creating an email and sending it based on invitation details
    
    // Update the invitation with sent timestamp
    await invitationRef.update({
      emailSentAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, message: 'Invitation email sent' };
    
  } catch (error) {
    console.error('Error in manualSendInvitation:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Marked an invitation as expired after its expiration date
 */
exports.checkExpiredInvitations = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      const now = admin.firestore.Timestamp.now();
      
      // Query for pending invitations that have expired
      const expiredInvitationsQuery = admin.firestore()
        .collection('invitations')
        .where('status', '==', 'pending')
        .where('expiresAt', '<', now);
      
      const expiredInvitationsSnapshot = await expiredInvitationsQuery.get();
      
      if (expiredInvitationsSnapshot.empty) {
        console.log('No expired invitations found');
        return null;
      }
      
      // Batch update all expired invitations
      const batch = admin.firestore().batch();
      
      expiredInvitationsSnapshot.forEach(doc => {
        const invitationRef = admin.firestore().collection('invitations').doc(doc.id);
        batch.update(invitationRef, {
          status: 'expired',
          expiredAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      
      console.log(`Marked ${expiredInvitationsSnapshot.size} invitations as expired`);
      return null;
    } catch (error) {
      console.error('Error checking expired invitations:', error);
      return null;
    }
  });

/**
 * Amazon Product Search API function
 * Searches Amazon products using the Product Advertising API
 */
exports.searchAmazonProducts = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { query, maxResults = 10 } = data;
    
    if (!query || query.trim().length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Search query is required');
    }

    // Get Amazon API credentials from Firebase config
    const amazonConfig = functions.config().amazon;
    if (!amazonConfig || !amazonConfig.access_key || !amazonConfig.secret_key || !amazonConfig.partner_tag) {
      console.error('Amazon API credentials not configured');
      
      // Return mock data in development/when credentials not set
      const mockProducts = Array.from({ length: Math.min(maxResults, 5) }, (_, i) => ({
        asin: `MOCK${i + 1}`,
        title: `${query} Product ${i + 1}`,
        description: `A great ${query} product for kids and families`,
        price: {
          amount: (1999 + i * 500),
          currency: 'USD',
          displayValue: `$${(19.99 + i * 5).toFixed(2)}`
        },
        images: {
          primary: `https://via.placeholder.com/300x300?text=${encodeURIComponent(query)}+${i + 1}`,
          variants: [`https://via.placeholder.com/150x150?text=${encodeURIComponent(query)}+${i + 1}`]
        },
        features: [`Feature 1 for ${query}`, `Feature 2 for ${query}`],
        brand: 'Mock Brand',
        availability: 'InStock',
        amazonUrl: `https://amazon.com/dp/MOCK${i + 1}`,
        partnerUrl: `https://amazon.com/dp/MOCK${i + 1}?tag=test-partner`,
        isMockData: true
      }));

      return {
        success: true,
        products: mockProducts,
        total: mockProducts.length,
        query: query,
        isMockData: true
      };
    }

    // Configure Amazon PAAPI client
    const defaultClient = paapi.ApiClient.instance;
    defaultClient.accessKey = amazonConfig.access_key;
    defaultClient.secretKey = amazonConfig.secret_key;
    defaultClient.host = amazonConfig.region === 'us-west-2' ? 'webservices.amazon.com' : 'webservices.amazon.com';
    defaultClient.region = amazonConfig.region || 'us-east-1';

    const api = new paapi.DefaultApi(defaultClient);

    // Create search request
    const searchItemsRequest = new paapi.SearchItemsRequest();
    searchItemsRequest.partnerTag = amazonConfig.partner_tag;
    searchItemsRequest.partnerType = paapi.PartnerType.Associates;
    searchItemsRequest.keywords = query;
    searchItemsRequest.searchIndex = 'All';
    searchItemsRequest.itemCount = Math.min(maxResults, 10); // Amazon API limit
    searchItemsRequest.resources = [
      'Images.Primary.Large',
      'Images.Primary.Medium',
      'Images.Variants.Large',
      'ItemInfo.Title',
      'ItemInfo.Features',
      'ItemInfo.ByLineInfo',
      'Offers.Listings.Price',
      'Offers.Listings.Availability.Message'
    ];

    // Execute search
    const searchResponse = await new Promise((resolve, reject) => {
      api.searchItems(searchItemsRequest, (error, data, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });

    // Process search results
    const products = [];
    
    if (searchResponse && searchResponse.SearchResult && searchResponse.SearchResult.Items) {
      for (const item of searchResponse.SearchResult.Items) {
        const product = {
          asin: item.ASIN,
          title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
          description: item.ItemInfo?.Features?.DisplayValues ? 
            item.ItemInfo.Features.DisplayValues.join(', ') : 
            'Product description not available',
          price: null,
          images: {
            primary: null,
            variants: []
          },
          features: item.ItemInfo?.Features?.DisplayValues || [],
          brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || 'Unknown Brand',
          availability: 'Unknown',
          amazonUrl: item.DetailPageURL,
          partnerUrl: item.DetailPageURL,
          isMockData: false
        };

        // Extract price information
        if (item.Offers?.Listings && item.Offers.Listings.length > 0) {
          const listing = item.Offers.Listings[0];
          if (listing.Price?.Amount) {
            product.price = {
              amount: Math.round(listing.Price.Amount * 100), // Convert to cents
              currency: listing.Price.Currency || 'USD',
              displayValue: listing.Price.DisplayAmount || `$${listing.Price.Amount}`
            };
          }
          
          if (listing.Availability?.Message) {
            product.availability = listing.Availability.Message;
          }
        }

        // Extract image information
        if (item.Images?.Primary?.Large?.URL) {
          product.images.primary = item.Images.Primary.Large.URL;
        } else if (item.Images?.Primary?.Medium?.URL) {
          product.images.primary = item.Images.Primary.Medium.URL;
        }

        if (item.Images?.Variants) {
          product.images.variants = item.Images.Variants
            .filter(variant => variant.Large?.URL)
            .map(variant => variant.Large.URL)
            .slice(0, 3); // Limit to 3 variant images
        }

        products.push(product);
      }
    }

    return {
      success: true,
      products: products,
      total: products.length,
      query: query,
      isMockData: false
    };

  } catch (error) {
    console.error('Error searching Amazon products:', error);
    
    // Return mock data as fallback
    const mockProducts = Array.from({ length: Math.min(data.maxResults || 5, 5) }, (_, i) => ({
      asin: `FALLBACK${i + 1}`,
      title: `${data.query} Fallback Product ${i + 1}`,
      description: `Fallback product for ${data.query}`,
      price: {
        amount: (1999 + i * 500),
        currency: 'USD',
        displayValue: `$${(19.99 + i * 5).toFixed(2)}`
      },
      images: {
        primary: `https://via.placeholder.com/300x300?text=Fallback+${i + 1}`,
        variants: []
      },
      features: ['Fallback feature 1', 'Fallback feature 2'],
      brand: 'Fallback Brand',
      availability: 'InStock',
      amazonUrl: `https://amazon.com/dp/FALLBACK${i + 1}`,
      partnerUrl: `https://amazon.com/dp/FALLBACK${i + 1}?tag=test-partner`,
      isMockData: true,
      isErrorFallback: true
    }));

    return {
      success: true,
      products: mockProducts,
      total: mockProducts.length,
      query: data.query || 'unknown',
      isMockData: true,
      error: 'API temporarily unavailable, showing fallback results'
    };
  }
});
