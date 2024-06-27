require("dotenv").config();
const { MongoClient, ObjectId } = require('mongodb');
const express = require("express");
const cors = require("cors");
const supertest = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');

// Importation de l'application et des fonctions de votre API
const { getCommandes, getCommandeById, addNewCommande, updateCommandeById, deleteCommandeById, app } = require('../index');

// Configuration des routes pour les tests
app.get("/commandes", getCommandes);
app.get("/commandes/:id", getCommandeById);
app.post("/commandes", addNewCommande);
app.put("/commandes/:id", updateCommandeById);
app.delete("/commandes/:id", deleteCommandeById);

const client = new MongoClient(process.env.URI, {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  },
});

before(async () => {
  await client.connect();
  await client.db("admin").command({ ping: 1 });
});

after(async () => {
  await client.db("Commandes").collection("Commandes").deleteMany({}); // Nettoie la collection après les tests
  await client.close();
});

describe('Commandes API', () => {
  let commandeId;

  it('GET /commandes should return list of commandes', async () => {
    const response = await supertest(app).get('/commandes');
    expect(response.status).to.equal(200);
    expect(response.body.commandesList).to.be.an('array');
  });

  it('POST /commandes should create a new commande', async () => {
    const newCommande = {
      client_id: "some-client-id",
      produits: ["product1", "product2"]
    };
    const response = await supertest(app).post('/commandes').send(newCommande);
    expect(response.status).to.equal(200);
    expect(response.body.msg).to.equal("New Commande Added");

    const commandes = await client.db("Commandes").collection("Commandes").find().toArray();
    expect(commandes.length).to.be.greaterThan(0);
    commandeId = commandes[0]._id;
  });

  it('GET /commandes/:id should return a commande by ID', async () => {
    const response = await supertest(app).get(`/commandes/${commandeId}`);
    expect(response.status).to.equal(200);
    expect(response.body.commande).to.be.an('object');
    expect(response.body.commande._id).to.equal(commandeId.toString());
  });

  it('PUT /commandes/:id should update a commande by ID', async () => {
    const updatedCommande = {
      produits: ["updatedProduct1", "updatedProduct2"]
    };
    const response = await supertest(app).put(`/commandes/${commandeId}`).send(updatedCommande);
    expect(response.status).to.equal(200);
    expect(response.body.msg).to.equal("Commande updated");

    const commande = await client.db("Commandes").collection("Commandes").findOne({ _id: new ObjectId(commandeId) });
    expect(commande.produits).to.deep.equal(updatedCommande.produits);
  });

  it('DELETE /commandes/:id should delete a commande by ID', async () => {
    const response = await supertest(app).delete(`/commandes/${commandeId}`);
    expect(response.status).to.equal(200);
    expect(response.body.msg).to.equal("Commande deleted");

    const commande = await client.db("Commandes").collection("Commandes").findOne({ _id: new ObjectId(commandeId) });
    expect(commande).to.be.null;
  });
});