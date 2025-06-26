import { ApolloGateway, IntrospectAndCompose } from "@apollo/gateway";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import logger from "../winston.config.ts";
import subgraphs from "./subgraphs.ts";

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
  });

  // create a common entry point server
  const server = new ApolloServer({
    gateway,
  });

  try {
    await server.start();

    // run the graphql client middleware at /graphql route
    app.use("/graphql", expressMiddleware(server));

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
