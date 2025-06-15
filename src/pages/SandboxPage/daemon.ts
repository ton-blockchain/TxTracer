import {WebSocketServer, WebSocket} from "ws"

const wss = new WebSocketServer({port: 8080})
const clients = new Set<WebSocket>()

wss.on("connection", ws => {
  clients.add(ws)

  ws.on("message", data => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const message = data.toString()

    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  })

  ws.on("close", () => {
    clients.delete(ws)
  })
})

console.log("WebSocket running on port 8080")
