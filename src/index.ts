import {
  ApolloGateway,
  IntrospectAndCompose,
  RemoteGraphQLDataSource,
} from "@apollo/gateway";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import logger from "../winston.config.ts";
import subgraphs from "./subgraphs.ts";
import { supabaseAdmin } from "./supabase/config.ts";
import { UserResponse } from "@supabase/supabase-js";

const PORT = process.env.PORT ?? 4002; // Setting the port from environment variable or defaulting to 3002

const startGateway = async () => {
  const app = express();

  // Middleware to parse JSON request bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // create a new gateway with the subgraphs from other microservices
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs,
    }),

    buildService: ({ url }) => {
      return new RemoteGraphQLDataSource({
        url,
        willSendRequest({ request, context }) {
          // context - here is the same context we set by decoding the token

          // now we inject that into the headers
          if (context.token) {
            request.http!.headers.set("authorization", context.token);
          }
          // inject your resolved userId
          if (context.userId) {
            request.http!.headers.set("x-user-id", context.userId);
          }
        },
      });
    },
  });

  // create a common entry point server
  const server = new ApolloServer({
    gateway,
  });

  try {
    await server.start();

    // run the graphql client middleware at /graphql route
    app.use(
      "/graphql",
      expressMiddleware(server, {
        context: async (params) => {
          const { req, res } = params;

          const authToken = req.headers.authorization;

          let userId: string | undefined;

          // check if the user exists in supabase with the token provided
          if (authToken) {
            // if the token is provided, we will get the user ID from it
            const decoded: UserResponse | undefined =
              await supabaseAdmin.auth.getUser(authToken);

            userId = decoded?.data?.user?.id;
          }

          // passing thr userId & authToken to the context to later use it to send in headers to other microservices
          return { req, res, userId, token: authToken };
        },
      })
    );

    app.listen(4002, () => {
      logger.gateway.info(
        `Apollo Gateway is running on http://localhost:${PORT}/graphql`
      );
    });
  } catch (error) {
    logger.gateway.error("Error starting the Apollo Server:", error);
  }
};

startGateway();
