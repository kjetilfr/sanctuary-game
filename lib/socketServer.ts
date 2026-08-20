import type { Server as SocketIOServer } from 'socket.io'

declare global {
  // eslint-disable-next-line no-var
  var __sanctuaryIO: SocketIOServer | undefined
}

export function getIO(): SocketIOServer | undefined {
  return globalThis.__sanctuaryIO
}