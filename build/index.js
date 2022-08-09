"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const apollo_server_core_1 = require("apollo-server-core");
const schema_1 = require("@graphql-tools/schema");
const ws_1 = require("ws");
const ws_2 = require("graphql-ws/lib/use/ws");
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
const typeDefs = (0, apollo_server_express_1.gql) `

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
`;
// console.log(typeDefs)
const resolvers = {
    Query: {
        hello: (_, { id }) => {
            return {
                id: '1',
                book: [{ id: '1', name: 'test' }, { id: '1', name: 'string' }],
                name: null
            };
        }
    }
};
// Create the schema, which will be used separately by ApolloServer and
// the WebSocket server.
const schema = (0, schema_1.makeExecutableSchema)({ typeDefs: (0, apollo_server_express_1.gql) `${typeDefs}`, resolvers });
// Create an Express app and HTTP server; we will attach both the WebSocket
// server and the ApolloServer to this HTTP server.
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Create our WebSocket server using the HTTP server we just set up.
const wsServer = new ws_1.WebSocketServer({
    server: httpServer,
    path: '/graphql',
});
// Save the returned server's info so we can shutdown this server later
const serverCleanup = (0, ws_2.useServer)({ schema }, wsServer);
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        // Set up ApolloServer.
        const server = new apollo_server_express_1.ApolloServer({
            schema,
            csrfPrevention: true,
            cache: 'bounded',
            plugins: [
                // Proper shutdown for the HTTP server.
                (0, apollo_server_core_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
                // Proper shutdown for the WebSocket server.
                {
                    serverWillStart() {
                        return __awaiter(this, void 0, void 0, function* () {
                            return {
                                drainServer() {
                                    return __awaiter(this, void 0, void 0, function* () {
                                        yield serverCleanup.dispose();
                                    });
                                },
                            };
                        });
                    },
                },
            ],
        });
        yield server.start();
        server.applyMiddleware({ app });
        const PORT = 4001;
        // Now that our HTTP server is fully set up, we can listen to it.
        httpServer.listen(PORT, () => {
            console.log(`Server is now running on http://localhost:${PORT}${server.graphqlPath}`);
        });
    });
}
start();
