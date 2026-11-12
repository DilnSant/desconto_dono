import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const ALLOWED_BUCKETS = new Set(['avatars', 'listings'])
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: Request) {
  try {
    const server = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await server.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Entre na sua conta para continuar.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucket = formData.get('bucket') as string | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo inválido.' }, { status: 400 })
    }

    if (!bucket || !ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: 'Bucket inválido.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 5 MB.' }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg'
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${cleanExt}`

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('[UPLOAD_API] Erro ao enviar para storage:', uploadError)
      return NextResponse.json({ error: 'Erro ao salvar arquivo no servidor.' }, { status: 500 })
    }

    const { data } = admin.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({
      success: true,
      publicUrl: data.publicUrl,
      path,
    })
  } catch (error) {
    console.error('[UPLOAD_API] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno ao processar upload.' }, { status: 500 })
  }
}
