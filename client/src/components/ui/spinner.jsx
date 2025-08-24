// src/components/ui/spinner.jsx
import React from "react";

export const Spinner = ({ size = 50, color = "#4f46e5" }) => {
  const spinnerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    border: `${size / 10}px solid rgba(0, 0, 0, 0.1)`,
    borderTop: `${size / 10}px solid ${color}`,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.wrapper}>
        <div style={spinnerStyle}></div>
      </div>
    </>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100%",
  },
};
