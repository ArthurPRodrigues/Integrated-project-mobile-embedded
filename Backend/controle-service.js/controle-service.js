const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let config = {
  timespan: 10,
  actuator_pin: 2,
  run_again: 0,
};

app.get("/config", (req, res) => {
  console.log("ESP32 pediu configuração");
  res.json(config);
});

app.post("/setup", (req, res) => {
  const { timespan, loop_counter, run_again } = req.body;

    
  console.log("Configuração atualizada:", config);
  res.json({ success: true, config });
});

app.post("/logs", (req, res) => {
  console.log("Leitura recebida do ESP32:", req.body);
  res.json({ success: true });
});

app.listen(3000, () => console.log("API rodando em http://localhost:3000"));
