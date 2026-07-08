import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import ProjectsLanding from "./pages/ProjectsLanding";
import CategoryPage from "./pages/CategoryPage";
import ProjectDetails from "./pages/ProjectDetails";
import Collaborate from "./pages/Collaborate";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import BackToTop from "./components/BackToTop";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <>
      <div className="route-transition" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/guest" element={<Home />} />
          <Route path="/projects" element={<ProjectsLanding />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/project/:id" element={<ProjectDetails />} />
          <Route path="/collaborate" element={<Collaborate />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/crud" element={<Admin />} />
          <Route path="/admin" element={<Navigate to="/crud" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <BackToTop />
    </>
  );
}