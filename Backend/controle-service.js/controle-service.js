const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configuração inicial
let config = {
  timespan: 10,
  actuator_pin: 2,
  run_again: 0,
  reset_counter: 0,
};

// Configurar banco de dados SQLite
const dbPath = path.join(__dirname, "arduino_logs.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
  } else {
    console.log("Conectado ao banco de dados SQLite");
  }
});

// Criar tabela de logs se não existir
db.run(
  `
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    loop_counter INTEGER,
    timespan INTEGER,
    ldr_value INTEGER,
    actuator_pin INTEGER,
    brightness_status TEXT,
    ip_address TEXT
  )
`,
  (err) => {
    if (err) {
      console.error("Erro ao criar tabela:", err);
    } else {
      console.log("Tabela de logs pronta");
    }
  }
);

app.post("/setup", (req, res) => {
  const { timespan, actuator_pin, run_again, reset_counter } = req.body;

  // Atualiza apenas os campos que foram enviados
  if (timespan !== undefined) {
    config.timespan = timespan;
    // Quando atualiza timespan, sinaliza para resetar o contador
    config.reset_counter = 1;
  }
  if (actuator_pin !== undefined) config.actuator_pin = actuator_pin;
  if (run_again !== undefined) config.run_again = run_again;
  if (reset_counter !== undefined) config.reset_counter = reset_counter;

  console.log("Configuração atualizada:", config);
  res.json(config);
});

app.get("/setup", (req, res) => {
  console.log("Setup solicitado pelo Arduino");
  res.json(config); // Retorna apenas o config, sem wrapper
});

// Endpoint para receber logs do Arduino
app.post("/logs", (req, res) => {
  const {
    loop_counter,
    timespan,
    ldr_value,
    actuator_pin,
    brightness_status,
    ip_address,
  } = req.body;

  const query = `
    INSERT INTO logs (loop_counter, timespan, ldr_value, actuator_pin, brightness_status, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      loop_counter,
      timespan,
      ldr_value,
      actuator_pin,
      brightness_status,
      ip_address,
    ],
    function (err) {
      if (err) {
        console.error("Erro ao salvar log:", err);
        res.status(500).json({ success: false, error: err.message });
      } else {
        console.log(
          `Log salvo: Loop ${loop_counter}/${timespan}, LDR: ${ldr_value}, Status: ${brightness_status}`
        );
        res.json({ success: true, id: this.lastID });
      }
    }
  );
});

// Endpoint para consultar logs
app.get("/logs", (req, res) => {
  const limit = req.query.limit || 100;

  db.all(
    `SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) {
        console.error("Erro ao buscar logs:", err);
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, count: rows.length, logs: rows });
      }
    }
  );
});

app.listen(3000, () => console.log("API rodando em http://localhost:3000"));
