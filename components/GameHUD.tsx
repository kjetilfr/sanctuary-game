import { GameState } from '@/lib/types'
import PlayerHUD from './PlayerHUD'
import SharedHUD from './SharedHUD'

export default function GameHUD({
  code, game, myPlayerId,
}: {
  code: string
  game: GameState
  myPlayerId: string | null
}) {
  const me = game.players.find((p) => p.id === myPlayerId)

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-gray-800 border-t border-gray-700">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-700">
        <PlayerHUD code={code} mode={game.mode} player={me} inventory={game.inventory} />
        <SharedHUD mode={game.mode} citizens={game.citizens} resources={game.resources} players={game.players} />
      </div>
    </div>
  )
}