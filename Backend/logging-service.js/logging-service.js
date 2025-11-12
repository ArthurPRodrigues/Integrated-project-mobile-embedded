const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/logs", (req, res) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    data: req.body,
  };

  logs.push(logEntry);
  console.log("Log recebido:", logEntry);

  res.json({ success: true, message: "Log armazenado com sucesso" });
});

app.get("/logs", (req, res) => {
  console.log("Logs solicitados");
  res.json({ logs });
});

app.listen(3001, () =>
  console.log("Logging Service rodando em http://localhost:3001")
);
