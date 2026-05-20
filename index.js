const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT;
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("pawnestDB");
    const petsCollection = db.collection("pets");
    app.get("/featuredPets", async (req, res) => {
      const result = await petsCollection.find().limit(5).toArray();
      res.json(result);
    });
    app.get("/all-pets", async (req, res) => {
      const search = req.query.search;
      const species = req.query.species;
      const fee = req.query.fee;
      let query = {};
      if (search) {
        query.name = {
          $regex: search,
          $options: "i",
        };
      }
      if (species) {
        query.species = {
          $regex: species,
          $options: "i",
        };
      }
      if (fee === "under-50") {
        query.adoptionFee = { $lt: 50 };
      }

      if (fee === "50-100") {
        query.adoptionFee = {
          $gte: 50,
          $lte: 100,
        };
      }

      if (fee === "above-100") {
        query.adoptionFee = { $gt: 100 };
      }
      const result = await petsCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/petDetails/:id", async (req, res) => {
      const { id } = req.params;
      const result = await petsCollection.findOne({ _id: new ObjectId(id) });
      res.json(result);
    });
    app.get("/petsBy-userId/:id",async(req,res)=>{
      const {id}=req.params;
      const result=await petsCollection.find({owner_id:id}).toArray();
      res.send(result);
    })
    app.post('/add-pet',async(req,res)=>{
      const data=req.body;
      const result=await petsCollection.insertOne(data)
      res.json(result)
    })
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
