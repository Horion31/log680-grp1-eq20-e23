const {Client} = require('pg')

const client = new Client({
    user: "postgres",
    password: "postgres",
    host: "postgres2",
    port: 5432,
    database: "db_postgres"
})

client.connect()
    .then(() => console.log("Connected successfully"))
    .catch(e => console.log(e))
    .finally(() => client.end())