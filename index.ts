import { ApolloServer, gql } from 'apollo-server-express';
import { createServer } from 'http';
import express from 'express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import * as codegen from './src/generated/graphql';
// import resolvers from './resolvers';
// import typeDefs from './typeDefs';

// "dev": "ts-node-dev --respawn --transpile-only ./index.ts"

// type Book = {
//   id: string;
//   name?: string;
// }

// type User = {
//   id: string;
//   name?: boolean;
//   book: Book[];
// }


const typeDefs = gql`

  type Book {
    id: String!
    name: String
  }

  type User {
    id: String!
    name: Boolean
    book: [Book]
  }

  type Query {
    hello: User
  }
`

// console.log(typeDefs)


const resolvers = {
  Query: {
    hello: (_:any, {id}:codegen.QueryHelloArgs):codegen.User => {
      return {
        id: '1',
        book: [{id: '1', name: 'test'}, {id: '1', name: 'string'}],
        name: null
      }
    }
  }
}

// Create the schema, which will be used separately by ApolloServer and
// the WebSocket server.
const schema = makeExecutableSchema({ typeDefs: gql`${typeDefs}`, resolvers });

// Create an Express app and HTTP server; we will attach both the WebSocket
// server and the ApolloServer to this HTTP server.
const app = express();
const httpServer = createServer(app);

// Create our WebSocket server using the HTTP server we just set up.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

// Save the returned server's info so we can shutdown this server later
const serverCleanup = useServer({ schema }, wsServer);

async function start () {

// Set up ApolloServer.
const server = new ApolloServer({
  schema,
  csrfPrevention: true,
  cache: 'bounded',
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();
server.applyMiddleware({ app });

const PORT = 4001;
// Now that our HTTP server is fully set up, we can listen to it.
httpServer.listen(PORT, () => {
  console.log(
    `Server is now running on http://localhost:${PORT}${server.graphqlPath}`,
  );
});
}
start()