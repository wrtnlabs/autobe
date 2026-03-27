import { createRoot } from "react-dom/client";

import "../styles/globals.css";

import { AutoBePlaygroundApplication } from "../AutoBePlaygroundApplication";

createRoot(window.document.getElementById("root")!).render(
  <AutoBePlaygroundApplication />,
);
