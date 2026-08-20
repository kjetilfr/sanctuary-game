'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getGameState } from '@/app/actions'
import { GameState } from '@/lib/types'
import { getSocket } from '@/lib/socketServer'
import { getPlayerId } from '@/lib/session'
import CitizenRoster from '@/components/CitizenRoster'
import ResourcePanel from '@/components/ResourcePanel'
import PhaseControls from '@/components/PhaseControls'
import LocationGrid from '@/components/LocationGrid'
import GameHUD from '@/components/GameHUD'

export default function GamePage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()
  const [game, setGame] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)

  useEffect(() => {
    const pid = getPlayerId(code)
    setMyPlayerId(pid)

    const fetchData = async () => {
      try {
        const data = await getGameState(code, pid ?? undefined)
        setGame(data)
      } catch (err) {
        console.error(err)
        router.push('/')
      }
      setLoading(false)
    }
    fetchData()

    const socket = getSocket()
    socket.emit('join-game', code)
    ;['resource-updated', 'player-joined', 'night-advanced', 'day-started', 'citizen-updated', 'game-started', 'inventory-updated']
      .forEach((event) => socket.on(event, fetchData))

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

  const winner = game.mode === 'versus' && game.status === 'ended'
    ? game.players.find((p) => p.isAlive)
    : null

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pb-32">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">🏚️ Sanctuary: Aftermath</h1>
            <p className="text-sm text-gray-400">
              Game Code: <span className="font-mono text-yellow-400">{code}</span>
              <span className="ml-3 px-2 py-0.5 rounded bg-gray-700 text-xs uppercase tracking-wide">
                {game.mode === 'coop' ? '🤝 Coop' : '⚔️ Versus'}
              </span>
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-block px-4 py-2 rounded font-bold ${game.phase === 'Day' ? 'bg-orange-600' : 'bg-blue-800'}`}>
              {game.phase} - Night {game.nightCount}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {game.players.length}/8 players • {game.status === 'waiting' ? 'Waiting to start' : game.status === 'ended' ? 'Game over' : 'In progress'}
            </div>
          </div>
        </div>

        {winner && (
          <div className="bg-yellow-900/50 border border-yellow-500 p-4 rounded-xl mb-6 text-center">
            <div className="text-2xl font-bold text-yellow-400">🏆 {winner.name} wins!</div>
            <p className="text-sm text-gray-300">Last survivor standing.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">👥 Survivors</h2>
            <div className="space-y-2 mb-6">
              {game.players.map((p) => (
                <div key={p.id} className="flex justify-between py-1 border-b border-gray-700">
                  <span className={p.isAlive === 0 ? 'text-gray-500 line-through' : ''}>{p.name}</span>
                  {p.role && <span className="text-xs text-green-400">{p.role}</span>}
                  {p.isHost === 1 && <span className="text-xs text-yellow-400">👑</span>}
                </div>
              ))}
            </div>
            {game.status !== 'ended' && <PhaseControls code={code} phase={game.phase} status={game.status} />}
          </div>

          <div className="lg:col-span-2 bg-gray-800 p-4 rounded-xl border border-gray-700">
            {game.mode === 'coop' ? (
              <>
                <ResourcePanel resources={game.resources} code={code} phase={game.phase} />
                <div className="mt-6">
                  <CitizenRoster citizens={game.citizens} code={code} resources={game.resources} />
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-400">
                No shared stockpile in Versus mode — scavenge for yourself and check the HUD below for who's still standing.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4">🗺️ Explore the Ruins</h2>
          <LocationGrid code={code} locationLootCounts={game.locationLootCounts} />
        </div>
      </div>

      <GameHUD code={code} game={game} myPlayerId={myPlayerId} />
    </div>
  )
}