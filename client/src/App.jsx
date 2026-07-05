import { BrowserRouter, Routes, Route } from "react-router-dom";
import BackgroundScene from "./components/BackgroundScene.jsx";
import Hero from "./components/Hero.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <BackgroundScene />

      <nav>
        <div className="wrap">
          <div className="logo"><span className="dot" />toolbench</div>
          <div className="nav-links">
            <a href="#tools">tools</a>
            <a href="#assist">ai layer</a>
            <a href="#stack">stack</a>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}