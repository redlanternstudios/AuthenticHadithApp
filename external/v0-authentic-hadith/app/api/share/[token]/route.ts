import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config'

function getSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return createClient(SUPABASE_URL, serviceRoleKey || SUPABASE_ANON_KEY)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = getSupabase()
    const { token } = await params
    
    // Get viewer IP from request headers
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // Track the view
    await supabase.rpc('track_folder_view', {
      p_share_token: token,
      p_viewer_ip: ip
    })

    // Get folder data
    const { data: folder, error } = await supabase
      .from('hadith_folders')
      .select(`
        *,
        saved_hadiths(
          *,
          hadiths(*)
        )
      `)
      .eq('share_token', token)
      .single()

    if (error || !folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      )
    }

    // Check privacy settings
    if (folder.privacy === 'private') {
      return NextResponse.json(
        { error: 'This folder is private' },
        { status: 403 }
      )
    }

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Error fetching shared folder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
