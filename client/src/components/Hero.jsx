import { useEffect } from "react";
import anime from "animejs";

export default function Hero() {
  useEffect(() => {
    anime
      .timeline({ easing: "easeOutExpo" })
      .add({ targets: ".kicker", opacity: [0, 1], translateY: [10, 0], duration: 600 })
      .add({ targets: ".sub", opacity: [0, 1], translateY: [14, 0], duration: 700 }, "-=300")
      .add({ targets: ".hero-ctas", opacity: [0, 1], translateY: [14, 0], duration: 600 }, "-=500");
  }, []);

  return (
    <header className="hero">
      <div className="wrap">
        <div className="kicker">self-hosted / modular / local-first</div>
        <h1 className="title">
          One toolkit. <span className="accent">Every</span> utility
          <br /> you keep reaching for.
        </h1>
        <p className="sub">
          Compress, convert, strip backgrounds, pull video — one dashboard, running on your own hardware.
          New tools plug into the same grid whenever you need them.
        </p>
        <div className="hero-ctas">
          <a className="btn btn-primary" href="#tools">Browse tools</a>
          <a className="btn btn-ghost" href="#assist">Ask the assistant</a>
        </div>
      </div>
    </header>
  );
}
