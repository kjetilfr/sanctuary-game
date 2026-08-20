const { createServer } = require('node:http')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(handler)

  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-game', (gameCode) => {
      socket.join(gameCode)
      console.log(`Socket ${socket.id} joined game ${gameCode}`)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  // Expose the real io server so Server Actions (same Node process) can emit directly.
  globalThis.__sanctuaryIO = io

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})