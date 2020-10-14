import express from 'express';
import { graphqlHTTP } from 'express-graphql'
import { buildSchema } from 'graphql'
import mongoose from 'mongoose'
import Event from './models/events.js';
const port = 3000;
const app = express();
app.use(express.json());


const schema = buildSchema(`
type Event {
    _id:ID!
    title:String!
    description:String!
    price:Float!
    date:String!
}
input EventInput {
    title:String!
    description:String!
    price:Float!
    date:String!
}
type RootQuery {
    events: [Event!]!
}
type RootMutation {
    createEvent(eventInput:EventInput): Event!
}
schema {
    query: RootQuery
    mutation: RootMutation
}
`)

app.use(
    '/graphql',
    graphqlHTTP({
        schema: schema,
        rootValue: {
            events: async () => {
                try {
                    return await Event.find();
                } catch (error) {
                    return error.message;
                }
            },
            createEvent: async (args) => {

                try {
                    const event = new Event({
                        title: args.eventInput.title,
                        description: args.eventInput.description,
                        price: +args.eventInput.price,
                        date: new Date(args.eventInput.date)
                    })
                    const result = await event.save();
                    return result;
                } catch (error) {
                    console.log(error.message);
                    return error.message
                }

            }
        },
        graphiql: true
    })
);
mongoose.connect(`mongodb://${process.env.dbuser}:${process.env.dbpassword}@my-freelance-cluster-shard-00-00.didtj.mongodb.net:27017,my-freelance-cluster-shard-00-01.didtj.mongodb.net:27017,my-freelance-cluster-shard-00-02.didtj.mongodb.net:27017/${process.env.dbname}?ssl=true&replicaSet=atlas-3k1efa-shard-0&authSource=admin&retryWrites=true&w=majority`, { useUnifiedTopology: true, useNewUrlParser: true }).then(() => {
    console.log('mongodb connected');
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    })

}).catch(e => {
    console.log(e);
})