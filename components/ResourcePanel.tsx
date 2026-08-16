'use client'
import { depositResource } from '@/app/actions'
import { Resource } from '@/lib/types'

interface ResourcePanelProps {
  resources: Resource;
  code: string;
  phase: string;
}

export default function ResourcePanel({ resources, code, phase }: ResourcePanelProps) {
  const resourceTypes = [
    { key: 'food' as const, label: '🍖 Food', color: 'green' },
    { key: 'water' as const, label: '💧 Water', color: 'blue' },
    { key: 'medkit' as const, label: '💊 Med-Kit', color: 'red' },
    { key: 'ammo' as const, label: '🔫 Ammo', color: 'yellow' },
    { key: 'scrap' as const, label: '🔩 Scrap', color: 'gray' },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">🏛️ Base Stockpile</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {resourceTypes.map(({ key, label, color }) => (
          <div 
            key={key} 
            className={`bg-gray-700 p-3 rounded-lg border border-gray-600 flex justify-between items-center`}
          >
            <div>
              <div className="text-sm">{label}</div>
              <div className="text-2xl font-bold">{resources?.[key] || 0}</div>
            </div>
            {phase === 'Day' && (
              <button 
                onClick={() => depositResource(code, key)}
                className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-xs transition"
              >
                +1
              </button>
            )}
          </div>
        ))}
      </div>
      {phase !== 'Day' && (
        <div className="mt-2 text-sm text-gray-400 text-center">
          ⚠️ Cannot deposit resources at night
        </div>
      )}
    </div>
  )
}