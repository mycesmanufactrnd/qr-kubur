import { spawn } from "child_process"
import express from "express"
import { WebSocketServer } from "ws"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const server = app.listen(5138)
const wss = new WebSocketServer({ server })

app.use(express.static(path.join(__dirname, "public")))

wss.on("connection", ws => {
    const docker = spawn("docker", [
        "compose",
        "-p",
        "qr-kubur",
        "--env-file",
        "/app/.env",                   // points to mounted .env
        "-f",
        "/app/docker-compose.yml",     // points to mounted compose
        "logs",
        "-f",
        "backend"
    ])

  docker.stdout.on("data", d => ws.send(d.toString()))
  docker.stderr.on("data", d => ws.send(d.toString()))
  ws.on("close", () => docker.kill())
})

console.log("🖥 Backend Logs → http://localhost:5138")
