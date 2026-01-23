import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/profiles
export async function POST(request: Request) {
  const supabase = await createClient()
  const { user } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { username, full_name } = await request.json()

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      username,
      full_name,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json(data)
}
