
const dotenv = require('dotenv').config({path: ".env"});

const express = require('express')
const {graphqlHTTP} = require('express-graphql');
const bodyParser = require('body-parser');

const path = require('path');
const {GraphQLFileLoader} = require('@graphql-tools/graphql-file-loader');
const {loadSchemaSync} = require('@graphql-tools/load');
const {addResolversToSchema} = require('@graphql-tools/schema');
const {isEmpty} = require("lodash");

const schema = loadSchemaSync(path.join(__dirname, './schema/schema.docs.graphql'), {
    loaders: [new GraphQLFileLoader()]
});
const resolvers = {};
const schemaWithResolvers = addResolversToSchema({schema, resolvers});



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

app.get('/kanban', async (req, res) => {
    try {
        if (process.env.GITHUB_TOKEN == null)
            throw new Error("Environment variable GITHUB_TOKEN is undefined. Can't get Authentification on GitHub.")

        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(query)
        });

        const data = await response.json();

        res.json(data);
    } catch (error) {

        var len = error.length;
        var errorMessage = error;
        if (len === 0) {
            errorMessage = 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.';
        }
        res.status(500).json(errorMessage.toString());

    }
});

app.get("/", (req, res) => {
    res.send("Bienvenue sur la page d'accueil de l'application !");
});

//end added

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})