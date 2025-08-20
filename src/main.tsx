import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { MarcasProvider } from "./contexts/MarcasContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <MarcasProvider>
        <App />
      </MarcasProvider>
    </BrowserRouter>
  </StrictMode>
);
