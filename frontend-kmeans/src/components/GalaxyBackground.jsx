import React, { useEffect } from "react";

// Puedes ajustar el número de destellos aquí
const NUM_BUBBLES = 24;

function GalaxyBackground() {
  useEffect(() => {
    const container = document.querySelector(".galaxy-bg");
    if (!container) return;
    container.innerHTML = "";

    for (let i = 0; i < NUM_BUBBLES; i++) {
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      const size = 60 + Math.random() * 60; // entre 60 y 120px
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}vw`;
      bubble.style.top = `${Math.random() * 100}vh`;
      bubble.style.opacity = 0.14 + Math.random() * 0.18;
      bubble.style.animationDuration = `${18 + Math.random() * 18}s`;
      bubble.style.animationDelay = `${Math.random() * 12}s`;
      container.appendChild(bubble);
    }
  }, []);

  return <div className="galaxy-bg" />;
}

export default GalaxyBackground;
