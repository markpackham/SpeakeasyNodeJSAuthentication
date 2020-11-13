const express = require("express");
const bodyParser = require("body-parser");
// could use any database, this local json one is easy to use for testing
const { JsonDB } = require("node-json-db");
const { Config } = require("node-json-db/dist/lib/JsonDBConfig");
const uuid = require("uuid");
const speakeasy = require("speakeasy");
const app = express();
const PORT = process.env.PORT || 5000;

const db = new JsonDB(new Config("myDatabase", true, false, "/"));

app.get("/api", (req, res) =>
  res.json({ message: "Welcome to the 2 factor auth example" })
);

app.listen(PORT, () => {
  console.log(`App is running on PORT: ${PORT}.`);
});
