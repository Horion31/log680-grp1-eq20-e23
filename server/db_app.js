const { Pool } = require('pg')
const { graphqlImport } = require('graphql-import-node/register');
const { makeExecutableSchema } = require('@graphql-tools/schema')
const typeDef = require('./schemas/schema.docs.graphql');

require('dotenv').config();

const resolvers = {}

const schema = makeExecutableSchema({
    typeDefs: typeDef,
    resolvers: {},
})

const pool = new Pool({
    user: 'postgres',
    password: 'postgres',
    host: "localhost",
    port: 5432,
});


const client = pool.connect()


async function CreateDatabaseIfNotExist() {

    const result = await pool.query(`select exists( SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('${process.env.DB_NAME}'))`)

    if (!result.rows[0].exists) {
        console.log("create database")
        pool.query(`CREATE DATABASE ${process.env.DB_NAME};`)
    }
    else {
        console.log("Using already existing database")
    }
    await pool.end()
}

async function CreateTables() {

    const result = await pool.query(`select exists( SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('${process.env.DB_NAME}'))`)

    if (!result.rows[0].exists) {
        console.log("create database")
        pool.query(`CREATE DATABASE ${process.env.DB_NAME};`)
    }
    else {
        console.log("Using already existing database")
    }
    await pool.end()
}

module.exports = {
    CreateDatabaseIfNotExist
}