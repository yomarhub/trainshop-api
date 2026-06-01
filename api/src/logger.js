// fs permet d'écrire dans un fichier local.
const fs = require("fs");

// path construit des chemins compatibles Windows, Linux et macOS.
const path = require("path");

// On prépare le dossier de logs.
// Dans Docker, ce dossier pourra être relié à un volume.
const logDir = path.join(__dirname, "..", "logs");

// Si le dossier n'existe pas encore, on le crée.
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Fichier dans lequel les logs applicatifs seront écrits.
const logFile = path.join(logDir, "api.log");

// Cette fonction retire les champs sensibles avant d'écrire le log.
function sanitize(meta) {
    const forbidden = ["password", "token", "secret", "authorization"];
    const clean = {};

    for (const [key, value] of Object.entries(meta)) {
        if (forbidden.includes(key.toLowerCase())) {
            clean[key] = "[hidden]";
        } else {
            clean[key] = value;
        }
    }

    return clean;
}

// Fonction centrale : tous les logs passent par ici.
function log(level, message, meta = {}) {
    const entry = {
        time: new Date().toISOString(),
        level,
        message,
        ...sanitize(meta)
    };

    // Une ligne JSON par événement : facile à lire et à analyser.
    fs.appendFileSync(logFile, JSON.stringify(entry) + "\n");

    // On affiche aussi dans la console pour docker compose logs.
    console.log(JSON.stringify(entry));
}

// On expose des fonctions simples pour le reste de l'application.
module.exports = {
    info: (message, meta) => log("info", message, meta),
    warn: (message, meta) => log("warn", message, meta),
    error: (message, meta) => log("error", message, meta)
};