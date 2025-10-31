import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteRequest {
  email: string
  inviteCode: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { email, inviteCode }: InviteRequest = await req.json()

    if (!email || !inviteCode) {
      return new Response(
        JSON.stringify({ error: 'Email and invite code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify invite code exists and get group info
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name, description')
      .eq('invite_code', inviteCode)
      .single()

    if (groupError || !group) {
      return new Response(
        JSON.stringify({ error: 'Invalid invite code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single()

    // Get Brevo API key
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY not configured')
    }

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'
    const joinUrl = `${appUrl}/dashboard/join-group?code=${inviteCode}`

    let emailSent = false

    if (existingUser) {
      // User exists - send them a stylized email with the invite code
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 100%); background-color: #EFF6FF;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 0 0 32px 0;">
              <h1 style="margin: 0; font-size: 36px; font-weight: bold; color: #111827;">Splitwibe</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #6B7280;">Split expenses with ease</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 32px 32px 16px 32px;">
                    <div style="display: inline-block; width: 80px; height: 80px; border-radius: 50%; background-color: #DBEAFE; text-align: center; line-height: 80px;">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;">
                        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 32px 32px 32px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827; text-align: center;">You're Invited to Join a Group!</h2>
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #6B7280; text-align: center;">
                      You've been invited to join <strong style="color: #111827;">${group.name}</strong> on Splitwibe.
                      ${group.description ? `<br><em style="color: #9CA3AF;">${group.description}</em>` : ''}
                    </p>
                    <div style="background-color: #F3F4F6; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280;">Your Invite Code</p>
                      <code style="display: block; font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 4px; font-family: 'Courier New', monospace;">${inviteCode}</code>
                    </div>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 0 0 16px 0;">
                          <a href="${joinUrl}" style="display: inline-block; padding: 12px 32px; background-color: #4F46E5; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">
                            Join Group Now
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #6B7280; text-align: center;">
                      Or copy and paste this link into your browser:<br>
                      <a href="${joinUrl}" style="color: #4F46E5; word-break: break-all;">${joinUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 24px 0 0 0;">
              <p style="margin: 0; font-size: 12px; line-height: 20px; color: #6B7280;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; line-height: 20px; color: #9CA3AF;">
                © 2024 Splitwibe. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoApiKey,
        },
        body: JSON.stringify({
          sender: {
            email: 'gasper@thecalda.com', // Replace with your verified sender
          },
          to: [
            {
              email: email,
            },
          ],
          subject: `You're invited to join ${group.name} on Splitwibe`,
          htmlContent: htmlContent,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Brevo API error:', error)
        throw new Error('Failed to send email')
      }

      emailSent = true
    } else {
      // User doesn't exist - send them a signup invitation
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 100%); background-color: #EFF6FF;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 0 0 32px 0;">
              <h1 style="margin: 0; font-size: 36px; font-weight: bold; color: #111827;">Splitwibe</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #6B7280;">Split expenses with ease</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 32px 32px 16px 32px;">
                    <div style="display: inline-block; width: 80px; height: 80px; border-radius: 50%; background-color: #DBEAFE; text-align: center; line-height: 80px;">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;">
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                      </svg>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 32px 32px 32px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827; text-align: center;">Join ${group.name} on Splitwibe!</h2>
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #6B7280; text-align: center;">
                      You've been invited to join <strong style="color: #111827;">${group.name}</strong> for splitting expenses.
                      ${group.description ? `<br><em style="color: #9CA3AF;">${group.description}</em>` : ''}
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #6B7280; text-align: center;">
                      To get started, create your free Splitwibe account and you'll be automatically added to the group.
                    </p>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 0 0 16px 0;">
                          <a href="${joinUrl}" style="display: inline-block; padding: 12px 32px; background-color: #4F46E5; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">
                            Create Account & Join Group
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #6B7280; text-align: center;">
                      Or copy and paste this link into your browser:<br>
                      <a href="${joinUrl}" style="color: #4F46E5; word-break: break-all;">${joinUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 24px 0 0 0;">
              <p style="margin: 0; font-size: 12px; line-height: 20px; color: #6B7280;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; line-height: 20px; color: #9CA3AF;">
                © 2024 Splitwibe. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoApiKey,
        },
        body: JSON.stringify({
          sender: {
            email: 'gasper@thecalda.com', // Replace with your verified sender
          },
          to: [
            {
              email: email,
            },
          ],
          subject: `You're invited to join ${group.name} on Splitwibe`,
          htmlContent: htmlContent,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Brevo API error:', error)
        throw new Error('Failed to send email')
      }

      emailSent = true
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: emailSent ? 'Invitation sent successfully' : 'Failed to send invitation',
        existingUser: !!existingUser,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
