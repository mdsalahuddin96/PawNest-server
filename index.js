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
    const requestCollection = db.collection("requests");
    app.get("/featuredPets", async (req, res) => {
      const result = await petsCollection.find().limit(6).toArray();
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
    app.get("/petsBy-userId/:id", async (req, res) => {
      const { id } = req.params;
      const result = await petsCollection.find({ owner_id: id }).toArray();
      res.send(result);
    });
    app.post("/adoptRequest", async (req, res) => {
      const data = req.body;

      // duplicate request check
      const alreadyRequested = await requestCollection.findOne({
        pet_id: data.pet_id,
        requester_email: data.requester_email,
      });

      if (alreadyRequested) {
        return res.send({
          success: false,
          message: "You already requested for this pet",
        });
      }
      const result = await requestCollection.insertOne(data);
      res.send({
        success: true,
        insertedId: result.insertedId,
      });
    });
    app.get("/request", async (req, res) => {
      const result = await requestCollection.find().toArray();
      res.json(result);
    });
    app.get("/request/:email", async (req, res) => {
      const { email } = req.params;
      const result = await requestCollection
        .find({
          requester_email: email,
        })
        .toArray();
      res.json(result);
    });
    app.patch("/request/status/:id", async (req, res) => {
      const { id } = req.params;
      const body = req.body;
      const result = await requestCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            requested_status: body.requested_status,
          },
        },
      );
      res.send(result);
    });
    app.patch("/upDatePet/status/:id", async (req, res) => {
      const { id } = req.params;
      const body = req.body;
      const result = await petsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: body.status,
          },
        },
      );
      res.send(result);
    });
    app.post("/add-pet", async (req, res) => {
      const data = req.body;
      const result = await petsCollection.insertOne(data);
      res.json(result);
    });
    app.patch("/update-pet/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      console.log(data);
      const result = await petsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: data,
        },
      );
      res.send(result);
    });
    app.delete("/deletePet/:id", async (req, res) => {
      const { id } = req.params;
      const result = await petsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });
    app.delete("/deleteReq/:id", async (req, res) => {
      const { id } = req.params;
      const result = await requestCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });
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
