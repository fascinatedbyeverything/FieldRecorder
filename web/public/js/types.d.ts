export interface Recording {
  id: string
  title?: string
  provider?: string
  lat?: number | null
  lng?: number | null
  duration_sec?: number | null
  tags?: string[]
  species?: string | null
  license?: string
  stream_url?: string
  thumbnail_url?: string | null
  recorded_at?: string | null
  inferred_geo?: boolean
}

export interface ProviderMeta {
  name: string
  description?: string
  has_geo?: boolean
}

export interface SearchResponse {
  recordings: Recording[]
  total: number
  page?: number
  providers_queried?: string[]
  providers_failed?: string[]
}

export interface SearchFilters {
  searchText: string
  locationText: string
  activeTypes: string[]
  searchLat: number | null
  searchLng: number | null
  searchRadius: number
  minDuration: number
}

export interface GeocodeResult {
  lat: number
  lng: number
  name: string
}

export type CategoryResponse = string[]

export interface UploadResponse {
  ok: boolean
  id?: string
  error?: string
}
