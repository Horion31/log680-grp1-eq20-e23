const { GraphQLObjectType, GraphQLID } = require("graphql");
const { TaskType, ProjectType } = require("./types");

const RootQuery = new GraphQLObjectType({
    name: "RootQueryType",
    type: "Query",
    fields: {
        project: {
            type: ProjectType,
            args: { id: { type: GraphQLID } },
            resolve(parentValue, args) {
                const query = `SELECT * FROM project WHERE id=$1`;
                const values = [args.id];

                return db
                    .one(query, values)
                    .then(res => res)
                    .catch(err => err);
            }
        },
        task: {
            type: TaskType,
            args: { id: { type: GraphQLID } },
            resolve(parentValue, args) {
                const query = `SELECT * FROM tasks WHERE id=$1`;
                const values = [args.id];

                return db
                    .one(query, values)
                    .then(res => res)
                    .catch(err => err);
            }
        }
    }
});

exports.query = RootQuery;