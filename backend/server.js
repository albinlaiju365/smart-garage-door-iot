const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

// --- CONFIGURATION ---
// Switched to direct IP address as mDNS was not resolving on the local network
const ESP32_BASE_URL = 'http://192.168.1.8';

app.use(cors());
app.use(express.json());

let doorStatus = 'closed';
let deviceConnected = false;

// Helper to check ESP32 connection and sync status
const syncStatus = async () => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const response = await fetch(`${ESP32_BASE_URL}/status`, { signal: controller.signal });
    clearTimeout(id);

    if (response.ok) {
      const data = await response.json();
      doorStatus = data.status;
      deviceConnected = true;
    }
  } catch (error) {
    deviceConnected = false;
    console.log('ESP32 not reachable at', ESP32_BASE_URL);
  }
};

// Poll hardware status every 5 seconds to keep backend in sync
setInterval(syncStatus, 5000);

app.post('/open', async (req, res) => {
  try {
    const response = await fetch(`${ESP32_BASE_URL}/open`);
    if (response.ok) {
      doorStatus = 'opening';
      // Optimistic update for UI feel, hardware will confirm in next poll
      setTimeout(() => { doorStatus = 'open'; }, 2000);
      res.json({ success: true, message: 'OPEN command sent wirelessly', status: doorStatus });
    } else {
      throw new Error('Hardware returned error');
    }
  } catch (error) {
    res.status(503).json({ success: false, message: 'Could not reach ESP32' });
  }
});

app.post('/close', async (req, res) => {
  try {
    const response = await fetch(`${ESP32_BASE_URL}/close`);
    if (response.ok) {
      doorStatus = 'closing';
      setTimeout(() => { doorStatus = 'closed'; }, 2000);
      res.json({ success: true, message: 'CLOSE command sent wirelessly', status: doorStatus });
    } else {
      throw new Error('Hardware returned error');
    }
  } catch (error) {
    res.status(503).json({ success: false, message: 'Could not reach ESP32' });
  }
});

app.post('/stop', async (req, res) => {
  // ESP32 usually handles 'stop' as a no-op or specific brake if using motor drivers
  res.json({ success: true, message: 'STOP command simulation', status: 'stopped' });
});

app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; padding: 40px; text-align: center; background: #000; color: #fff; height: 100vh;">
      <h1 style="font-weight: 300;">Garage Backend <span style="color: #4ade80;">Bridge</span></h1>
      <p style="color: #71717a;">Status: ${deviceConnected ? '<span style="color: #4ade80;">CONNECTED</span>' : '<span style="color: #f87171;">OFFLINE</span>'}</p>
      <p style="color: #71717a;">Target: <code style="background: #27272a; padding: 4px 8px; border-radius: 4px;">${ESP32_BASE_URL}</code></p>
      <p style="color: #71717a;">Door: <span style="text-transform: uppercase;">${doorStatus}</span></p>
      <hr style="border: 0; border-top: 1px solid #27272a; margin: 40px 0;">
      <p style="font-size: 12px; color: #3f3f46;">The dashboard is running on <a href="http://localhost:3000" style="color: #3b82f6;">port 3000</a></p>
    </div>
  `);
});

app.get('/status', async (req, res) => {
  // We return the last known status cached in the backend
  res.json({
    connected: deviceConnected,
    status: doorStatus
  });
});

app.listen(port, () => {
  console.log(`Backend Bridge listening on http://localhost:${port}`);
  console.log(`Targeting Wireless ESP32 at: ${ESP32_BASE_URL}`);
});
