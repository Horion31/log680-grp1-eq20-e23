const { Client } = require('pg')

const client = new Client({
    user: "postgres",
    password: "postgres",
    host: 'localhost',
    port: 5432,
    database: "postgres"
})

console.log("try to connect to db")

client.connect()
    .then(() => console.log("Connected successfully"))
    .catch(e => console.log(e))
    .finally(() => client.end())