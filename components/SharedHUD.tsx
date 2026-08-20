import { Citizen, Player, Resource, GameMode } from '@/lib/types'

const RESOURCE_ICONS: Record<string, string> = {
  food: '🍖', water: '💧', medkit: '💊', ammo: '🔫', scrap: '🔩',
}

export default function SharedHUD({
  mode, citizens, resources, players,
}: {
  mode: GameMode
  citizens?: Citizen[]
  resources?: Resource
  players?: Player[]
}) {
  if (mode === 'coop') {
    const healthyCitizens = citizens?.filter((c) => c.health > 0).length ?? 0
    return (
      <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto">
        <div className="text-xs text-gray-400 shrink-0">🏘️ {healthyCitizens}/{citizens?.length ?? 0} citizens alive</div>
        <div className="h-8 w-px bg-gray-700 shrink-0" />
        <div className="flex gap-2 overflow-x-auto">
          {resources && Object.entries(RESOURCE_ICONS).map(([key, icon]) => (
            <div key={key} className="flex items-center gap-1 bg-gray-700 rounded-lg px-2 py-1 shrink-0">
              <span>{icon}</span>
              <span className="text-xs">{(resources as any)[key] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const aliveCount = players?.filter((p) => p.isAlive).length ?? 0
  return (
    <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto">
      <div className="text-xs text-gray-400 shrink-0">⚔️ {aliveCount} survivor{aliveCount === 1 ? '' : 's'} remaining</div>
      <div className="h-8 w-px bg-gray-700 shrink-0" />
      <div className="flex gap-2 overflow-x-auto">
        {players?.map((p) => (
          <div key={p.id} className={`flex items-center gap-1 rounded-lg px-2 py-1 shrink-0 ${p.isAlive ? 'bg-gray-700' : 'bg-gray-800 opacity-50'}`}>
            <span>{p.isAlive ? '🧍' : '💀'}</span>
            <span className="text-xs">{p.name}</span>
            <span className="text-[10px] text-gray-400">{p.health}HP</span>
          </div>
        ))}
      </div>
    </div>
  )
}