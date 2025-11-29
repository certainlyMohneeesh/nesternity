# Newsletter/Waitlist Google Sheets Integration

This implementation adds a newsletter signup form to the homepage that stores email subscriptions in a Google Sheets document with spam protection via reCAPTCHA.

## Features

- ✅ Newsletter signup form with email validation
- ✅ Google Sheets integration for storing emails
- ✅ reCAPTCHA v2 spam protection
- ✅ Duplicate email prevention
- ✅ User-friendly error handling
- ✅ Toast notifications for feedback

## Setup Instructions

### 1. Google Sheets Setup

1. **Create a Google Sheet**:
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new spreadsheet
   - Add column headers in the first row:
     - A1: `Email`
     - B1: `Subscribed At`

2. **Get the Sheet ID**:
   - From the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
   - Copy the `SHEET_ID` part

3. **Share with Service Account**:
   - Click "Share" button in Google Sheets
   - Add the service account email: `nesternity@nesternity.iam.gserviceaccount.com`
   - Give "Editor" permissions

### 2. reCAPTCHA Setup

1. **Create reCAPTCHA Site**:
   - Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin/create)
   - Choose reCAPTCHA v2 "I'm not a robot" checkbox
   - Add your domain(s): `localhost`, `yourdomain.com`
   - Get the Site Key and Secret Key

### 3. Environment Variables

Add these to your `.env` file:

```env
# Google Sheets Configuration
GOOGLE_SHEET_ID=your_google_sheet_id_here

# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
```

### 4. Restart Development Server

```bash
npm run dev
# or
pnpm dev
```

## Files Structure

```
src/
├── app/
│   ├── api/
│   │   └── newsletter/
│   │       └── route.ts              # API endpoint for newsletter signup
│   └── page.tsx                      # Updated homepage with newsletter component
├── components/
│   └── newsletter/
│       └── NewsletterSignup.tsx      # Newsletter signup form component
└── credentials.json                  # Google service account credentials (already exists)
```

## API Endpoint

### POST `/api/newsletter`

Handles newsletter signup requests.

**Request Body:**
```json
{
  "email": "user@example.com",
  "recaptchaToken": "recaptcha_response_token"
}
```

**Responses:**
- `200`: Successfully subscribed
- `400`: Invalid input or reCAPTCHA failed
- `409`: Email already subscribed
- `500`: Server error

## Security Features

1. **reCAPTCHA Protection**: Prevents automated spam submissions
2. **Email Validation**: Server-side email format validation
3. **Duplicate Prevention**: Checks for existing emails before adding
4. **Rate Limiting**: reCAPTCHA provides built-in rate limiting
5. **Input Sanitization**: Validates and sanitizes all inputs

## Error Handling

- **Network Errors**: Gracefully handled with user-friendly messages
- **Duplicate Emails**: Shows specific message for already subscribed emails
- **reCAPTCHA Failures**: Prompts user to complete verification
- **Server Errors**: Generic error message for security

## Usage

The newsletter signup form appears at the bottom of the homepage. Users need to:

1. Enter a valid email address
2. Complete the reCAPTCHA verification
3. Click "Join Waitlist"

Upon successful submission, the email is added to your Google Sheet with a timestamp.

## Customization

### Changing Google Sheet Structure

If you want different columns, update the `RANGE` constant in `src/app/api/newsletter/route.ts`:

```typescript
const RANGE = 'Sheet1!A:C'; // For 3 columns
```

And modify the append request:

```typescript
values: [[email, subscribedAt, customField]],
```

### Styling

The newsletter form styling can be customized in `src/components/newsletter/NewsletterSignup.tsx`. It uses Tailwind CSS classes and the existing design system.

## Monitoring

Check your Google Sheet to monitor signups. Each entry includes:
- Email address
- Subscription timestamp (ISO format)

## Troubleshooting

### Common Issues

1. **"Google Sheets not configured"**: Add `GOOGLE_SHEET_ID` to `.env`
2. **"reCAPTCHA verification failed"**: Check `RECAPTCHA_SECRET_KEY` and ensure the form is submitted from a registered domain
3. **403 Forbidden from Google Sheets**: Ensure the service account has Editor access to the sheet
4. **reCAPTCHA not loading**: Check `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and ensure the domain is registered

### Testing

Test the implementation with:
1. Valid email submission
2. Duplicate email submission
3. Invalid email format
4. Missing reCAPTCHA verification

All scenarios should show appropriate error messages or success notifications.
