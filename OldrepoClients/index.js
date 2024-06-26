require("dotenv").config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express")
const cors = require("cors")

const { Kafka } = require('kafkajs');


const app = express()
app.use(cors())

app.use(express.json())


//Controlleurs

//Récupère une liste de client. 
const getCustomers = async (req, res) =>{
    

    try{
        const customers = await client.db("Clients").collection("customers").find()

        const customersList = await customers.toArray()
    
        res.json({customersList})

    }catch(erreur){
        console.log(erreur)
        res.json({erreur})
    } 

}


//Récupère un client par son ID
const getCustomerById = async (req, res) =>{

    try{
    const id = req.params.id

    const customer = await client.db("Clients").collection("customers").findOne({_id:new ObjectId(id)})
   
    res.json({customer})
    
    }catch(erreur){
        console.log(erreur)
        res.json({erreur})
    } 
}


//Créé un nouveau client
const addNewCustomer  = async (req, res) =>{
    
    const name = req.body.name
    const email = req.body.email
    const phone_number = req.body.phone_number
    const adresse = req.body.adresse

    try{
        await client.db("Clients").collection("customers").insertOne({name, email, phone_number, adresse})
        res.json({msg:"New Customer Added"})

    }catch(erreur){
        console.log(erreur)
        res.json({erreur})
    } 
}


//Met à jour une fiche client
const updateCustomerById = async (req, res) =>{
    const id = req.params.id

    const email = req.body.email
    const phone_number = req.body.phone_number
    const adresse = req.body.adresse

    try{

    await client.db("Clients").collection("customers").updateOne({_id:new ObjectId(id)}, {$set:{email, phone_number, adresse}})
   
    res.json({msg:"Customer updated"})

    }catch(erreur){
        console.log(erreur)
        res.json({erreur})
    } 
}


//Supprimer Client by Id
const deleteCustomerById = async (req, res) =>{
    const id = req.params.id

    try{
    await client.db("Clients").collection("customers").deleteOne({_id:new ObjectId(id)})

    const producer = kafka.producer()

    await producer.connect()
    await producer.send({
      topic: 'deletedClients',  // deja creer en kafka en CMD
      messages: [
        { value: id},
      ],
    })
    
    await producer.disconnect()
    
    res.json({msg:"Customer deleted"})

    }catch(erreur){
        console.log(erreur)
        res.json({erreur})
} 
}



//Routs
app.get("/customers", getCustomers)

app.get("/customers/:id", getCustomerById)


app.post("/customers", addNewCustomer)

app.put("/customers/:id", updateCustomerById)

app.delete("/customers/:id", deleteCustomerById)


//-------------------------------------------------------------------------------------------------------

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    app.listen(process.env.SERVERPORT, console.log("Clients API Running on Port : "+ process.env.SERVERPORT ))

  } catch(erreur){

    console.log(erreur)

  }
}

run().catch(console.dir);


const kafka = new Kafka({
    clientId: 'MSPR2',
    brokers: ['localhost:9092']
  });




