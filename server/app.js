const express = require('express')

const bodyParser = require('body-parser')

const { graphqlHTTP } = require('express-graphql');
const schema = require('./schema/schema');

const db = require('./queries')

const app = express()
const port = 3000

app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
}));


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})