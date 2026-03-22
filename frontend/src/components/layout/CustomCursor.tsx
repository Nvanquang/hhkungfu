import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable completely on touch devices (phones, tablets)
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    // Use GSAP quickTo for highly performant tracking (60-120fps)
    const xSetCursor = gsap.quickTo(cursor, "x", { duration: 0.1, ease: "power3" });
    const ySetCursor = gsap.quickTo(cursor, "y", { duration: 0.1, ease: "power3" });
    
    // The ring follows with a slight trailing delay
    const xSetRing = gsap.quickTo(ring, "x", { duration: 0.3, ease: "power3" });
    const ySetRing = gsap.quickTo(ring, "y", { duration: 0.3, ease: "power3" });

    const onMouseMove = (e: MouseEvent) => {
      xSetCursor(e.clientX);
      ySetCursor(e.clientY);
      xSetRing(e.clientX);
      ySetRing(e.clientY);
    };

    // When hovering over interactive elements (Links, Buttons)
    const hoverEnter = () => {
      gsap.to(cursor, { scale: 0, opacity: 0, duration: 0.2 });
      gsap.to(ring, { 
        scale: 1.8, 
        borderColor: "rgba(255, 69, 0, 0.8)", // Bright fiery red-orange
        backgroundColor: "rgba(255, 69, 0, 0.15)",
        boxShadow: "0 0 25px rgba(255, 69, 0, 0.5)",
        duration: 0.3 
      });
    };

    const hoverLeave = () => {
      gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.2 });
      gsap.to(ring, { 
        scale: 1, 
        borderColor: "rgba(249, 115, 22, 0.4)", // Subtle orange outline when idle
        backgroundColor: "transparent",
        boxShadow: "0 0 15px rgba(249, 115, 22, 0.15)",
        duration: 0.3 
      });
    };

    // Click effect (Punch)
    const clickDown = () => gsap.to(ring, { scale: 0.8, duration: 0.1 });
    const clickUp = () => gsap.to(ring, { scale: 1, duration: 0.2 });

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", clickDown);
    window.addEventListener("mouseup", clickUp);

    // Event delegation for hover states
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('a') || 
        target.closest('button') || 
        target.closest('[role="button"]') || 
        target.closest('.cursor-pointer') ||
        target.closest('.slick-arrow') // carousel arrows
      ) {
        hoverEnter();
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('a') || 
        target.closest('button') || 
        target.closest('[role="button"]') || 
        target.closest('.cursor-pointer') ||
        target.closest('.slick-arrow')
      ) {
        hoverLeave();
      }
    };

    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", clickDown);
      window.removeEventListener("mouseup", clickUp);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  // Inject a global class to hide the default browser cursor
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) {
      document.body.classList.add("custom-cursor-active");
      return () => document.body.classList.remove("custom-cursor-active");
    }
  }, []);

  return (
    <>
      {/* The trailing ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[99999] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-colors hidden md:block mix-blend-screen"
        style={{ willChange: "transform, box-shadow" }}
      />
      {/* The solid dot */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[100000] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400 hidden md:block shadow-[0_0_10px_rgba(249,115,22,1)] mix-blend-screen"
        style={{ willChange: "transform" }}
      />
    </>
  );
}
