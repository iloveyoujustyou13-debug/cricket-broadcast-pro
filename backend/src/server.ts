import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

interface CameraSession {
  id: string;
  ws: WebSocket;
  status: 'connected' | 'disconnected';
}

const cameras: Map<string, CameraSession> = new Map();
let activeFfmpegProcess: any = null;

// Real-time signaling gateway
wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (message: string) => {
    const data = JSON.parse(message);
    
    switch (data.type) {
      case 'register_camera':
        cameras.set(data.cameraId, { id: data.cameraId, ws, status: 'connected' });
        broadcastToAdmin({ type: 'camera_status', cameraId: data.cameraId, status: 'connected' });
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        // Route signaling messages between admin panel and target device camera
        const target = cameras.get(data.targetId);
        if (target && target.ws.readyState === WebSocket.OPEN) {
          target.ws.send(JSON.stringify(data));
        }
        break;
    }
  });

  ws.on('close', () => {
    cameras.forEach((cam, id) => {
      if (cam.ws === ws) {
        cameras.delete(id);
        broadcastToAdmin({ type: 'camera_status', cameraId: id, status: 'disconnected' });
      }
    });
  });
});

function broadcastToAdmin(message: object) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// RTMP Streaming Endpoint Trigger via FFmpeg
app.post('/api/stream/start', (req, res) => {
  const { streamUrl, streamKey } = req.body;

  if (activeFfmpegProcess) {
    return res.status(400).json({ error: "Streaming is already running." });
  }

  const destination = `${streamUrl}/${streamKey}`;
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "_");
  const recordPath = path.join(__dirname, `../../archive/IND_vs_AUS_${timestamp}.mp4`);

  // FFmpeg reads ingestion feed from MediaMTX, records local copies, and pushes out to RTMP targets
  activeFfmpegProcess = spawn('ffmpeg', [
    '-f', 'flv', '-i', 'rtmp://localhost:1935/live/program',
    '-c:v', 'copy', '-c:a', 'aac', '-f', 'mp4', recordPath,       // Local Record Multiplex
    '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', '4500k',    // RTMP Encoding Params
    '-maxrate', '4500k', '-bufsize', '9000k',
    '-pix_fmt', 'yuv420p', '-g', '60', '-c:a', 'aac', '-b:a', '128k',
    '-f', 'flv', destination                                      // Target Live Egress
  ]);

  activeFfmpegProcess.stderr.on('data', (data: Buffer) => {
    console.log(`[FFmpeg Log]: ${data.toString()}`);
  });

  return res.json({ status: 'Streaming and recording started successfully.' });
});

app.post('/api/stream/stop', (req, res) => {
  if (activeFfmpegProcess) {
    activeFfmpegProcess.kill('SIGINT');
    activeFfmpegProcess = null;
    return res.json({ status: 'Streaming and recording terminated gracefully.' });
  }
  return res.status(400).json({ error: 'No stream process found active.' });
});

server.listen(5000, () => console.log('Broadcast Core up on port 5000'));
