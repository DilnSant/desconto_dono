'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowDown, ArrowUp, Camera, Loader2, Trash2 } from 'lucide-react'

interface GalleryImage {
  id: string
  url: string | null
  displayOrder: number
  isActive: boolean
  uploadStatus: 'pending' | 'ready' | 'failed'
  isPublic: boolean
}

interface GalleryState {
  plan: 'Gratuito' | 'Essencial' | 'Profissional'
  limit: number
  cover: string | null
  images: GalleryImage[]
}

interface ApiResponse {
  error?: string
  warning?: string
  cover?: string | null
  image?: { id: string }
  success?: boolean
  plan?: GalleryState['plan']
  limit?: number
  images?: GalleryImage[]
}

async function readResponse(response: Response): Promise<ApiResponse> {
  const body = await response.json() as ApiResponse
  if (!response.ok) throw new Error(body.error || 'Não foi possível concluir a operação.')
  return body
}

async function fetchGalleryState(): Promise<GalleryState> {
  const response = await fetch('/api/profile/gallery', { cache: 'no-store' })
  const body = await readResponse(response)
  if (!body.plan || typeof body.limit !== 'number' || !body.images) {
    throw new Error('Resposta inválida ao carregar as fotos do perfil.')
  }
  return {
    plan: body.plan,
    limit: body.limit,
    cover: body.cover ?? null,
    images: body.images,
  }
}

export default function ProfileGallery() {
  const coverInput = useRef<HTMLInputElement>(null)
  const photoInput = useRef<HTMLInputElement>(null)
  const [gallery, setGallery] = useState<GalleryState | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadGallery = useCallback(async () => {
    try {
      const state = await fetchGalleryState()
      setError('')
      setGallery(state)
    } catch (loadError) {
      setError(loadError instanceof Error
        ? loadError.message
        : 'Não foi possível carregar as fotos do perfil.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void fetchGalleryState()
      .then((state) => {
        if (active) {
          setError('')
          setGallery(state)
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar as fotos do perfil.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const upload = async (file: File, kind: 'cover' | 'photo') => {
    setBusy(true)
    setError('')
    setNotice('')
    const form = new FormData()
    form.set('kind', kind)
    form.set('file', file)

    try {
      const response = await fetch('/api/profile/gallery', { method: 'POST', body: form })
      const body = await readResponse(response)
      if (body.warning) setNotice(body.warning)
      await loadGallery()
    } catch (uploadError) {
      setError(uploadError instanceof Error
        ? uploadError.message
        : 'Não foi possível enviar a imagem.')
    } finally {
      setBusy(false)
    }
  }

  const updateImage = async (imageId: string, isActive: boolean) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/profile/gallery', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageId, isActive }),
      })
      await readResponse(response)
      await loadGallery()
    } catch (updateError) {
      setError(updateError instanceof Error
        ? updateError.message
        : 'Não foi possível atualizar a foto.')
    } finally {
      setBusy(false)
    }
  }

  const reorder = async (imageId: string, offset: -1 | 1) => {
    if (!gallery) return
    const orderedImages = [...gallery.images].sort(
      (left, right) => left.displayOrder - right.displayOrder || left.id.localeCompare(right.id),
    )
    const currentIndex = orderedImages.findIndex((image) => image.id === imageId)
    const destination = currentIndex + offset
    if (currentIndex < 0 || destination < 0 || destination >= orderedImages.length) return
    ;[orderedImages[currentIndex], orderedImages[destination]] = [
      orderedImages[destination],
      orderedImages[currentIndex],
    ]

    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/profile/gallery', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageIds: orderedImages.map(({ id }) => id) }),
      })
      await readResponse(response)
      await loadGallery()
    } catch (reorderError) {
      setError(reorderError instanceof Error
        ? reorderError.message
        : 'Não foi possível reordenar as fotos.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (imageId: string) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/profile/gallery', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageId }),
      })
      const body = await readResponse(response)
      if (body.warning) setNotice(body.warning)
      await loadGallery()
    } catch (deleteError) {
      setError(deleteError instanceof Error
        ? deleteError.message
        : 'Não foi possível remover a foto.')
    } finally {
      setBusy(false)
    }
  }

  const activeImageCount = gallery?.images.filter(
    (image) => image.isActive && image.uploadStatus === 'ready',
  ).length ?? 0
  const usedSlots = activeImageCount + Number(Boolean(gallery?.cover))
  const hasPhotoSlot = Boolean(gallery && gallery.limit > usedSlots)
  const canReplaceCover = Boolean(
    gallery && gallery.limit > 0 && (gallery.cover || hasPhotoSlot),
  )

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-lg font-black text-gray-800">Fotos do perfil</h2>
        <p className="mt-1 text-sm text-gray-500">
          A logomarca não consome vagas. Capa e galeria compartilham o limite do plano.
        </p>
        {gallery && (
          <p className="mt-2 text-sm font-semibold text-gray-700">
            {usedSlots} de {gallery.limit} fotos adicionais utilizadas
          </p>
        )}
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button type="button" className="ml-auto font-semibold underline" onClick={() => void loadGallery()}>
            Tentar novamente
          </button>
        </div>
      )}
      {notice && <p role="status" className="text-sm text-amber-700">{notice}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando fotos...
        </div>
      ) : gallery ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-blue-800">
                {gallery.cover && (
                  <Image
                    src={gallery.cover}
                    alt="Capa atual do perfil"
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gray-700">Capa</span>
                <div className="flex gap-2">
                  {gallery.cover && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void remove('cover')}
                      className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Remover
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy || !canReplaceCover}
                    onClick={() => coverInput.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {gallery.cover ? 'Alterar' : 'Adicionar'}
                  </button>
                </div>
              </div>
            </div>

            {gallery.limit === 0 && (
              <div className="flex flex-col justify-center rounded-2xl bg-gray-50 p-5">
                <p className="font-bold text-gray-800">Fotos adicionais no Essencial</p>
                <p className="mt-1 text-sm text-gray-600">
                  No plano Gratuito você mantém a logomarca. Capa e galeria estão disponíveis nos planos pagos.
                </p>
                <Link href="/planos" className="mt-3 text-sm font-bold text-green-700 hover:underline">
                  Conhecer planos
                </Link>
              </div>
            )}
          </div>

          <input
            ref={coverInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void upload(file, 'cover')
              event.target.value = ''
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <div>
              <h3 className="font-bold text-gray-800">Galeria da empresa</h3>
              <p className="text-xs text-gray-500">JPEG, PNG ou WebP, até 5 MB por imagem.</p>
            </div>
            <button
              type="button"
              disabled={busy || !hasPhotoSlot}
              onClick={() => photoInput.current?.click()}
              className="rounded-xl border border-green-200 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Adicionar foto
            </button>
          </div>
          <input
            ref={photoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void upload(file, 'photo')
              event.target.value = ''
            }}
          />

          {gallery.images.length === 0 ? (
            <p className="rounded-xl bg-gray-50 px-4 py-5 text-center text-sm text-gray-500">
              Nenhuma foto adicional cadastrada.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.images
                .slice()
                .sort((left, right) => left.displayOrder - right.displayOrder || left.id.localeCompare(right.id))
                .map((image, index, orderedImages) => (
                  <article key={image.id} className="overflow-hidden rounded-2xl border border-gray-100">
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {image.url && (
                        <Image
                          src={image.url}
                          alt={`Foto ${index + 1} da empresa`}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="space-y-3 p-3">
                      <p className="text-xs text-gray-600">
                        {image.isPublic
                          ? 'Visível no perfil público'
                          : image.isActive
                            ? 'Preservada, mas fora do limite público atual'
                            : 'Inativa'}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            aria-label="Mover foto para cima"
                            disabled={busy || index === 0}
                            onClick={() => void reorder(image.id, -1)}
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Mover foto para baixo"
                            disabled={busy || index === orderedImages.length - 1}
                            onClick={() => void reorder(image.id, 1)}
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busy || (!image.isActive && !hasPhotoSlot)}
                            onClick={() => void updateImage(image.id, !image.isActive)}
                            className="rounded-lg px-2 py-2 text-xs font-semibold text-green-800 hover:bg-green-50 disabled:opacity-50"
                          >
                            {image.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            type="button"
                            aria-label="Excluir foto"
                            disabled={busy}
                            onClick={() => void remove(image.id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  )
}
