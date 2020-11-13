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

app.use(express.json());

// http://localhost:5000/api
app.get("/api", (req, res) =>
  res.json({ message: "Welcome to the 2 factor auth example" })
);

// Register user & create a temporary secret
//localhost:5000/api/register
http: app.post("/api/register", (req, res) => {
  const id = uuid.v4();

  try {
    const path = `/user/${id}`;
    const temp_secret = speakeasy.generateSecret();
    db.push(path, { id, temp_secret });
    res.json({ id, secret: temp_secret.base32 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error generating secret" });
  }
});

// Verify token and make secret permnant
app.post("/api/verify", (req, res) => {
  const { token, userId } = req.body;

  try {
    const path = `/user/${userId}`;
    const user = db.getData(path);
    const { base32: secret } = user.temp_secret;
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
    });

    if (verified) {
      // in the database call the "temp_secret" "secret"
      db.push(path, { id: userId, secret: user.temp_secret });
      res.json({ verified: true });
    } else {
      // in a real app you'd get the front end to yell at the user when they are verified as false
      res.json({ verified: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving user" });
  }
});

app.listen(PORT, () => {
  console.log(`App is running on PORT: ${PORT}.`);
});
