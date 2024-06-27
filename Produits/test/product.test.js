require("dotenv").config();
const { MongoClient, ObjectId } = require('mongodb');
const express = require("express");
const cors = require("cors");
const supertest = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');

// Importation de l'application et des fonctions de votre API
const { getProducts, getProductById, addNewProduct, updateProductById, deleteProductById, app } = require('../index');

// Configuration des routes pour les tests
app.get("/products", getProducts);
app.get("/products/:id", getProductById);
app.post("/products", addNewProduct);
app.put("/products/:id", updateProductById);
app.delete("/products/:id", deleteProductById);

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
  await client.close();
});

describe('Products API', () => {
  let productId;

  it('GET /products should return list of products', async () => {
    const response = await supertest(app).get('/products');
    expect(response.status).to.equal(200);
    expect(response.body.productsList).to.be.an('array');
  });

  it('POST /products should create a new product', async () => {
    const newProduct = {
      name: "Test Product",
      prix: 100,
      categorie: "Test Category"
    };
    const response = await supertest(app).post('/products').send(newProduct);
    expect(response.status).to.equal(200);
    expect(response.body.msg).to.equal("New product Added");

    const products = await client.db("Produits").collection("Produits").find().toArray();
    expect(products.length).to.be.greaterThan(0);
    productId = products[0]._id;
  });

  it('GET /products/:id should return a product by ID', async () => {
    const response = await supertest(app).get(`/products/${productId}`);
    expect(response.status).to.equal(200);
    expect(response.body.product).to.be.an('object');
    expect(response.body.product._id).to.equal(productId.toString());
  });

  it('PUT /products/:id should update a product by ID', async () => {
    const updatedProduct = {
      prix: 150
    };
    const response = await supertest(app).put(`/products/${productId}`).send(updatedProduct);
    expect(response.status).to.equal(200);
    expect(response.body.msg).to.equal("Product updated");

    const product = await client.db("Produits").collection("Produits").findOne({ _id: new ObjectId(productId) });
    expect(product.prix).to.equal(updatedProduct.prix);
  });

  it('DELETE /products/:id should delete a product by ID', async () => {
    const response = await supertest(app).delete(`/products/${productId}`);
    expect(response.status).to.equal(200);
    expect(response.body.msg).to.equal("Product deleted");

    const product = await client.db("Produits").collection("Produits").findOne({ _id: new ObjectId(productId) });
    expect(product).to.be.null;
  });
});