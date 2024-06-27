require("dotenv").config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express")
const cors = require("cors")
const { Kafka } = require('kafkajs');

const app = express()
app.use(cors())
app.use(express.json())

// Controlleurs

// Récupère une liste des produits. 
const getProducts = async (req, res) => {
    try {
        const products = await client.db("Produits").collection("Produits").find()
        const productsList = await products.toArray()
        res.json({productsList})
    } catch(erreur) {
        console.log(erreur)
        res.json({erreur})
    }
}

// Récupère un produit par son ID
const getProductById = async (req, res) => {
    try {
        const id = req.params.id
        const product = await client.db("Produits").collection("Produits").findOne({_id: new ObjectId(id)})
        res.json({product})
    } catch(erreur) {
        console.log(erreur)
        res.json({erreur})
    }
}

// Créé un nouveau produit
const addNewProduct = async (req, res) => {
    const { name, prix, categorie } = req.body
    try {
        await client.db("Produits").collection("Produits").insertOne({name, prix, categorie})
        res.json({msg: "New product Added"})
    } catch(erreur) {
        console.log(erreur)
        res.json({erreur})
    }
}

// Met à jour une fiche produit
const updateProductById = async (req, res) => {
    const id = req.params.id
    const { prix } = req.body
    try {
        await client.db("Produits").collection("Produits").updateOne({_id: new ObjectId(id)}, {$set: {prix}})
        res.json({msg: "Product updated"})
    } catch(erreur) {
        console.log(erreur)
        res.json({erreur})
    }
}

// Supprimer Produit by Id
const deleteProductById = async (req, res) => {
    const id = req.params.id
    try {
        await client.db("Produits").collection("Produits").deleteOne({_id: new ObjectId(id)})
        const producer = kafka.producer()
        await producer.connect()
        await producer.send({
            topic: 'deletedProducts',
            messages: [{ value: id }],
        })
        await producer.disconnect()
        res.json({msg: "Product deleted"})
    } catch(erreur) {
        console.log(erreur)
        res.json({erreur})
    }
}

// Routes
app.get("/products", getProducts)
app.get("/products/:id", getProductById)
app.post("/products", addNewProduct)
app.put("/products/:id", updateProductById)
app.delete("/products/:id", deleteProductById)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
        app.listen(process.env.SERVERPORT, () => console.log("Product API Running on Port : " + process.env.SERVERPORT));
    } catch(erreur) {
        console.log(erreur)
    }
}

run().catch(console.dir);

const kafka = new Kafka({
    clientId: 'MSPR2',
    brokers: ['localhost:9092']
});

module.exports = {
    getProducts,
    getProductById,
    addNewProduct,
    updateProductById,
    deleteProductById,
    app
};