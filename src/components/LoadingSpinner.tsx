import { useEffect, useState } from "react";
import logo from "@/assets/virtus-logo.png";

export const LoadingSpinner = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = logo;
    if (img.complete) {
      setLoaded(true);
    } else {
      img.onload = () => setLoaded(true);
      img.onerror = () => setLoaded(true);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative flex h-40 w-40 items-center justify-center transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary border-b-primary" style={{ animationDuration: '0.512s' }} />
        <img
          src={logo}
          alt="Logo"
          className="relative h-20 w-20 object-contain"
        />
      </div>
    </div>
  );
};

export default LoadingSpinner;
