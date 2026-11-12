import { getPlanEntitlements, normalizeStoredPlanType } from '../plans/entitlements.ts'
import type { PlanType } from '../../types/database.ts'

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const SIGNED_URL_LIFETIME_SECONDS = 300

export interface ProfileGalleryImage {
  id: string
  object_path: string
  display_order: number
  upload_status: 'pending' | 'ready' | 'failed'
  is_active: boolean
}

export interface GalleryMedia {
  plan: PlanType
  coverUrl: string | null
  images: ProfileGalleryImage[]
}

interface PublicGalleryDependencies {
  supabaseUrl: string
  getPublicProfile(profileId: string): Promise<{ plan: PlanType } | null>
  getPublicMedia(profileId: string): Promise<{
    coverUrl: string | null
    images: ProfileGalleryImage[]
  }>
  signObjectPath(path: string): Promise<string>
}

export interface GalleryRouteDependencies extends PublicGalleryDependencies {
  authenticate(): Promise<string | null>
  getOwnerMedia(profileId: string): Promise<GalleryMedia | null>
  reserveSlot(profileId: string, objectPath: string, displayOrder: number): Promise<string>
  uploadObject(path: string, file: File): Promise<void>
  activateSlot(profileId: string, imageId: string): Promise<void>
  removeReservation(profileId: string, imageId: string): Promise<void>
  replaceCover(profileId: string, objectPath: string | null): Promise<string | null>
  getOwnerImage(profileId: string, imageId: string): Promise<ProfileGalleryImage | null>
  updateImage(
    profileId: string,
    imageId: string,
    displayOrder: number,
    isActive: boolean,
  ): Promise<void>
  reorderImages(profileId: string, imageIds: string[]): Promise<void>
  deleteImage(profileId: string, imageId: string): Promise<void>
  deleteObject(path: string): Promise<void>
}

export function getGalleryLimit(plan: PlanType): number {
  return getPlanEntitlements(plan).maxProfilePhotos
}

export function getPublicGallery(
  images: ProfileGalleryImage[],
  plan: PlanType,
  hasCover: boolean,
): ProfileGalleryImage[] {
  const remainingSlots = Math.max(0, getGalleryLimit(plan) - Number(hasCover))

  return images
    .filter((image) => image.is_active && image.upload_status === 'ready')
    .sort((left, right) =>
      left.display_order - right.display_order || left.id.localeCompare(right.id),
    )
    .slice(0, remainingSlots)
}

export function getCoverObjectPath(
  profileId: string,
  coverUrl: string | null,
  supabaseUrl: string,
): string | null {
  if (!coverUrl) return null

  if (coverUrl.startsWith(`${profileId}/`)) {
    return isProfileObjectPath(profileId, coverUrl) ? coverUrl : null
  }

  try {
    const candidate = new URL(coverUrl)
    const configuredProject = new URL(supabaseUrl)
    const publicBucketPrefix = '/storage/v1/object/public/covers/'

    if (
      candidate.origin !== configuredProject.origin
      || !candidate.pathname.startsWith(publicBucketPrefix)
    ) {
      return null
    }

    const encodedObjectPath = candidate.pathname.slice(publicBucketPrefix.length)
    const objectPath = encodedObjectPath
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/')

    return isProfileObjectPath(profileId, objectPath) ? objectPath : null
  } catch {
    return null
  }
}

export function isProfileObjectPath(profileId: string, objectPath: string): boolean {
  if (
    !objectPath.startsWith(`${profileId}/`)
    || objectPath.includes('\\')
    || objectPath.includes('?')
    || objectPath.includes('#')
  ) return false

  const segments = objectPath.split('/')
  return segments.length >= 2
    && segments.every((segment) =>
      segment.length > 0
      && segment !== '.'
      && segment !== '..'
      && !segment.includes('\0'),
    )
}

export async function validateGalleryImage(file: File): Promise<{ valid: boolean; error?: string }> {
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: 'A imagem deve ter no máximo 5 MB.' }
  }

  const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const isJpeg = file.type === 'image/jpeg'
    && signature[0] === 0xff
    && signature[1] === 0xd8
    && signature[2] === 0xff
  const isPng = file.type === 'image/png'
    && signature[0] === 0x89
    && signature[1] === 0x50
    && signature[2] === 0x4e
    && signature[3] === 0x47
    && signature[4] === 0x0d
    && signature[5] === 0x0a
    && signature[6] === 0x1a
    && signature[7] === 0x0a
  const isWebp = file.type === 'image/webp'
    && signature[0] === 0x52
    && signature[1] === 0x49
    && signature[2] === 0x46
    && signature[3] === 0x46
    && signature[8] === 0x57
    && signature[9] === 0x45
    && signature[10] === 0x42
    && signature[11] === 0x50

  if (!isJpeg && !isPng && !isWebp) {
    return { valid: false, error: 'Envie uma imagem JPEG, PNG ou WebP válida.' }
  }

  return { valid: true }
}

async function loadDefaultPublicGalleryDependencies(): Promise<PublicGalleryDependencies> {
  const { createSupabaseAdminClient } = await import('../supabase/admin.ts')
  const admin = createSupabaseAdminClient()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada.')

  return {
    supabaseUrl,
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
      return {
        coverUrl: profileResult.data.cover_url,
        images: imagesResult.data,
      }
    },
    async signObjectPath(path) {
      const { data, error } = await admin.storage
        .from('covers')
        .createSignedUrl(path, SIGNED_URL_LIFETIME_SECONDS)
      if (error) throw error
      if (!data.signedUrl) throw new Error('O Supabase não retornou uma URL temporária.')
      return data.signedUrl
    },
  }
}

export async function getSignedPublicGallery(
  profileId: string,
  dependencies?: PublicGalleryDependencies,
): Promise<Array<{ id: string; url: string; displayOrder: number }>> {
  const resolvedDependencies = dependencies ?? await loadDefaultPublicGalleryDependencies()
  const publicProfile = await resolvedDependencies.getPublicProfile(profileId)
  if (!publicProfile) return []

  const planLimit = getGalleryLimit(publicProfile.plan)
  if (planLimit === 0) return []

  const media = await resolvedDependencies.getPublicMedia(profileId)
  const coverPath = getCoverObjectPath(
    profileId,
    media.coverUrl,
    resolvedDependencies.supabaseUrl,
  )
  const safeImages = media.images.filter((image) =>
    isProfileObjectPath(profileId, image.object_path),
  )
  const eligibleImages = getPublicGallery(safeImages, publicProfile.plan, Boolean(coverPath))
  const signedGallery: Array<{ id: string; url: string; displayOrder: number }> = []

  if (coverPath) {
    signedGallery.push({
      id: 'cover',
      url: await resolvedDependencies.signObjectPath(coverPath),
      displayOrder: 0,
    })
  }

  const signedImages = await Promise.all(eligibleImages.map(async (image) => ({
    id: image.id,
    url: await resolvedDependencies.signObjectPath(image.object_path),
    displayOrder: image.display_order + Number(Boolean(coverPath)),
  })))

  return [...signedGallery, ...signedImages]
}

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

function isFile(value: FormDataEntryValue | null): value is File {
  return value !== null
    && typeof value !== 'string'
    && typeof value.arrayBuffer === 'function'
    && typeof value.name === 'string'
    && typeof value.size === 'number'
}

function isQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('limit') && (message.includes('photo') || message.includes('gallery'))
}

function getImageExtension(type: string): string {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/png') return 'png'
  return 'webp'
}

function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get('origin')
  return origin !== null && origin === new URL(request.url).origin
}

function logGalleryError(operation: string, error: unknown): void {
  console.error(`[PROFILE_GALLERY] ${operation}`, error)
}

async function cleanupUpload(
  dependencies: GalleryRouteDependencies,
  profileId: string,
  reservationId: string,
  objectPath: string,
  objectUploaded: boolean,
): Promise<void> {
  if (objectUploaded) {
    try {
      await dependencies.deleteObject(objectPath)
    } catch (error) {
      logGalleryError('Falha ao remover objeto após upload incompleto', error)
    }
  }

  try {
    await dependencies.removeReservation(profileId, reservationId)
  } catch (error) {
    logGalleryError('Falha ao remover reserva após upload incompleto', error)
  }
}

export function createProfileGalleryHandlers(dependencies: GalleryRouteDependencies) {
  return {
    async GET(): Promise<Response> {
      let profileId: string | null
      try {
        profileId = await dependencies.authenticate()
      } catch (error) {
        logGalleryError('Falha ao autenticar leitura do proprietário', error)
        return jsonResponse({ error: 'Não foi possível autenticar a solicitação.' }, 500)
      }
      if (!profileId) return jsonResponse({ error: 'Entre na sua conta para continuar.' }, 401)

      try {
        const media = await dependencies.getOwnerMedia(profileId)
        if (!media) return jsonResponse({ error: 'Perfil não encontrado.' }, 404)

        const coverPath = getCoverObjectPath(profileId, media.coverUrl, dependencies.supabaseUrl)
        const safeImages = media.images.filter((image) =>
          isProfileObjectPath(profileId, image.object_path),
        )
        const publicIds = new Set(
          getPublicGallery(safeImages, media.plan, Boolean(coverPath)).map(({ id }) => id),
        )
        let cover: string | null = null
        if (coverPath) {
          try {
            cover = await dependencies.signObjectPath(coverPath)
          } catch {
            cover = null
          }
        }
        const images = await Promise.all(media.images.map(async (image) => {
          let url: string | null = null
          if (image.upload_status === 'ready' && isProfileObjectPath(profileId, image.object_path)) {
            try {
              url = await dependencies.signObjectPath(image.object_path)
            } catch {
              url = null
            }
          }
          return {
            id: image.id,
            url,
            displayOrder: image.display_order,
            isActive: image.is_active,
            uploadStatus: image.upload_status,
            isPublic: publicIds.has(image.id),
          }
        }))

        return jsonResponse({
          plan: media.plan,
          limit: getGalleryLimit(media.plan),
          cover,
          images,
        })
      } catch (error) {
        logGalleryError('Falha ao carregar galeria do proprietário', error)
        return jsonResponse({ error: 'Não foi possível carregar as fotos do perfil.' }, 500)
      }
    },

    async POST(request: Request): Promise<Response> {
      if (!isSameOriginMutation(request)) {
        return jsonResponse({ error: 'Origem da solicitação inválida.' }, 403)
      }

      let profileId: string | null
      try {
        profileId = await dependencies.authenticate()
      } catch (error) {
        logGalleryError('Falha ao autenticar upload', error)
        return jsonResponse({ error: 'Não foi possível autenticar a solicitação.' }, 500)
      }
      if (!profileId) return jsonResponse({ error: 'Entre na sua conta para continuar.' }, 401)

      let form: FormData
      try {
        form = await request.formData()
      } catch {
        return jsonResponse({ error: 'Envie uma imagem válida.' }, 400)
      }
      const kind = form.get('kind')
      const file = form.get('file')
      if ((kind !== 'cover' && kind !== 'photo') || !isFile(file)) {
        return jsonResponse({ error: 'Selecione uma imagem válida.' }, 400)
      }

      const validation = await validateGalleryImage(file)
      if (!validation.valid) return jsonResponse({ error: validation.error }, 400)

      let media: GalleryMedia | null
      try {
        media = await dependencies.getOwnerMedia(profileId)
      } catch (error) {
        logGalleryError('Falha ao verificar perfil antes do upload', error)
        return jsonResponse({ error: 'Não foi possível verificar o limite de fotos.' }, 500)
      }
      if (!media) return jsonResponse({ error: 'Perfil não encontrado.' }, 404)

      const objectPath = `${profileId}/${globalThis.crypto.randomUUID()}.${getImageExtension(file.type)}`

      if (kind === 'cover') {
        let objectUploaded = false
        try {
          await dependencies.uploadObject(objectPath, file)
          objectUploaded = true
          const url = await dependencies.signObjectPath(objectPath)
          const previousCover = await dependencies.replaceCover(profileId, objectPath)
          const previousCoverPath = getCoverObjectPath(
            profileId,
            previousCover,
            dependencies.supabaseUrl,
          )
          let warning: string | undefined
          if (previousCoverPath && previousCoverPath !== objectPath) {
            try {
              await dependencies.deleteObject(previousCoverPath)
            } catch (error) {
              logGalleryError('Capa substituída, mas a imagem anterior não foi removida', error)
              warning = 'A capa foi alterada, mas a imagem anterior não pôde ser removida.'
            }
          }
          return jsonResponse({ cover: url, warning }, 201)
        } catch (error) {
          if (objectUploaded) {
            try {
              await dependencies.deleteObject(objectPath)
            } catch (cleanupError) {
              logGalleryError('Falha ao remover nova capa após erro', cleanupError)
            }
          }
          if (isQuotaError(error)) {
            return jsonResponse({ error: 'O plano atual não permite outra foto de perfil.' }, 409)
          }
          logGalleryError('Falha ao salvar capa', error)
          return jsonResponse({ error: 'Não foi possível salvar a capa.' }, 500)
        }
      }

      const displayOrder = media.images.reduce(
        (maximum, image) => Math.max(maximum, image.display_order + 1),
        0,
      )
      let reservationId: string
      try {
        reservationId = await dependencies.reserveSlot(profileId, objectPath, displayOrder)
      } catch (error) {
        if (isQuotaError(error)) {
          return jsonResponse({ error: 'O limite de fotos do seu plano foi atingido.' }, 409)
        }
        logGalleryError('Falha ao reservar vaga para foto', error)
        return jsonResponse({ error: 'Não foi possível reservar uma vaga para a foto.' }, 500)
      }

      let objectUploaded = false
      try {
        await dependencies.uploadObject(objectPath, file)
        objectUploaded = true
        const url = await dependencies.signObjectPath(objectPath)
        await dependencies.activateSlot(profileId, reservationId)
        return jsonResponse({
          image: { id: reservationId, url, displayOrder, isActive: true },
        }, 201)
      } catch (error) {
        await cleanupUpload(dependencies, profileId, reservationId, objectPath, objectUploaded)
        if (isQuotaError(error)) {
          return jsonResponse({ error: 'O limite de fotos do seu plano foi atingido.' }, 409)
        }
        logGalleryError('Falha ao concluir upload da foto', error)
        return jsonResponse({ error: 'Não foi possível concluir o upload da foto.' }, 500)
      }
    },

    async PATCH(request: Request): Promise<Response> {
      if (!isSameOriginMutation(request)) {
        return jsonResponse({ error: 'Origem da solicitação inválida.' }, 403)
      }

      let profileId: string | null
      try {
        profileId = await dependencies.authenticate()
      } catch (error) {
        logGalleryError('Falha ao autenticar atualização da galeria', error)
        return jsonResponse({ error: 'Não foi possível autenticar a solicitação.' }, 500)
      }
      if (!profileId) return jsonResponse({ error: 'Entre na sua conta para continuar.' }, 401)

      let input: unknown
      try {
        input = await request.json()
      } catch {
        return jsonResponse({ error: 'Dados inválidos.' }, 400)
      }
      if (!input || typeof input !== 'object') {
        return jsonResponse({ error: 'Dados inválidos.' }, 400)
      }

      const body = input as Record<string, unknown>
      if (Array.isArray(body.imageIds)) {
        if (
          !body.imageIds.every((imageId): imageId is string =>
            typeof imageId === 'string' && imageId.length > 0,
          )
          || new Set(body.imageIds).size !== body.imageIds.length
        ) {
          return jsonResponse({ error: 'Ordem de fotos inválida.' }, 400)
        }

        try {
          const media = await dependencies.getOwnerMedia(profileId)
          if (!media) return jsonResponse({ error: 'Perfil não encontrado.' }, 404)
          const ownerImageIds = new Set(media.images.map(({ id }) => id))
          if (
            ownerImageIds.size !== body.imageIds.length
            || body.imageIds.some((imageId) => !ownerImageIds.has(imageId))
          ) {
            return jsonResponse({ error: 'A ordem deve incluir somente as fotos deste perfil.' }, 404)
          }
          await dependencies.reorderImages(profileId, body.imageIds)
          return jsonResponse({ success: true })
        } catch (error) {
          logGalleryError('Falha ao reordenar fotos da galeria', error)
          return jsonResponse({ error: 'Não foi possível reordenar as fotos.' }, 500)
        }
      }

      const imageId = body.imageId
      const hasActiveState = body.isActive !== undefined
      if (
        typeof imageId !== 'string'
        || imageId.length === 0
        || !hasActiveState
        || (hasActiveState && typeof body.isActive !== 'boolean')
      ) {
        return jsonResponse({ error: 'Dados inválidos para atualizar a foto.' }, 400)
      }

      try {
        const image = await dependencies.getOwnerImage(profileId, imageId)
        if (!image) return jsonResponse({ error: 'Foto não encontrada.' }, 404)
        await dependencies.updateImage(
          profileId,
          imageId,
          image.display_order,
          Boolean(body.isActive),
        )
        return jsonResponse({ success: true })
      } catch (error) {
        if (isQuotaError(error)) {
          return jsonResponse({ error: 'O limite de fotos do seu plano foi atingido.' }, 409)
        }
        logGalleryError('Falha ao atualizar foto da galeria', error)
        return jsonResponse({ error: 'Não foi possível atualizar a foto.' }, 500)
      }
    },

    async DELETE(request: Request): Promise<Response> {
      if (!isSameOriginMutation(request)) {
        return jsonResponse({ error: 'Origem da solicitação inválida.' }, 403)
      }

      let profileId: string | null
      try {
        profileId = await dependencies.authenticate()
      } catch (error) {
        logGalleryError('Falha ao autenticar remoção da galeria', error)
        return jsonResponse({ error: 'Não foi possível autenticar a solicitação.' }, 500)
      }
      if (!profileId) return jsonResponse({ error: 'Entre na sua conta para continuar.' }, 401)

      let input: unknown
      try {
        input = await request.json()
      } catch {
        return jsonResponse({ error: 'Dados inválidos.' }, 400)
      }
      if (!input || typeof input !== 'object' || typeof (input as Record<string, unknown>).imageId !== 'string') {
        return jsonResponse({ error: 'Dados inválidos.' }, 400)
      }
      const imageId = (input as { imageId: string }).imageId
      if (imageId === 'cover') {
        try {
          const media = await dependencies.getOwnerMedia(profileId)
          if (!media) return jsonResponse({ error: 'Perfil não encontrado.' }, 404)
          const previousCover = await dependencies.replaceCover(profileId, null)
          const previousCoverPath = getCoverObjectPath(
            profileId,
            previousCover ?? media.coverUrl,
            dependencies.supabaseUrl,
          )
          let warning: string | undefined
          if (previousCoverPath) {
            try {
              await dependencies.deleteObject(previousCoverPath)
            } catch (error) {
              logGalleryError('Capa removida, mas o objeto não pôde ser excluído', error)
              warning = 'A capa foi removida, mas o arquivo antigo não pôde ser excluído.'
            }
          }
          return jsonResponse({ success: true, warning })
        } catch (error) {
          logGalleryError('Falha ao remover capa', error)
          return jsonResponse({ error: 'Não foi possível remover a capa.' }, 500)
        }
      }

      try {
        const image = await dependencies.getOwnerImage(profileId, imageId)
        if (!image) return jsonResponse({ error: 'Foto não encontrada.' }, 404)
        await dependencies.deleteImage(profileId, imageId)
        let warning: string | undefined
        try {
          await dependencies.deleteObject(image.object_path)
        } catch (error) {
          logGalleryError('Foto removida da galeria, mas o objeto não pôde ser excluído', error)
          warning = 'A foto foi removida da galeria, mas o arquivo privado não pôde ser excluído.'
        }
        return jsonResponse({ success: true, warning })
      } catch (error) {
        logGalleryError('Falha ao remover foto da galeria', error)
        return jsonResponse({ error: 'Não foi possível remover a foto.' }, 500)
      }
    },
  }
}
