import { createRoot } from "react-dom/client";
import { LanguageProvider } from "@/contexts/LanguageContext";
import App from "./App.tsx";
import "./index.css";

// LanguageProvider must wrap App for all useLanguage hooks to work
createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
