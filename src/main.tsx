import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/bungee/400.css";

// Restore reduced motion preference on load
if (localStorage.getItem('reduce-motion') === 'true') {
  document.documentElement.classList.add('reduce-motion');
}

createRoot(document.getElementById("root")!).render(<App />);
