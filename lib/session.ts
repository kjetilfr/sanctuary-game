const PREFIX = 'sanctuary_player_'

export function savePlayerId(code: string, playerId: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PREFIX + code, playerId)
}

export function getPlayerId(code: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(PREFIX + code)
}