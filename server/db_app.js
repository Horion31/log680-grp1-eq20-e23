const { Client } = require('pg')
const { graphqlImport } = require('graphql-import-node/register');
const { makeExecutableSchema } = require('@graphql-tools/schema')
const typeDef = require('./schemas/schema.docs.graphql');

require('dotenv').config();

const resolvers = {}

const schema = makeExecutableSchema({
    typeDefs: typeDef,
    resolvers: {},
})

const client = new Client({
    user: 'postgres',
    password: 'postgres',
    host: "localhost",
    port: 5432,
});
client.connect()

async function CreateDatabaseIfNotExist() {
    try {
        const result = await client.query(`select exists( SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('${process.env.DB_NAME}'))`)
        if (!result.rows[0].exists) {
            console.log("create database")
            pool.query(`CREATE DATABASE ${process.env.DB_NAME};`)
        }
        else {
            console.log("Using already existing database")
        }
    } catch (e) {
        throw e
    }

}


async function CreateTables() {
    // console.log("Create table if dont exist")
    // try {
    //     const resultTask = await client.query(`CREATE Table if not exists Task (
    //         task_id serial PRIMARY KEY,
    //         name VARCHAR (100),
    //         state VARCHAR (10),
    //         lead_time TIMESTAMP,
    //         createdAt TIMESTAMP,
    //         updatedAt TIMESTAMP)`);

    //     const resultProject = await client.query(`CREATE Table if not exists Project (
    // 	    project_id serial PRIMARY KEY,
    //         created TIMESTAMP)`);

    // } catch (e) {
    //     throw e
    // }
}

module.exports = {
    CreateDatabaseIfNotExist
}