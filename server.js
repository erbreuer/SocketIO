import http from "http";
import path from "path";
import { readFile } from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const httpServer = http.createServer((req, res) => {
  if (req.url === "/") {
    const filePath = path.join(__dirname, "public", "index.html");
    readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end("Fehler beim Laden der Datei");
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  }
});

httpServer.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});
