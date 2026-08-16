'use client'
import { useMedkit } from '@/app/actions'
import { Citizen, Resource } from '@/lib/types'

interface CitizenRosterProps {
  citizens: Citizen[];
  code: string;
  resources: Resource;
}

export default function CitizenRoster({ citizens, code, resources }: CitizenRosterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {citizens.map((c) => (
        <div 
          key={c.id} 
          className={`p-3 rounded-lg border ${
            c.health > 50 ? 'border-green-600' : 
            c.health > 20 ? 'border-orange-600' : 
            'border-red-600'
          } bg-gray-700`}
        >
          <div className="flex justify-between">
            <span className="font-bold">Citizen #{c.citizenNumber}</span>
            <span className="text-sm">{c.health}%</span>
          </div>
          
          <div className="w-full h-2 bg-gray-600 rounded-full mt-1 overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                c.health < 30 ? 'bg-red-500' : 
                c.health < 70 ? 'bg-orange-500' : 
                'bg-green-500'
              }`} 
              style={{ width: `${c.health}%` }} 
            />
          </div>
          
          <div className="flex gap-4 mt-2 text-sm">
            <span>🍖 {c.hasFood === 1 ? '✅' : '❌'}</span>
            <span>💧 {c.hasWater === 1 ? '✅' : '❌'}</span>
            {c.health < 100 && resources?.medkit > 0 && (
              <button 
                onClick={() => useMedkit(code, c.id)}
                className="ml-auto text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded transition"
              >
                💊 Heal +30
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}