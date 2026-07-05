import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import CategoryGrid from "../components/CategoryGrid.jsx";
import AssistBar from "../components/AssistBar.jsx";

export default function LandingPage() {
  const sectionRef = useRef(null);

  useEffect(() => {
    // Staggered reveal for category cards using IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll(".category-card");
            cards.forEach((card, i) => {
              card.style.opacity = "0";
              card.style.transform = "translateY(24px)";
              card.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
              requestAnimationFrame(() => {
                card.style.opacity = "1";
                card.style.transform = "translateY(0)";
              });
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Hero />
      <section className="sockets" id="tools" ref={sectionRef}>
        <div className="wrap">
          <div className="section-label">module grid</div>
          <h2 className="section-title">Every tool is a socket. Every socket runs the same way.</h2>
          <p className="section-desc">
            Pick a category to see every tool in that bucket — or browse the full grid below.
          </p>

          <CategoryGrid />

          <div className="socket-grid" style={{ marginTop: 50 }}>
            <div className="socket socket-empty">
              <div className="plus">+</div>
              <div>open socket — register a tool in server/modules</div>
            </div>
            <div className="socket socket-empty">
              <div className="plus">+</div>
              <div>open socket — register a tool in server/modules</div>
            </div>
          </div>
        </div>
      </section>

      <AssistBar />

      <section className="arch" id="stack">
        <div className="wrap">
          <div className="section-label" style={{ justifyContent: "center" }}>runs on</div>
          <h2 className="section-title" style={{ margin: "0 auto" }}>A small, boring stack. On purpose.</h2>
          <div className="arch-row">
            <div className="arch-item"><b>React + Vite</b>this UI</div>
            <div className="arch-arrow">→</div>
            <div className="arch-item"><b>Express API</b>module registry</div>
            <div className="arch-arrow">→</div>
            <div className="arch-item"><b>ffmpeg / pdf-lib / yt-dlp / rembg</b>the actual work</div>
            <div className="arch-arrow">→</div>
            <div className="arch-item"><b>Ollama</b>optional, local</div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <h2>Stop opening five tabs. <span style={{ color: "var(--signal)" }}>Open one socket.</span></h2>
          <div className="foot-meta">
            <span>toolbench — self-hosted</span>
            <span>open architecture — add a tool anytime</span>
          </div>
        </div>
      </footer>
    </>
  );
}