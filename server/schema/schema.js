const graphql = require('graphql');
const _ = require('lodash');

const { GraphQLObjectType, GraphQLString, GraphQLSchema } = graphql;

const BookType = new GraphQLObjectType({
    name: 'book',
    fields: ()=>({
        id: {
            type: GraphQLString
        },
        name: {
            type: GraphQLString
        },
        genre: {
            type: GraphQLString
        }
    })
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        book: {
            type: BookType,
            args: { id: { GraphQLString } },
            resolve(parent, args) {
                // code  to  get data from db
            }
        }
    }
})

module.exports = new GraphQLSchema({
    query: RootQuery
});