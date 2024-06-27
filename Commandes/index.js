require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express");
const cors = require("cors");
const { Kafka } = require('kafkajs');

const app = express();
app.use(cors());
app.use(express.json());

const kafka = new Kafka({
  clientId: 'MSPR2',
  brokers: ['localhost:9092']
});

// Controlleurs

// Récupère une liste des commandes.
const getCommandes = async (req, res) => {
  try {
    const commandes = await client.db("Commandes").collection("Commandes").find();
    const commandesList = await commandes.toArray();
    res.json({ commandesList });
  } catch (erreur) {
    console.log(erreur);
    res.json({ erreur });
  }
};

// Récupère une commande par son ID
const getCommandeById = async (req, res) => {
  try {
    const id = req.params.id;
    const commande = await client.db("Commandes").collection("Commandes").findOne({ _id: new ObjectId(id) });
    res.json({ commande });
  } catch (erreur) {
    console.log(erreur);
    res.json({ erreur });
  }
};

// Créé un nouvelle commande
const addNewCommande = async (req, res) => {
  const { client_id, produits } = req.body;
  const date_commande = new Date(); // Génère la date actuelle

  try {
    await client.db("Commandes").collection("Commandes").insertOne({ client_id, produits, date_commande });
    res.json({ msg: "New Commande Added" });
  } catch (erreur) {
    console.log(erreur);
    res.json({ erreur });
  }
};

// Met à jour une fiche de commande
const updateCommandeById = async (req, res) => {
  const id = req.params.id; // commande id
  const { produits } = req.body;
  const date_commande = new Date(); // Génère la date actuelle

  try {
    await client.db("Commandes").collection("Commandes").updateOne({ _id: new ObjectId(id) }, { $set: { produits, date_commande } });
    res.json({ msg: "Commande updated" });
  } catch (erreur) {
    console.log(erreur);
    res.json({ erreur });
  }
};

// Supprimer commande by Id
const deleteCommandeById = async (req, res) => {
  const id = req.params.id;

  try {
    await client.db("Commandes").collection("Commandes").deleteOne({ _id: new ObjectId(id) });
    res.json({ msg: "Commande deleted" });
  } catch (erreur) {
    console.log(erreur);
    res.json({ erreur });
  }
};

// Routes
app.get("/commandes", getCommandes);
app.get("/commandes/:id", getCommandeById);
app.post("/commandes", addNewCommande);
app.put("/commandes/:id", updateCommandeById);
app.delete("/commandes/:id", deleteCommandeById);

// Configuration MongoDB et Kafka

const client = new MongoClient(process.env.URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    app.listen(process.env.SERVERPORT, () => console.log("Commande API Running on Port : " + process.env.SERVERPORT));

    const consumer = kafka.consumer({ groupId: 'commande' });

    await consumer.connect();

    await consumer.subscribe({ topic: 'deletedClients', fromBeginning: false }); // deletedClients
    await consumer.subscribe({ topic: 'deletedProducts', fromBeginning: false }); // deletedProducts

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (topic === "deletedClients") {
          try {
            const deleteCommande = await client.db("Commandes").collection("Commandes").deleteMany({ client_id: message.value.toString() });
            console.log(deleteCommande);
          } catch (erreur) {
            console.log(erreur);
          }
        }
      },
    });

  } catch (erreur) {
    console.log(erreur);
  }
}

run().catch(console.dir);

module.exports = { getCommandes, getCommandeById, addNewCommande, updateCommandeById, deleteCommandeById, app };