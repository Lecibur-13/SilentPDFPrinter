const express = require("express");
const http = require('https');
const { exec } = require("child_process");
const fs = require("fs");
const url = require("url");
const app = express();
const port = 8080;

app.get("/print", function (req, res) {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;
  
  if (pathname === "/print" && query.pdf && query.printer) {
    const pdfUrl = query.pdf;
    const printerName = query.printer;
    const tempPdfPath = "./temp.pdf";

    // Descargar el archivo PDF temporalmente
    downloadPdf(pdfUrl, tempPdfPath, () => {
      // Ejecutar el comando para imprimir el PDF
      const command = `start PDFtoPrinter.exe "${tempPdfPath}" "${printerName}"`;
      exec(command, (error) => {
        if (error) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Error al imprimir el PDF");
        } else {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end(`PDF impreso en la impresora: ${printerName}`);
        }
      });
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Ruta no encontrada");
  }
});

function downloadPdf(url, destinationPath, callback) {
  http.get(url, (response) => {
    if (response.statusCode !== 200) {
      return callback(new Error("Error al descargar el PDF"));
    }

    const fileStream = fs.createWriteStream(destinationPath);
    response.pipe(fileStream);

    fileStream.on("finish", () => {
      fileStream.close(callback);
    });

    fileStream.on("error", (error) => {
      fs.unlink(destinationPath, () => callback(error));
    });
  });
}

app.listen(port);
