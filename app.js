import express from 'express';
import { graphqlHTTP } from 'express-graphql'
import { buildSchema } from 'graphql'
import mongoose from 'mongoose'
import Event from './models/events.js';
import User from './models/user.js'
import bcrypt from 'bcryptjs'
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
type User {
    _id:ID!
    email:String!
    password:String
}
input EventInput {
    title:String!
    description:String!
    price:Float!
    date:String!
}
input UserInput {
    email:String!
    password:String!
}
type RootQuery {
    events: [Event!]!
}
type RootMutation {
    createEvent(eventInput:EventInput): Event!
    createUser(userInput:UserInput):User
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
                        date: new Date(args.eventInput.date),
                        creator: '5f87c5dd6cea4127546344fa'
                    })
                    const result = await event.save();
                    const user = await User.findById('5f87c5dd6cea4127546344fa');
                    if (!user) {
                        throw new Error("User does not exist")
                    }
                    user.createdEvents.push(event);
                    await user.save();

                    return result;
                } catch (error) {

                    return error.message
                }
            },
            createUser: async (args) => {
                try {
                    const dbuser = await User.findOne({ email: args.userInput.email });
                    if (dbuser) {
                        throw new Error("User with this email already exists")
                    }
                    const hashedpassword = await bcrypt.hash(args.userInput.password, 12);
                    const user = new User({
                        email: args.userInput.email,
                        password: hashedpassword
                    });
                    const result = await user.save();
                    result.password = null;
                    return result;

                } catch (error) {
                    throw new Error(error.message)

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