import {
  createProfileGalleryHandlers,
  SIGNED_URL_LIFETIME_SECONDS,
} from '@/lib/profiles/gallery'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizeStoredPlanType } from '@/lib/plans/entitlements'

export const runtime = 'nodejs'

async function createHandlers() {
  const server = await createSupabaseServerClient()
  let admin: ReturnType<typeof createSupabaseAdminClient> | null = null
  const getAdmin = () => {
    admin ??= createSupabaseAdminClient()
    return admin
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada.')

  return createProfileGalleryHandlers({
    supabaseUrl,
    async authenticate() {
      const { data: { user }, error } = await server.auth.getUser()
      if (error?.name === 'AuthSessionMissingError') return null
      if (error) throw error
      return user?.id ?? null
    },
    async getOwnerMedia(profileId) {
      const admin = getAdmin()
      const [profileResult, imagesResult, planResult] = await Promise.all([
        admin.from('profiles').select('cover_url').eq('id', profileId).maybeSingle(),
        admin
          .from('profile_gallery_images')
          .select('id, object_path, display_order, upload_status, is_active')
          .eq('profile_id', profileId)
          .order('display_order')
          .order('id'),
        admin.rpc('get_effective_plan', { p_profile_id: profileId }),
      ])

      if (profileResult.error) throw profileResult.error
      if (imagesResult.error) throw imagesResult.error
      if (planResult.error) throw planResult.error
      if (!profileResult.data) return null

      return {
        plan: normalizeStoredPlanType(String(planResult.data)),
        coverUrl: profileResult.data.cover_url,
        images: imagesResult.data,
      }
    },
    async reserveSlot(profileId, objectPath, displayOrder) {
      const admin = getAdmin()
      const { data, error } = await admin.rpc('reserve_profile_gallery_slot', {
        p_profile_id: profileId,
        p_object_path: objectPath,
        p_display_order: displayOrder,
      })
      if (error) throw error
      if (!data) throw new Error('O banco não retornou o ID da reserva da foto.')
      return data
    },
    async uploadObject(path, file) {
      const admin = getAdmin()
      const { error } = await admin.storage.from('covers').upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (error) throw error
    },
    async activateSlot(profileId, imageId) {
      const admin = getAdmin()
      const { data, error } = await admin
        .from('profile_gallery_images')
        .update({ upload_status: 'ready', is_active: true })
        .eq('profile_id', profileId)
        .eq('id', imageId)
        .eq('upload_status', 'pending')
        .select('id')
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('A reserva da foto não está mais disponível.')
    },
    async removeReservation(profileId, imageId) {
      const admin = getAdmin()
      const { error } = await admin
        .from('profile_gallery_images')
        .delete()
        .eq('profile_id', profileId)
        .eq('id', imageId)
      if (error) throw error
    },
    async replaceCover(profileId, objectPath) {
      const admin = getAdmin()
      const { data, error } = await admin.rpc('replace_profile_cover', {
        p_profile_id: profileId,
        p_object_path: objectPath,
      })
      if (error) throw error
      return data
    },
    async getOwnerImage(profileId, imageId) {
      const admin = getAdmin()
      const { data, error } = await admin
        .from('profile_gallery_images')
        .select('id, object_path, display_order, upload_status, is_active')
        .eq('profile_id', profileId)
        .eq('id', imageId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    async updateImage(profileId, imageId, displayOrder, isActive) {
      const admin = getAdmin()
      const { error } = await admin.rpc('update_profile_gallery_image', {
        p_profile_id: profileId,
        p_image_id: imageId,
        p_display_order: displayOrder,
        p_is_active: isActive,
      })
      if (error) throw error
    },
    async reorderImages(profileId, imageIds) {
      const admin = getAdmin()
      const { error } = await admin.rpc('reorder_profile_gallery_images', {
        p_profile_id: profileId,
        p_image_ids: imageIds,
      })
      if (error) throw error
    },
    async deleteImage(profileId, imageId) {
      const admin = getAdmin()
      const { data, error } = await admin
        .from('profile_gallery_images')
        .delete()
        .eq('profile_id', profileId)
        .eq('id', imageId)
        .select('id')
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('A foto não pertence a este perfil.')
    },
    async deleteObject(path) {
      const admin = getAdmin()
      const { error } = await admin.storage.from('covers').remove([path])
      if (error) throw error
    },
    async signObjectPath(path) {
      const admin = getAdmin()
      const { data, error } = await admin.storage
        .from('covers')
        .createSignedUrl(path, SIGNED_URL_LIFETIME_SECONDS)
      if (error) throw error
      if (!data.signedUrl) throw new Error('O Supabase não retornou uma URL temporária.')
      return data.signedUrl
    },
    async getPublicProfile(profileId) {
      const admin = getAdmin()
      const { data, error } = await admin
        .from('profiles_public')
        .select('id, plan_type')
        .eq('id', profileId)
        .maybeSingle()
      if (error) throw error
      return data ? { plan: normalizeStoredPlanType(data.plan_type) } : null
    },
    async getPublicMedia(profileId) {
      const admin = getAdmin()
      const [profileResult, imagesResult] = await Promise.all([
        admin.from('profiles').select('cover_url').eq('id', profileId).single(),
        admin
          .from('profile_gallery_images')
          .select('id, object_path, display_order, upload_status, is_active')
          .eq('profile_id', profileId)
          .eq('upload_status', 'ready')
          .eq('is_active', true)
          .order('display_order')
          .order('id')
          .limit(10),
      ])
      if (profileResult.error) throw profileResult.error
      if (imagesResult.error) throw imagesResult.error
      return { coverUrl: profileResult.data.cover_url, images: imagesResult.data }
    },
  })
}

type GalleryHandlers = Awaited<ReturnType<typeof createHandlers>>

async function runGalleryRoute(method: keyof GalleryHandlers, request?: Request): Promise<Response> {
  try {
    const handlers = await createHandlers()
    if (method === 'GET') return await handlers.GET()
    if (!request) {
      return Response.json({ error: 'Dados inválidos.' }, { status: 400 })
    }
    return await handlers[method](request)
  } catch (error) {
    console.error('[PROFILE_GALLERY] Falha ao inicializar rota', {
      method,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message.slice(0, 240) : 'Falha desconhecida.',
    })
    return Response.json(
      { error: 'Não foi possível concluir a solicitação. Tente novamente.' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } },
    )
  }
}

export async function GET() {
  return runGalleryRoute('GET')
}

export async function POST(request: Request) {
  return runGalleryRoute('POST', request)
}

export async function PATCH(request: Request) {
  return runGalleryRoute('PATCH', request)
}

export async function DELETE(request: Request) {
  return runGalleryRoute('DELETE', request)
}
