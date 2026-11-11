import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const moduleUrl = new URL('../src/lib/profiles/gallery.ts', import.meta.url)
const galleryRoute = readFileSync(new URL('../src/app/api/profile/gallery/route.ts', import.meta.url), 'utf8')
const galleryClient = readFileSync(new URL('../src/components/profile/ProfileGallery.tsx', import.meta.url), 'utf8')

async function loadGallery() {
  assert.ok(existsSync(moduleUrl), 'Profile gallery module must exist')
  return import(moduleUrl.href)
}

function image(id, displayOrder, overrides = {}) {
  return {
    id,
    object_path: `profile-1/${id}.jpg`,
    display_order: displayOrder,
    upload_status: 'ready',
    is_active: true,
    ...overrides,
  }
}

function makeFile(type = 'image/jpeg', contents = [0xff, 0xd8, 0xff]) {
  return new File([new Uint8Array(contents)], 'photo.jpg', { type })
}

function uploadRequest(file, kind = 'photo') {
  const form = new FormData()
  form.set('kind', kind)
  form.set('file', file, 'photo.jpg')
  return new Request('https://app.example/api/profile/gallery', {
    method: 'POST',
    headers: { origin: 'https://app.example' },
    body: form,
  })
}

function createDependencies(overrides = {}) {
  return {
    supabaseUrl: 'https://project.supabase.co',
    authenticate: async () => 'profile-1',
    getOwnerMedia: async () => ({
      plan: 'Essencial',
      coverUrl: null,
      images: [],
    }),
    signObjectPath: async (path) => `https://signed.example/${path}`,
    reserveSlot: async () => 'gallery-image-1',
    uploadObject: async () => {},
    activateSlot: async () => {},
    removeReservation: async () => {},
    replaceCover: async () => null,
    getOwnerImage: async () => null,
    updateImage: async () => {},
    reorderImages: async () => {},
    deleteImage: async () => {},
    deleteObject: async () => {},
    getPublicProfile: async () => ({ plan: 'Essencial' }),
    getPublicMedia: async () => ({ coverUrl: null, images: [] }),
    ...overrides,
  }
}

test('gallery route returns JSON when handler dependencies fail during initialization', () => {
  assert.match(galleryRoute, /runGalleryRoute/)
  assert.match(galleryRoute, /catch \(error\)/)
  assert.match(galleryRoute, /Response\.json\(/)
  assert.match(galleryRoute, /headers: \{ 'Cache-Control': 'private, no-store' \}/)
  assert.match(galleryRoute, /AuthSessionMissingError/)
})

test('gallery client handles empty or non-JSON server errors without a JSON parse exception', () => {
  assert.match(galleryClient, /response\.text\(\)/)
  assert.match(galleryClient, /JSON\.parse\(responseText\)/)
  assert.match(galleryClient, /response\.status/)
  assert.doesNotMatch(galleryClient, /response\.json\(\) as ApiResponse/)
})

test('uses the profile photo limits of zero, three, and ten', async () => {
  const { getGalleryLimit } = await loadGallery()

  assert.equal(getGalleryLimit('Gratuito'), 0)
  assert.equal(getGalleryLimit('Essencial'), 3)
  assert.equal(getGalleryLimit('Profissional'), 10)
})

test('counts the cover but excludes inactive and pending gallery rows from public photos', async () => {
  const { getPublicGallery } = await loadGallery()
  const rows = [
    image('photo-1', 0),
    image('photo-2', 1),
    image('photo-3', 2),
    image('photo-inactive', 3, { is_active: false }),
    image('photo-pending', 4, { upload_status: 'pending' }),
  ]

  assert.deepEqual(
    getPublicGallery(rows, 'Essencial', true).map(({ id }) => id),
    ['photo-1', 'photo-2'],
  )
  assert.deepEqual(getPublicGallery(rows, 'Gratuito', true), [])
  assert.equal(rows.length, 5)
})

test('accepts only safe object paths belonging to this profile for current and legacy covers', async () => {
  const { getCoverObjectPath } = await loadGallery()

  assert.equal(
    getCoverObjectPath(
      'profile-1',
      'https://project.supabase.co/storage/v1/object/public/covers/profile-1/cover.jpg',
      'https://project.supabase.co',
    ),
    'profile-1/cover.jpg',
  )
  assert.equal(
    getCoverObjectPath('profile-1', 'profile-1/cover.jpg', 'https://project.supabase.co'),
    'profile-1/cover.jpg',
  )
  assert.equal(
    getCoverObjectPath(
      'profile-1',
      'https://attacker.example/profile-1/cover.jpg',
      'https://project.supabase.co',
    ),
    null,
  )
  assert.equal(
    getCoverObjectPath('profile-1', 'profile-2/cover.jpg', 'https://project.supabase.co'),
    null,
  )
  assert.equal(
    getCoverObjectPath('profile-1', 'profile-1/../private.jpg', 'https://project.supabase.co'),
    null,
  )
})

test('public signed URLs include only active in-quota media and disappear after downgrade', async () => {
  const { getSignedPublicGallery } = await loadGallery()
  const storedImages = [image('photo-1', 0), image('photo-2', 1), image('photo-3', 2)]
  let plan = 'Essencial'
  const signedPaths = []
  const dependencies = createDependencies({
    getPublicProfile: async () => ({ plan }),
    getPublicMedia: async () => ({
      coverUrl: 'profile-1/cover.jpg',
      images: storedImages,
    }),
    signObjectPath: async (path) => {
      signedPaths.push(path)
      return `https://signed.example/${path}`
    },
  })

  assert.deepEqual(
    await getSignedPublicGallery('profile-1', dependencies),
    [
      { id: 'cover', url: 'https://signed.example/profile-1/cover.jpg', displayOrder: 0 },
      { id: 'photo-1', url: 'https://signed.example/profile-1/photo-1.jpg', displayOrder: 1 },
      { id: 'photo-2', url: 'https://signed.example/profile-1/photo-2.jpg', displayOrder: 2 },
    ],
  )
  assert.equal(signedPaths.length, 3)

  plan = 'Gratuito'
  signedPaths.length = 0
  assert.deepEqual(await getSignedPublicGallery('profile-1', dependencies), [])
  assert.deepEqual(signedPaths, [])
  assert.equal(storedImages.length, 3)
})

test('keeps the business logo outside the additional-photo quota', async () => {
  const { getSignedPublicGallery } = await loadGallery()
  const signedPaths = []
  const images = [image('photo-1', 0), image('photo-2', 1), image('photo-3', 2)]
  const gallery = await getSignedPublicGallery('profile-1', createDependencies({
    getPublicMedia: async () => ({
      coverUrl: null,
      avatarUrl: 'profile-1/logo.jpg',
      images,
    }),
    signObjectPath: async (path) => {
      signedPaths.push(path)
      return `https://signed.example/${path}`
    },
  }))

  assert.equal(gallery.length, 3)
  assert.deepEqual(signedPaths, images.map(({ object_path }) => object_path))
})

test('owner can still view preserved over-quota images after a downgrade', async () => {
  const { createProfileGalleryHandlers } = await loadGallery()
  const storedImages = [
    image('photo-1', 0),
    image('photo-2', 1),
    image('photo-3', 2),
  ]
  const handlers = createProfileGalleryHandlers(createDependencies({
    getOwnerMedia: async () => ({
      plan: 'Gratuito',
      coverUrl: 'profile-1/cover.jpg',
      images: storedImages,
    }),
  }))

  const response = await handlers.GET()
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.images.length, 3)
  assert.ok(body.images.every(({ url }) => url))
  assert.ok(body.images.every(({ isPublic }) => !isPublic))
})

test('rejects gallery uploads larger than five megabytes', async () => {
  const { validateGalleryImage } = await loadGallery()
  const oversized = new File(
    [new Uint8Array(5 * 1024 * 1024 + 1)],
    'large.jpg',
    { type: 'image/jpeg' },
  )

  assert.deepEqual(await validateGalleryImage(oversized), {
    valid: false,
    error: 'A imagem deve ter no máximo 5 MB.',
  })
})

test('rejects unauthenticated gallery mutations before storage or quota operations', async () => {
  const { createProfileGalleryHandlers } = await loadGallery()
  let reservationAttempts = 0
  const handlers = createProfileGalleryHandlers(createDependencies({
    authenticate: async () => null,
    reserveSlot: async () => {
      reservationAttempts += 1
      return 'unexpected'
    },
  }))

  const response = await handlers.POST(uploadRequest(makeFile()))

  assert.equal(response.status, 401)
  assert.equal(reservationAttempts, 0)
})

test('returns an unauthenticated response when the owner has no active Supabase session', async () => {
  const { createProfileGalleryHandlers } = await loadGallery()
  let ownerMediaLookups = 0
  const handlers = createProfileGalleryHandlers(createDependencies({
    authenticate: async () => null,
    getOwnerMedia: async () => {
      ownerMediaLookups += 1
      return null
    },
  }))

  const response = await handlers.GET()
  const body = await response.json()
  assert.equal(response.status, 401)
  assert.equal(ownerMediaLookups, 0)
  assert.match(body.error, /Entre na sua conta/)
})

test('rejects non-image content before reserving a gallery slot', async () => {
  const { createProfileGalleryHandlers } = await loadGallery()
  let reservationAttempts = 0
  const handlers = createProfileGalleryHandlers(createDependencies({
    reserveSlot: async () => {
      reservationAttempts += 1
      return 'unexpected'
    },
  }))

  const response = await handlers.POST(uploadRequest(
    makeFile('image/jpeg', [0x3c, 0x73, 0x76, 0x67]),
  ))

  assert.equal(response.status, 400)
  assert.equal(reservationAttempts, 0)
})

test('concurrent photo uploads cannot both consume the final reserved slot', async () => {
  const { createProfileGalleryHandlers } = await loadGallery()
  let reserved = false
  let uploads = 0
  let reservations = 0
  const handlers = createProfileGalleryHandlers(createDependencies({
    reserveSlot: async () => {
      reservations += 1
      if (reserved) throw new Error('Profile photo limit reached')
      reserved = true
      return 'gallery-image-1'
    },
    uploadObject: async () => {
      uploads += 1
    },
  }))

  const responses = await Promise.all([
    handlers.POST(uploadRequest(makeFile())),
    handlers.POST(uploadRequest(makeFile())),
  ])
  const statuses = responses.map(({ status }) => status).sort()

  assert.deepEqual(statuses, [201, 409])
  assert.equal(reservations, 2)
  assert.equal(uploads, 1)
})

test('cleans the reservation and reports the error when object upload fails', async () => {
  const { createProfileGalleryHandlers } = await loadGallery()
  const removedReservations = []
  const handlers = createProfileGalleryHandlers(createDependencies({
    uploadObject: async () => {
      throw new Error('Storage unavailable')
    },
    removeReservation: async (profileId, imageId) => {
      removedReservations.push([profileId, imageId])
    },
  }))

  const originalError = console.error
  console.error = () => {}
  let response
  try {
    response = await handlers.POST(uploadRequest(makeFile()))
  } finally {
    console.error = originalError
  }

  assert.equal(response.status, 500)
  assert.deepEqual(removedReservations, [['profile-1', 'gallery-image-1']])
})

test('does not mutate a gallery image owned by another profile', async () => {
  const { createProfileGalleryHandlers } = await loadGallery()
  let updateAttempts = 0
  const handlers = createProfileGalleryHandlers(createDependencies({
    getOwnerImage: async (profileId, imageId) => (
      profileId === 'profile-2' && imageId === 'private-image'
        ? image(imageId, 0)
        : null
    ),
    updateImage: async () => {
      updateAttempts += 1
    },
  }))
  const response = await handlers.PATCH(new Request('https://app.example/api/profile/gallery', {
    method: 'PATCH',
    headers: {
      origin: 'https://app.example',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ imageId: 'private-image', isActive: true }),
  }))

  assert.equal(response.status, 404)
  assert.equal(updateAttempts, 0)
})

test('reorders only the complete set of owner gallery images atomically', async () => {
  const { createProfileGalleryHandlers } = await loadGallery()
  let reorderedIds = []
  const handlers = createProfileGalleryHandlers(createDependencies({
    getOwnerMedia: async () => ({
      plan: 'Essencial',
      coverUrl: null,
      images: [image('photo-1', 0), image('photo-2', 1)],
    }),
    reorderImages: async (profileId, imageIds) => {
      assert.equal(profileId, 'profile-1')
      reorderedIds = imageIds
    },
  }))
  const response = await handlers.PATCH(new Request('https://app.example/api/profile/gallery', {
    method: 'PATCH',
    headers: {
      origin: 'https://app.example',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ imageIds: ['photo-2', 'photo-1'] }),
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(reorderedIds, ['photo-2', 'photo-1'])
})

test('does not sign public media when the profile is not publicly eligible', async () => {
  const { getSignedPublicGallery } = await loadGallery()
  let mediaReads = 0
  const gallery = await getSignedPublicGallery('profile-1', createDependencies({
    getPublicProfile: async () => null,
    getPublicMedia: async () => {
      mediaReads += 1
      return { coverUrl: 'profile-1/cover.jpg', images: [image('photo-1', 0)] }
    },
  }))

  assert.deepEqual(gallery, [])
  assert.equal(mediaReads, 0)
})
