import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // Mock database for session monitoring
  const sessions = new Map();

  wss.on("connection", (ws) => {
    console.log("Client connected to security monitor");
    
    ws.on("message", (message) => {
      const data = JSON.parse(message.toString());
      
      if (data.type === "BEHAVIOR_REPORT") {
        // Analyze behavior for anomalies
        const { typingSpeed, mouseJitter, sessionToken } = data.payload;
        
        let riskScore = 0;
        if (typingSpeed > 500) riskScore += 30; // Unusually fast (bot-like)
        if (mouseJitter > 0.8) riskScore += 40; // Erratic movement
        
        ws.send(JSON.stringify({
          type: "RISK_UPDATE",
          payload: { riskScore, reason: riskScore > 50 ? "Anomalous interaction detected" : "Normal" }
        }));
      }

      if (data.type === "SESSION_INIT") {
        sessions.set(data.payload.token, {
          startTime: Date.now(),
          ip: "192.168.1.1", // Mock IP
          userAgent: "Mozilla/5.0..."
        });
      }
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
