'use client'
import { depositInventoryItem, useInventoryItem } from '@/app/actions'
import { InventoryItem, Player, GameMode } from '@/lib/types'

export default function PlayerHUD({
  code, mode, player, inventory,
}: {
  code: string
  mode: GameMode
  player?: Player
  inventory: InventoryItem[]
}) {
  const grouped = inventory.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    acc[item.itemType] = acc[item.itemType] || []
    acc[item.itemType].push(item)
    return acc
  }, {})

  return (
    <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto">
      <div className="flex flex-col shrink-0 min-w-[90px]">
        <span className="text-xs text-gray-400">👤 {player?.name ?? 'You'}</span>
        {mode === 'versus' && player && (
          <>
            <div className="w-28 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full ${player.health > 50 ? 'bg-green-500' : player.health > 20 ? 'bg-orange-500' : 'bg-red-500'}`}
                style={{ width: `${player.health}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5">
              {player.isAlive ? `${player.health} HP` : '💀 Eliminated'}
            </span>
          </>
        )}
        {player?.role && <span className="text-xs text-yellow-400 mt-1">{player.role}</span>}
      </div>

      <div className="h-8 w-px bg-gray-700 shrink-0" />

      <div className="flex gap-2 overflow-x-auto">
        {inventory.length === 0 && (
          <span className="text-xs text-gray-500 whitespace-nowrap">No items yet — go explore</span>
        )}
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="flex items-center gap-1 bg-gray-700 rounded-lg px-2 py-1 shrink-0">
            <span>{items[0].icon}</span>
            <span className="text-xs">×{items.length}</span>
            {player && (mode === 'coop' ? (
              <button
                onClick={() => depositInventoryItem(code, player.id, items[0].id)}
                title="Deposit to shared stockpile"
                className="ml-1 text-xs text-blue-400 hover:text-blue-300"
              >
                ⬆
              </button>
            ) : (
              <button
                onClick={() => useInventoryItem(code, player.id, items[0].id)}
                title="Use item"
                className="ml-1 text-xs text-green-400 hover:text-green-300"
              >
                ✓
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}