require("dotenv").config();
const { MongoClient, ObjectId } = require('mongodb');
const express = require("express");
const cors = require("cors");
const supertest = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');

// Création de l'application Express pour les tests
const app = express();
app.use(cors());
app.use(express.json());

// Importation des fonctions de votre API
const { getCustomers, getCustomerById, addNewCustomer, updateCustomerById, deleteCustomerById } = require('../index');

// Configuration des routes pour les tests
app.get("/customers", getCustomers);
app.get("/customers/:id", getCustomerById);
app.post("/customers", addNewCustomer);
app.put("/customers/:id", updateCustomerById);
app.delete("/customers/:id", deleteCustomerById);

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

describe('Customers API', () => {
  let customerId;

  it('GET /customers should return list of customers', async () => {
    const response = await supertest(app).get('/customers');
    expect(response.status).to.equal(200);
    expect(response.body.customersList).to.be.an('array');
  });

  it('POST /customers should create a new customer', async () => {
    const newCustomer = {
      name: "Test Customer",
      email: "test@example.com",
      phone_number: "1234567890",
      adresse: "123 Test St"
    };
    const response = await supertest(app).post('/customers').send(newCustomer);
    expect(response.status).to.equal(200);
    expect(response.body.msg).to.equal("New Customer Added");

    const customers = await client.db("Clients").collection("customers").find().toArray();
    expect(customers.length).to.be.greaterThan(0);
    customerId = customers[0]._id;
  });

  it('GET /customers/:id should return a customer by ID', async () => {
    const response = await supertest(app).get(`/customers/${customerId}`);
    expect(response.status).to.equal(200);
    expect(response.body.customer).to.be.an('object');
    expect(response.body.customer._id).to.equal(customerId.toString());
  });

  it('PUT /customers/:id should update a customer by ID', async () => {
    const updatedCustomer = {
      email: "updated@example.com",
      phone_number: "0987654321",
      adresse: "456 Updated St"
    };
    const response = await supertest(app).put(`/customers/${customerId}`).send(updatedCustomer);
    expect(response.status).to.equal(200);
    expect(response.body.msg).to.equal("Customer updated");

    const customer = await client.db("Clients").collection("customers").findOne({ _id: new ObjectId(customerId) });
    expect(customer.email).to.equal(updatedCustomer.email);
  });

  it('DELETE /customers/:id should delete a customer by ID', async () => {
    const response = await supertest(app).delete(`/customers/${customerId}`);
    expect(response.status).to.equal(200);
    expect(response.body.msg).to.equal("Customer deleted");

    const customer = await client.db("Clients").collection("customers").findOne({ _id: new ObjectId(customerId) });
    expect(customer).to.be.null;
  });
});