import React from "react";
import "./F1Background.css";

const NUM_CARS = 3; // Cambia si quieres más/fewer cars

const F1Background = () => {
  return (
    <div className="f1-bg-fondo">
      <div className="f1-pista"></div>
      {[...Array(NUM_CARS)].map((_, idx) => (
        <img
          key={idx}
          src="/car.png"
          alt="F1 Car"
          className={`f1-car f1-car-${idx}`}
          style={{
            top: `${20 + idx * 20}%`,
            animationDelay: `${idx * 2}s`,
          }}
        />
      ))}
    </div>
  );
};

export default F1Background;
