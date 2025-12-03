const httpProxy = require("express-http-proxy");
const express = require("express");
const app = express();
var logger = require("morgan");

app.use(logger("dev"));

function selectProxyHost(req) {
  if (req.path.startsWith("/config")) return "http://localhost:3000/";
  
  if (req.path.startsWith("/logs")) return "http://localhost:3001/";
  
  return null;
}

app.use((req, res, next) => {
  var proxyHost = selectProxyHost(req);
  
  if (proxyHost == null) {
    res.status(404).send("Not found");
  } else {
    httpProxy(proxyHost, {
      proxyReqPathResolver: function(req) {
        return req.url.replace(/^\/(config|logs)/, '');
      }
    })(req, res, next);
  }
});

app.listen(8000, () => {
  console.log("API Gateway rodando na porta 8000");
  console.log("Rotas disponíveis:");
  console.log("  - /config/* → Controle Service (porta 3000)");
  console.log("  - /logs/*   → Logging Service (porta 3001)");
});
