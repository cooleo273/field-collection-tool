import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the request body to check if it's a direct reset
    const body = await request.json()
    const { directReset, newPassword } = body

    // Get the user's email from the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', params.id)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'Failed to find user' },
        { status: 404 }
      )
    }

    if (!userData?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      )
    }

    if (directReset && newPassword) {
      // For direct password reset, verify the current user's role
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Verify that the current user has permission to reset this password
      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (currentUserError || !currentUser) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Only allow admins and project admins to reset passwords
      if (!['admin', 'project-admin'].includes(currentUser.role)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      // Create a Supabase client with the service role key for admin operations
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Update the user's password using the admin client
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        params.id,
        { password: newPassword }
      )

      if (updateError) {
        console.error('Error updating password:', updateError)
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Password reset successfully'
      })
    } else {
      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        userData.email,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
        }
      )

      if (resetError) {
        console.error('Error sending reset email:', resetError)
        return NextResponse.json(
          { error: 'Failed to send reset email' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Password reset email sent successfully'
      })
    }
  } catch (error) {
    console.error('Error in reset password route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 