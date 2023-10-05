require('dotenv').config({ path: '../.env' });

const express = require('express')
const { graphqlHTTP } = require('express-graphql');
const bodyParser = require('body-parser');
const { graphql, buildSchema } = require('graphql');

const db = require('./queries');

const path = require('path');
const { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader');
const { loadSchemaSync } = require('@graphql-tools/load');
const { addResolversToSchema } = require('@graphql-tools/schema');

const schema = loadSchemaSync(path.join(__dirname, './schema/schema.docs.graphql'), {
    loaders: [new GraphQLFileLoader()]
});
const resolvers = {};
const schemaWithResolvers = addResolversToSchema({ schema, resolvers });


const app = express()
const port = 3000

app.use(bodyParser.json());

app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
}));
const baseUrl = "https://api.github.com/graphql";

const headers = {
    "Content-Type": "application/json",
    authorization: "bearer " + process.env.GITHUB_TOKEN
};

const que = {
    query: ` query {
        __schema {
          types {
            name
            kind
            description
            fields {
              name
            }
          }
        }
      }`,
};

const query = {
    query: ` query {
        repository(owner: "Horion31", name: "log680-grp1-eq20-e23") {
          name,
          projectsV2 (first : 10) { 
            nodes {
            id
            title
            } 
            
        }
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