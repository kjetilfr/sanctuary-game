'use client'
import { advanceNight, advanceDay, startGame } from '@/app/actions'

export default function PhaseControls({ code, phase, status }: any) {
  if (status === 'waiting') {
    return (
      <div className="mt-6">
        <button 
          onClick={() => startGame(code)}
          className="w-full bg-green-600 hover:bg-green-500 py-3 rounded font-bold transition"
        >
          🚀 Start Game (Assign Roles)
        </button>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Host only. Roles will be randomly assigned.
        </p>
      </div>
    )
  }

  if (phase === 'Day') {
    return (
      <button 
        onClick={() => advanceNight(code)}
        className="w-full bg-red-600 hover:bg-red-500 py-3 rounded font-bold transition mt-4"
      >
        🌙 End Day & Survive the Night
      </button>
    )
  }

  if (phase === 'Night') {
    return (
      <button 
        onClick={() => advanceDay(code)}
        className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded font-bold transition mt-4"
      >
        ☀️ Dawn Breaks - Start New Day
      </button>
    )
  }

  return null
}