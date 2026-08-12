import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";

if (window.location.hash.includes("type=recovery")) {
  window.location.replace(`/reset-password.html${window.location.hash}`);
} else {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}
