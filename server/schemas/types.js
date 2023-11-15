const graphql = require("graphql");
const { GraphQLObjectType, GraphQLString } = graphql;

const TaskType = new GraphQLObjectType({
    name: "Task",
    type: "Query",
    fields: {
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        createdAt: { type: GraphQLString },
        updatedAt: { type: GraphQLString },
        state: { type: GraphQLString },
        lead_time: { type: GraphQLString }
    }
});

const ProjectType = new GraphQLObjectType({
    name: "Project",
    type: "Query",
    fields: {
        id: { type: GraphQLID },
        created: { type: GraphQLString }
    }
});



exports.UserType = TaskType;
exports.ProjectType = ProjectType;