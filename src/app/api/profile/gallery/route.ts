import {
  createProfileGalleryHandlers,
  SIGNED_URL_LIFETIME_SECONDS,
} from '@/lib/profiles/gallery'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizeStoredPlanType } from '@/lib/plans/entitlements'

export const runtime = 'nodejs'

async function createHandlers() {
  const [server, admin] = await Promise.all([
    createSupabaseServerClient(),
    Promise.resolve(createSupabaseAdminClient()),
  ])
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada.')

  return createProfileGalleryHandlers({
    supabaseUrl,
    async authenticate() {
      const { data: { user }, error } = await server.auth.getUser()
      if (error) throw error
      return user?.id ?? null
    },
    async getOwnerMedia(profileId) {
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
      const { error } = await admin.storage.from('covers').upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (error) throw error
    },
    async activateSlot(profileId, imageId) {
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
      const { error } = await admin
        .from('profile_gallery_images')
        .delete()
        .eq('profile_id', profileId)
        .eq('id', imageId)
      if (error) throw error
    },
    async replaceCover(profileId, objectPath) {
      const { data, error } = await admin.rpc('replace_profile_cover', {
        p_profile_id: profileId,
        p_object_path: objectPath,
      })
      if (error) throw error
      return data
    },
    async getOwnerImage(profileId, imageId) {
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
      const { error } = await admin.rpc('update_profile_gallery_image', {
        p_profile_id: profileId,
        p_image_id: imageId,
        p_display_order: displayOrder,
        p_is_active: isActive,
      })
      if (error) throw error
    },
    async reorderImages(profileId, imageIds) {
      const { error } = await admin.rpc('reorder_profile_gallery_images', {
        p_profile_id: profileId,
        p_image_ids: imageIds,
      })
      if (error) throw error
    },
    async deleteImage(profileId, imageId) {
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
      const { error } = await admin.storage.from('covers').remove([path])
      if (error) throw error
    },
    async signObjectPath(path) {
      const { data, error } = await admin.storage
        .from('covers')
        .createSignedUrl(path, SIGNED_URL_LIFETIME_SECONDS)
      if (error) throw error
      if (!data.signedUrl) throw new Error('O Supabase não retornou uma URL temporária.')
      return data.signedUrl
    },
    async getPublicProfile(profileId) {
      const { data, error } = await admin
        .from('profiles_public')
        .select('id, plan_type')
        .eq('id', profileId)
        .maybeSingle()
      if (error) throw error
      return data ? { plan: normalizeStoredPlanType(data.plan_type) } : null
    },
    async getPublicMedia(profileId) {
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

export async function GET() {
  return (await createHandlers()).GET()
}

export async function POST(request: Request) {
  return (await createHandlers()).POST(request)
}

export async function PATCH(request: Request) {
  return (await createHandlers()).PATCH(request)
}

export async function DELETE(request: Request) {
  return (await createHandlers()).DELETE(request)
}
