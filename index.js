// Speakeasy 2 Factor Authentication learned from https://www.youtube.com/watch?v=KQya9i6czhM
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
// Need to use Insominia or Postman to check
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
// Need to use Insominia or Postman to check and use JSON, get info from database after registering
// REMEMBER Tokens valid only for a LIMITED period of time on Authenticator
// To get the token you need to get the Base32 eg EUXW4MCBMZ4F2VCNGNNCM3ZFHBKCKQ3DGRTWWZRPHNPEC3TPMJAA
// and run that through an authenticator app
// localhost:5000/api/verify
/*
{
    "userId": "273f0343-9055-4acb-884a-d1d24ea74a8f"
    "token": "895481"
}
*/
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

// Validate token (like verify but more constant, not a one off login)
//localhost:5000/api/register
// use Insomnia to test, have JSON simular to verify
// REMEMBER Tokens valid only for a LIMITED period of time on Authenticator
/*
{
    "userId": "273f0343-9055-4acb-884a-d1d24ea74a8f"
    "token": "895481"
}
*/
app.post("/api/validate", (req, res) => {
  const { userId, token } = req.body;
  try {
    // Retrieve user from database
    const path = `/user/${userId}`;
    const user = db.getData(path);
    console.log({ user });
    const { base32: secret } = user.secret;
    // Returns true if the token matches
    const tokenValidates = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });
    if (tokenValidates) {
      res.json({ validated: true });
    } else {
      res.json({ validated: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving user" });
  }
});

app.listen(PORT, () => {
  console.log(`App is running on PORT: ${PORT}.`);
});
