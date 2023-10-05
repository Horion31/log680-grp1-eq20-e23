const express = require('express')
const { graphqlHTTP } = require('express-graphql');
const bodyParser = require('body-parser');
const { graphql, buildSchema } = require('graphql');
const db = require('./queries');

require('dotenv').config({path:'../.env'})

const app = express()
const port = 3000

const schema = buildSchema(`
    type Query {
        hello: String
    }
`);
// const schema = require('./schema/schema');

const root = {
    hello: () => {
        return 'Hello world!';
    },
};

app.use(bodyParser.json());

app.use('/graphql', graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true
}));

//VARIABLES METRIQUES
let differenceInDays = 0;
let differenceInSeconds = 0;
const dateActuelle = new Date();

//Tache donnée (metrique 1)
const nomTache  = "Créer des milestones"

//Nom colonne (metrique 3)
const NomColonne = "A faire"

//Variables définissant la période choisie (metrique 2 et 4)
const dateFin = new Date("2023-11-03");
const dateDebut = new Date("2023-09-01");


const baseUrl = "https://api.github.com/graphql";

const headers = {
    "Content-Type": "application/json",
    authorization: "bearer " + process.env.GITHUB_TOKEN //remettre process.env.GITHUB_TOKEN
};

//requete metriques
const query1 = {
  query: ` query {
    node(id: "PVT_kwHOAWcErM4AVdZf") {
      ... on ProjectV2 {
        items(first: 20) {
          nodes{
            fieldValues(first:8) {
              nodes{
                ... on ProjectV2ItemFieldTextValue {
                  text
                    }                            
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  createdAt
                  updatedAt
                }
              }
            }
          }
        }
      }
    }
  }
  `,
};

const query2 = {
    query: ` query{
        user(login: "${process.env.GITHUB_USERNAME}") {
        issues(last: 100, orderBy: {field:CREATED_AT, direction: DESC}){
        totalCount
        nodes{
            id
            closed
            title
            createdAt
          url
          number
          assignees(first:100){
            nodes{
              avatarUrl
              name
              url
            }
          }
          repository{
            name
            url
            owner{
              login
              avatarUrl
              url
            }
          }
        }
      }
    }
      }`,
};


//routes

//Metrique 1
app.get('/kanban/metrique1', async (req, res) => {
    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(query1)
        });

        const data = await response.json();

        res.json(data);

      let i = 0;
      while (i < data.data.node.items.nodes.length) {
        const node = data.data.node.items.nodes[i];
        if (node.fieldValues.nodes[3].text === nomTache) {
          if (node.fieldValues.nodes[4].name === "Terminé") {
            const createdAt = new Date(node.fieldValues.nodes[4].createdAt);
            const updatedAt = new Date(node.fieldValues.nodes[4].updatedAt);
            const differenceInMilliseconds = updatedAt - createdAt;
            differenceInSeconds = differenceInMilliseconds / 1000;
            differenceInDays = differenceInSeconds / (60*60*24);
            break
          }
      
          else {
            const createdAt = new Date(node.fieldValues.nodes[4].createdAt);
            const differenceInMilliseconds = dateActuelle - createdAt;
            differenceInSeconds = differenceInMilliseconds / 1000;
            differenceInDays = differenceInSeconds / (60*60*24);
            break
          }

        }
      
      i++;
      }

console.log(`Le leadtime pour la tache donnée "${nomTache}" est de ${differenceInSeconds} secondes, soit ${differenceInDays} jours.`);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
    }

});

//Métrique 2
app.get('/kanban/metrique2', async (req, res) => {
  try {  
      const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query1),
    });
  
    const data = await response.json();

    console.log(`Pour la periode de ${dateDebut} à ${dateFin} \n`);

    let i = 0;
    while (i < data.data.node.items.nodes.length) {
      const node = data.data.node.items.nodes[i];
      const dateCompletion = new Date(node.fieldValues.nodes[4].updatedAt);
      if ((node.fieldValues.nodes[4].name === "Terminé") && (dateDebut <= dateCompletion) && (dateFin>= dateCompletion)) {
        const createdAt = new Date(node.fieldValues.nodes[4].createdAt);
        const updatedAt = new Date(node.fieldValues.nodes[4].updatedAt);
        const differenceInMilliseconds = updatedAt - createdAt;
        differenceInSeconds = differenceInMilliseconds / 1000;
        differenceInDays = differenceInSeconds / (60*60*24);
        console.log(`Le Lead time pour la tache ${node.fieldValues.nodes[3].text} : ${differenceInSeconds} secondes, soit ${differenceInDays} jours`);

      }
      i++;
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});



//Métrique 3
app.get('/kanban/metrique3', async (req, res) => {
  try {
      const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query1),
    });
    
    //Comptage du nombre de tâche pour une colonne donnée
    let compteurTachesColonne = 0;
    const data = await response.json();
    let i = 0;
    while (i < data.data.node.items.nodes.length) {
      const node = data.data.node.items.nodes[i];
      if (node.fieldValues.nodes[4].name === NomColonne) {
        compteurTachesColonne++;
      }
      i++;
    }
console.log(`Le nombre de tâches dans la colonne "${NomColonne}" est : ${compteurTachesColonne}`);

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});


//Métrique 4
app.get('/kanban/metrique4', async (req, res) => {
  try {
      const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query1),
    });
    
    const data = await response.json();

    //Comptage du nombre de tâches terminées pour une période donnée
    let compteurTachesFinies = 0;
    let i = 0;

    while (i < data.data.node.items.nodes.length) {
      const node = data.data.node.items.nodes[i];
      const dateCompletion = new Date(node.fieldValues.nodes[4].updatedAt);
      if ((node.fieldValues.nodes[4].name === "Terminé") && (dateDebut <= dateCompletion) && (dateFin>= dateCompletion)) {
        compteurTachesFinies++;
      }
      i++;
    }
console.log(`Le nombre de tâches terminées pour la periode de ${dateDebut} à ${dateFin} est : ${compteurTachesFinies}`);

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});

app.get("/", (req, res) => {
    res.send("Bienvenue sur la page d'accueil de l'application !");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});