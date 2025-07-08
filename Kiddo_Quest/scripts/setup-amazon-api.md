# Amazon Product Advertising API Setup Guide

This guide will help you set up the Amazon Product Advertising API to enable real product searching in the KiddoQuest application.

## Prerequisites

1. An Amazon Associates account
2. Access to Amazon Product Advertising API
3. Firebase CLI installed and authenticated

## Steps

### 1. Create Amazon Associates Account

1. Go to [Amazon Associates](https://affiliate-program.amazon.com/)
2. Sign up for an Associates account
3. Complete the application process (may take 1-3 business days for approval)

### 2. Apply for Product Advertising API Access

1. Once your Associates account is approved, go to [Amazon Product Advertising API](https://webservices.amazon.com/paapi5/documentation/)
2. Apply for API access
3. Wait for approval (can take several days)

### 3. Get Your API Credentials

Once approved, you'll receive:
- **Access Key ID**
- **Secret Access Key** 
- **Partner Tag** (Your Associates ID)

### 4. Configure Firebase Functions

Set the Amazon API credentials in Firebase Functions config:

```bash
# Navigate to your project directory
cd /path/to/Kiddo_Quest

# Set Amazon API configuration
firebase functions:config:set amazon.access_key="YOUR_ACCESS_KEY_ID"
firebase functions:config:set amazon.secret_key="YOUR_SECRET_ACCESS_KEY"
firebase functions:config:set amazon.partner_tag="YOUR_PARTNER_TAG"
firebase functions:config:set amazon.region="us-east-1"

# Deploy the functions to apply the new configuration
firebase deploy --only functions
```

### 5. Environment Variables for Local Development

For local development, create a `.runtimeconfig.json` file in your `functions` directory:

```json
{
  "amazon": {
    "access_key": "YOUR_ACCESS_KEY_ID",
    "secret_key": "YOUR_SECRET_ACCESS_KEY",
    "partner_tag": "YOUR_PARTNER_TAG",
    "region": "us-east-1"
  }
}
```

**Important:** Add `.runtimeconfig.json` to your `.gitignore` file to keep credentials secure.

### 6. Test the Integration

1. Start your application
2. Navigate to Reward Management
3. Click "Browse Amazon"
4. Search for a product
5. You should see real Amazon products instead of mock data

## API Rate Limits

- Amazon Product Advertising API has rate limits
- Free tier: 8,640 requests per day (1 request every 10 seconds)
- For higher limits, you need to generate sales through your Associates account

## Troubleshooting

### "Using demo data" message
This means the API credentials are not configured or the Firebase function can't access them.

### "API temporarily unavailable"
This indicates an error with the Amazon API call. Check:
1. Credentials are correct
2. Your Associates account is in good standing
3. You haven't exceeded rate limits
4. The API is not experiencing downtime

### Error in Firebase Functions logs
Check Firebase Functions logs:
```bash
firebase functions:log
```

## Security Best Practices

1. Never commit API credentials to version control
2. Use Firebase Functions config for production
3. Regularly rotate your API keys
4. Monitor API usage through Amazon's dashboard
5. Set up alerts for unusual activity

## Alternative: Mock Data Mode

If you don't want to set up the Amazon API, the application will automatically fall back to mock data. This is useful for:
- Development and testing
- Demo purposes
- When API quotas are exceeded

The mock data provides realistic-looking products but won't have real pricing or availability information.