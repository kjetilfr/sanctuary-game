'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getGameState } from '@/app/actions'
import { GameState } from '@/lib/types'
import { getSocket } from '@/lib/socket'
import CitizenRoster from '@/components/CitizenRoster'
import ResourcePanel from '@/components/ResourcePanel'
import PhaseControls from '@/components/PhaseControls'

export default function GamePage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()
  const [game, setGame] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch initial game state
    const fetchData = async () => {
      try {
        const data = await getGameState(code)
        setGame(data)
      } catch (err) {
        console.error(err)
        router.push('/')
      }
      setLoading(false)
    }
    fetchData()

    // Connect to WebSocket for real-time updates
    const socket = getSocket()
    socket.emit('join-game', code)

    socket.on('resource-updated', () => {
      fetchData()
    })
    socket.on('player-joined', () => {
      fetchData()
    })
    socket.on('night-advanced', () => {
      fetchData()
    })
    socket.on('day-started', () => {
      fetchData()
    })
    socket.on('citizen-updated', () => {
      fetchData()
    })
    socket.on('game-started', () => {
      fetchData()
    })

    return () => {
      socket.disconnect()
    }
  }, [code, router])

  if (loading) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🏚️</div>
        <div className="animate-pulse">Loading Sanctuary...</div>
      </div>
    </div>
  )

  if (!game) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">❌</div>
        <div>Game not found</div>
        <button onClick={() => router.push('/')} className="mt-4 bg-blue-600 px-4 py-2 rounded">
          Go back to lobby
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">🏚️ Sanctuary: Aftermath</h1>
            <p className="text-sm text-gray-400">Game Code: <span className="font-mono text-yellow-400">{code}</span></p>
          </div>
          <div className="text-right">
            <div className={`inline-block px-4 py-2 rounded font-bold ${game.phase === 'Day' ? 'bg-orange-600' : 'bg-blue-800'}`}>
              {game.phase} - Night {game.nightCount}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {game.players.length}/8 players • {game.status === 'waiting' ? 'Waiting to start' : 'In progress'}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Players & Controls */}
          <div className="lg:col-span-1 bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">👥 Survivors</h2>
            <div className="space-y-2 mb-6">
              {game.players.map((p) => (
                <div key={p.id} className="flex justify-between py-1 border-b border-gray-700">
                  <span>{p.name}</span>
                  {p.role && <span className="text-xs text-green-400">{p.role}</span>}
                  {p.isHost === 1 && <span className="text-xs text-yellow-400">👑</span>}
                </div>
              ))}
            </div>
            <PhaseControls code={code} phase={game.phase} status={game.status} />
          </div>

          {/* Right: Resources & Citizens */}
          <div className="lg:col-span-2 bg-gray-800 p-4 rounded-xl border border-gray-700">
            <ResourcePanel resources={game.resources} code={code} phase={game.phase} />
            <div className="mt-6">
              <CitizenRoster citizens={game.citizens} code={code} resources={game.resources} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}