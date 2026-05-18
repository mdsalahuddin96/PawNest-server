const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");
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
    const db=client.db('pawnestDB');
    const petsCollection=db.collection('pets');
    app.get("/featuredPets",async(req,res)=>{
        const result=await petsCollection.find().limit(5).toArray()
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
run().catch(console.dir)
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
