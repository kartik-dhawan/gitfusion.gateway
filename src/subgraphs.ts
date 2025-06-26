import { ServiceEndpointDefinition } from "@apollo/gateway";

const subgraphs: ServiceEndpointDefinition[] = [
  { name: "ums", url: process.env.GITFUSION_UMS_SUBGRAPH_URL },
];

export default subgraphs;
