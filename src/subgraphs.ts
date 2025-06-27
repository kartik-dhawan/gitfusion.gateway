import { ServiceEndpointDefinition } from "@apollo/gateway";
import dotenv from "dotenv";

dotenv.config();

const subgraphs: ServiceEndpointDefinition[] = [
  // UMS-MICROSERVICE
  { name: "ums", url: process.env.GITFUSION_UMS_SUBGRAPH_URL },
];

export default subgraphs;
