// Supertest permet de simuler des requêtes HTTP sans ouvrir un vrai navigateur.
const request = require("supertest");

// On importe l'application Express à tester.
// Important : on importe app, pas forcément le serveur déjà lancé avec listen().
const app = require("../src/app");

// describe regroupe plusieurs tests autour d'un même sujet.
describe("Endpoints critiques TrainShop", () => {
    // test décrit un comportement attendu.
    test("GET /health retourne ok", async () => {
        // On envoie une requête GET sur /health.
        const response = await request(app).get("/health");

        // On vérifie que le statut HTTP est 200.
        expect(response.status).toBe(200);

        // On vérifie que la réponse contient status: ok.
        expect(response.body.status).toBe("ok");
    });

    test("GET /products retourne une liste", async () => {
        // On appelle la route catalogue.
        const response = await request(app).get("/products");

        // 200 signifie que la requête a réussi.
        expect(response.status).toBe(200);

        // Le catalogue doit être un tableau JSON.
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("POST /orders crée une commande", async () => {
        // On envoie une commande valide dans le corps de la requête.
        const response = await request(app)
            .post("/orders")
            .send({ product_id: 1, quantity: 2 });

        // 201 signifie qu'une ressource a été créée.
        expect(response.status).toBe(201);

        // On vérifie un champ métier de confirmation.
        expect(response.body.status).toBe("created");
    });
});

// On regroupe les tests qui vérifient les erreurs de POST /orders.
describe("Tests d'erreur POST /orders", () => {
    // Cas 1 : l'utilisateur oublie le product_id.
    test("refuse une commande sans product_id", async () => {
        // On envoie seulement quantity, donc la requête est incomplète.
        const response = await request(app)
            .post("/orders")
            .send({ quantity: 2 });

        // 400 = le client a envoyé une mauvaise requête.
        expect(response.status).toBe(400);

        // Le message d'erreur doit être clair pour comprendre le problème.
        expect(response.body.error).toBe("product_id is required");
    });

    // Cas 2 : l'utilisateur envoie une quantité impossible.
    test("refuse une quantité invalide", async () => {
        // quantity vaut 0 : une commande ne peut pas avoir zéro article.
        const response = await request(app)
            .post("/orders")
            .send({ product_id: 1, quantity: 0 });

        // On reste sur 400 car la donnée envoyée est invalide.
        expect(response.status).toBe(400);

        // Le message explique précisément la règle métier.
        expect(response.body.error).toBe("quantity must be greater than 0");
    });

    // Cas 3 : le client demande un produit qui n'existe pas.
    test("retourne 404 si le produit n'existe pas", async () => {
        const response = await request(app)
            .post("/orders")
            .send({ product_id: 999999, quantity: 1 });

        // 404 = ressource introuvable.
        expect(response.status).toBe(404);
        expect(response.body.error).toBe("product not found");
    });
});