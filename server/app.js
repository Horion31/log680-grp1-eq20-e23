const express = require('express')

const bodyParser = require('body-parser')

const { graphqlHTTP } = require('express-graphql');
const schema = require('./schema/schema');

const db = require('./queries')

const app = express()
const port = 3000

app.use(bodyParser.json());


app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}));

//begin added
app.get('/kanban', async (req, res) => {
  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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', 
      },
      body: JSON.stringify({
        query: `
        query {
          repository(owner: "Horion31", name: "log680-grp1-eq20-e23") {
            name,
            projects (first : 1) { nodes {name} }
          }
        }
             
        `
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});


app.get("/", (req, res) => {
  res.send("Bienvenue sur la page d'accueil de l'application !");
});

//end added



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})