import io from 'socket.io-client'

export const getSocket = () => {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return io(url, { path: '/api/socket' })
}