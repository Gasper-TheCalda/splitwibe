# Splitwibe Email Templates

This directory contains HTML email templates for Supabase authentication emails.

## Templates Included

1. **email-confirmation.html** - Email confirmation for new user signups
2. **forgot-password.html** - Password reset email

## How to Use These Templates in Supabase

### For Supabase Cloud (Production)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Select the template you want to customize:
   - **Confirm signup** → Use `email-confirmation.html`
   - **Reset password** → Use `forgot-password.html`
4. Copy the entire contents of the HTML file
5. Paste it into the template editor
6. Click **Save**

### For Local Development

1. Open `supabase/config.toml`
2. Find the `[auth.email]` section
3. Add the template paths:

```toml
[auth.email.template.confirmation]
subject = "Confirm Your Email - Splitwibe"
content_path = "./supabase/templates/email-confirmation.html"

[auth.email.template.recovery]
subject = "Reset Your Password - Splitwibe"
content_path = "./supabase/templates/forgot-password.html"
```

## Supabase Template Variables

These templates use Supabase's built-in variables:

- `{{ .ConfirmationURL }}` - The confirmation/reset link (automatically generated)
- `{{ .Token }}` - The authentication token (if needed for custom flows)
- `{{ .TokenHash }}` - Hashed version of the token
- `{{ .SiteURL }}` - Your site URL from Supabase settings

## Styling

These templates match the Splitwibe brand:

- **Colors:**
  - Primary: Indigo (#4F46E5)
  - Background: Blue-to-Indigo gradient
  - Text: Gray tones (#111827, #6B7280)
  - Accent: Light blue (#DBEAFE)

- **Design:**
  - Rounded cards (16px border-radius)
  - Box shadows for depth
  - Clean, modern typography
  - Mobile-responsive layout

## Testing Emails

### Local Testing

1. Start Supabase locally:
   ```bash
   supabase start
   ```

2. Supabase will show you the **Inbucket URL** (usually `http://127.0.0.1:54324`)

3. Open Inbucket in your browser to see test emails

4. Trigger an email by:
   - Signing up a new user
   - Using the forgot password flow

### Production Testing

1. Set up a test email address
2. Go through the signup or password reset flow
3. Check your inbox for the styled email

## Email Client Compatibility

These templates use table-based layouts and inline styles for maximum compatibility with email clients including:

- Gmail
- Outlook
- Apple Mail
- Yahoo Mail
- Mobile email clients

## Customization

To customize the templates:

1. **Change colors:** Replace hex codes throughout the template
2. **Update branding:** Change "Splitwibe" to your app name
3. **Modify content:** Update the text while keeping the variable placeholders
4. **Add footer links:** Add social media or support links in the footer section

## Important Notes

- ⚠️ Always test emails after making changes
- ⚠️ Keep the `{{ .ConfirmationURL }}` variable intact
- ⚠️ Use inline styles for email compatibility (already done)
- ⚠️ Test on multiple email clients before deploying to production
- ⚠️ Make sure to update the redirect URLs in your Supabase settings to match your production domain

## Support

If you need to customize these further or encounter issues, refer to:
- [Supabase Email Templates Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Email on Acid](https://www.emailonacid.com/) for testing compatibility
