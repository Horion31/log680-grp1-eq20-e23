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
const baseUrl = "https://api.github.com/graphql";

const headers = {
    "Content-Type": "application/json",
    authorization: "bearer " + process.env.GITHUB_TOKEN
};

const query = {
    query: ` query {
        repository(owner: "Horion31", name: "log680-grp1-eq20-e23") {
          name,
          projects (first : 1) { nodes {name} }
        }
      }`,
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

//begin added
app.get('/kanban', async (req, res) => {
    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(query)
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