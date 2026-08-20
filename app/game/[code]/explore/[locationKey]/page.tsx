'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getLocation } from '@/lib/locations'
import { exploreLocation, getGameState } from '@/app/actions'
import { getPlayerId } from '@/lib/session'
import LocationScene from '@/components/LocationScene'

export default function ExplorePage() {
  const params = useParams()
  const code = params.code as string
  const locationKey = params.locationKey as string
  const router = useRouter()
  const location = getLocation(locationKey)

  const [remaining, setRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ label: string; icon: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getGameState(code).then((state) => {
      if (state) setRemaining(state.locationLootCounts[locationKey] ?? 0)
    })
  }, [code, locationKey])

  if (!location) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <div>Unknown location</div>
          <button onClick={() => router.push(`/game/${code}`)} className="mt-4 bg-blue-600 px-4 py-2 rounded">
            Back to Sanctuary
          </button>
        </div>
      </div>
    )
  }

  async function handleExplore() {
    const playerId = getPlayerId(code)
    if (!playerId) {
      setError('Player session not found. Please rejoin the game.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const found = await exploreLocation(code, playerId, locationKey)
      setResult(found)
      setRemaining((r) => (r !== null ? Math.max(0, r - 1) : r))
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pb-28">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push(`/game/${code}`)} className="text-sm text-gray-400 hover:text-white mb-4">
          ← Back to Sanctuary
        </button>

        <LocationScene location={location} size="full" />

        <div className="mt-6 bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{location.name}</h2>
            <span className="text-sm text-gray-400">
              {remaining === null ? '...' : remaining > 0 ? `${remaining} items remaining` : 'Picked clean'}
            </span>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 p-3 rounded mb-4 text-sm text-red-200">{error}</div>
          )}

          {result && (
            <div className="bg-green-900/50 border border-green-500 p-4 rounded mb-4 flex items-center gap-3">
              <span className="text-3xl">{result.icon}</span>
              <div>
                <div className="font-bold">Found: {result.label}</div>
                <div className="text-xs text-gray-300">Added to your personal inventory.</div>
              </div>
            </div>
          )}

          <button
            onClick={handleExplore}
            disabled={loading || remaining === 0}
            className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 py-3 rounded font-bold transition"
          >
            {loading ? 'Searching...' : remaining === 0 ? 'Nothing left to find' : '🔦 Explore'}
          </button>
        </div>
      </div>
    </div>
  )
}