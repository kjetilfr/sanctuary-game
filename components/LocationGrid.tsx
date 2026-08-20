'use client'
import { useRouter } from 'next/navigation'
import { LOCATIONS } from '@/lib/locations'
import LocationScene from './LocationScene'

export default function LocationGrid({
  code,
  locationLootCounts,
}: {
  code: string
  locationLootCounts: Record<string, number>
}) {
  const router = useRouter()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {LOCATIONS.map((loc) => {
        const remaining = locationLootCounts[loc.key] ?? 0
        return (
          <button key={loc.key} onClick={() => router.push(`/game/${code}/explore/${loc.key}`)} className="text-left relative">
            <LocationScene location={loc} size="thumbnail" />
            <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${remaining > 0 ? 'bg-yellow-600' : 'bg-gray-700 text-gray-400'}`}>
              {remaining > 0 ? `${remaining} left` : 'picked clean'}
            </span>
          </button>
        )
      })}
    </div>
  )
}