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
const dbPath = path.join(__dirname, "arduino_config.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
  } else {
    console.log("Conectado ao banco de dados SQLite (Config)");
  }
});

// Criar tabela de configuração se não existir
db.run(
  `
  CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY,
    timespan INTEGER,
    actuator_pin INTEGER,
    run_again INTEGER,
    reset_counter INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`,
  (err) => {
    if (err) {
      console.error("Erro ao criar tabela:", err);
    } else {
      console.log("Tabela de configuração pronta");

      // Insere configuração inicial se não existir
      db.get("SELECT * FROM config WHERE id = 1", (err, row) => {
        if (!row) {
          db.run(
            "INSERT INTO config (id, timespan, actuator_pin, run_again, reset_counter) VALUES (1, ?, ?, ?, ?)",
            [
              config.timespan,
              config.actuator_pin,
              config.run_again,
              config.reset_counter,
            ],
            (err) => {
              if (!err) console.log("Configuração inicial salva no banco");
            }
          );
        } else {
          // Carrega config do banco
          config.timespan = row.timespan;
          config.actuator_pin = row.actuator_pin;
          config.run_again = row.run_again;
          config.reset_counter = row.reset_counter;
          console.log("Configuração carregada do banco:", config);
        }
      });
    }
  }
);

app.post("/setup", (req, res) => {
  const { timespan, actuator_pin, run_again, reset_counter } = req.body;

  // Atualiza apenas os campos que foram enviados
  if (timespan !== undefined) {
    config.timespan = timespan;
    config.reset_counter = 1; // Sinaliza reset
  }
  if (actuator_pin !== undefined) config.actuator_pin = actuator_pin;
  if (run_again !== undefined) config.run_again = run_again;
  if (reset_counter !== undefined) config.reset_counter = reset_counter;

  db.run(
    `UPDATE config SET timespan = ?, actuator_pin = ?, run_again = ?, reset_counter = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
    [
      config.timespan,
      config.actuator_pin,
      config.run_again,
      config.reset_counter,
    ],
    (err) => {
      if (err) {
        console.error("Erro ao atualizar config:", err);
        res.status(500).json({ error: err.message });
      } else {
        console.log("Configuração atualizada:", config);
        res.json(config);
      }
    }
  );
});

app.get("/setup", (req, res) => {
  // Busca config do banco
  db.get("SELECT * FROM config WHERE id = 1", (err, row) => {
    if (err) {
      console.error("Erro ao buscar config:", err);
      res.status(500).json({ error: err.message });
    } else if (row) {
      config.timespan = row.timespan;
      config.actuator_pin = row.actuator_pin;
      config.run_again = row.run_again;
      config.reset_counter = row.reset_counter;

      console.log("Setup solicitado pelo Arduino");

      // Após Arduino ler, reseta os flags
      if (config.reset_counter === 1 || config.run_again === 1) {
        db.run(
          "UPDATE config SET reset_counter = 0, run_again = 0 WHERE id = 1",
          (err) => {
            if (!err) {
            }
          }
        );
      }

      res.json(config);
    } else {
      res.status(404).json({ error: "Config não encontrada" });
    }
  });
});

app.listen(3000, () =>
  console.log("Controle Service rodando em http://localhost:3000")
);
