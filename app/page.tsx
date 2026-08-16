'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createGame, joinGame } from './actions'

export default function Home() {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const result = await createGame(name)
      router.push(`/game/${result.gameCode}`)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function handleJoin() {
    setLoading(true)
    setError('')
    try {
      await joinGame(code.toUpperCase(), name)
      router.push(`/game/${code.toUpperCase()}`)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-96 border border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">🏚️ Sanctuary</h1>
        <p className="text-sm text-gray-400 text-center mb-6">Survive the apocalypse. Protect your citizens.</p>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 p-3 rounded mb-4 text-sm text-red-200">
            {error}
          </div>
        )}
        
        <input 
          className="w-full p-2 mb-4 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
          placeholder="Your Survivor Name" 
          value={name} 
          onChange={e => setName(e.target.value)} 
        />
        
        <button 
          onClick={handleCreate} 
          disabled={!name || loading}
          className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 p-3 rounded font-bold mb-4 transition"
        >
          {loading ? 'Creating...' : '🔥 Host New Game'}
        </button>
        
        <div className="flex gap-2">
          <input 
            className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-400"
            placeholder="Game Code (e.g. A4B2C1)" 
            value={code} 
            onChange={e => setCode(e.target.value.toUpperCase())} 
          />
          <button 
            onClick={handleJoin} 
            disabled={!name || !code || loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 p-3 rounded font-bold transition"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  )
}