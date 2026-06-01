// crypto permet de générer un identifiant unique pour chaque requête.
const crypto = require("crypto");

// On importe le logger applicatif.
const logger = require("../logger");

// Middleware Express exécuté à chaque requête.
function requestLogger(req, res, next) {
    // On crée un identifiant court pour suivre cette requête.
    const requestId = crypto.randomUUID();

    // On l'ajoute à req pour pouvoir le réutiliser dans les routes.
    req.requestId = requestId;

    // Date de départ pour mesurer la durée totale.
    const start = Date.now();

    // Log d'entrée : la requête vient d'arriver.
    logger.info("request_started", {
        request_id: requestId,
        method: req.method,
        path: req.originalUrl
    });

    // Quand la réponse est terminée, on écrit le log de sortie.
    res.on("finish", () => {
        const duration = Date.now() - start;

        logger.info("request_finished", {
            request_id: requestId,
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            duration_ms: duration
        });
    });

    // On laisse Express continuer vers la route demandée.
    next();
}

// Export du middleware pour l'utiliser dans app.js.
module.exports = requestLogger;