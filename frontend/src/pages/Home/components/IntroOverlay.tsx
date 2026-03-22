import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface Props {
  onComplete: () => void;
}

const BRAND = "HHKUNGFU";
const LETTERS = BRAND.split("");

// Netlix Red: #E50914

export function IntroOverlay({ onComplete }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);

  // Always keep the latest callback
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const container = containerRef.current;
    const word = lettersRef.current;
    const flare = flareRef.current;

    if (!overlay || !container || !word || !flare) return;

    const letterEls = word.querySelectorAll<HTMLSpanElement>(".intro-letter");

    // Using gsap.context to fix React 18 StrictMode firing useEffect twice
    const ctx = gsap.context(() => {
      // ----- GPU Initial Setup -----
      gsap.set(overlay, { backgroundColor: "#000" });
      gsap.set(container, { perspective: 800 });
      
      // Letters start slightly scaled up and dark
      gsap.set(word, { scale: 1.1, z: -100, transformStyle: "preserve-3d" });
      gsap.set(letterEls, { 
        opacity: 0,
        rotateX: 10,
        y: 10,
        skewX: -8, // Subtle rightward lean for speed and power
        // Chrome metallic silver finish + bright white center + dark edge + fire gradient base
        backgroundImage: "linear-gradient(110deg, #666 0%, #f0f0f0 30%, #ffffff 45%, #bbbbbb 55%, #111 75%, #ff4500 85%, #ffc100 100%)",
        backgroundSize: "300% 100%",
        backgroundPosition: "200% center",
        WebkitBackgroundClip: "text",
        color: "transparent",
        WebkitTextStroke: "2.5px #000000", // Thick black outline stroke
        // Dark edge shading creating 3D emboss layer effect
        textShadow: "1px 1px 0 #444, 2px 2px 0 #222, 3px 3px 0 #111, 4px 4px 0 #000, 5px 5px 0 #000, 0px 0px 0px rgba(255, 69, 0, 0)",
      });
      
      gsap.set(flare, { 
        opacity: 0, 
        scale: 0.1, 
      });

      // ----- Cinematic Timeline -----
      const tl = gsap.timeline({
        onComplete: () => {
          if (onCompleteRef.current) onCompleteRef.current();
        }
      });

      const STAGGER = 0.06;

      // 1. Reveal letters from bottom back, scaling container down to 1 slowly
      tl.to(word, {
        scale: 1,
        z: 0,
        duration: 2.6, // Exact duration up to the zoom to entirely prevent overlap glitches!
        ease: "power2.out"
      }, 0);

      tl.to(letterEls, {
        opacity: 1,
        rotateX: 0,
        y: 0,
        duration: 1.0,
        stagger: STAGGER,
        ease: "power2.out"
      }, 0);

      // 2. A single, powerful light sweep across the text
      tl.to(letterEls, {
        backgroundPosition: "-100% center",
        duration: 2.0,
        stagger: {
          each: STAGGER,
          from: "start"
        },
        ease: "power2.inOut",
      }, 0.2);

      // Subtle glow bloom at the peak of the light sweep
      tl.to(letterEls, {
        textShadow: "1px 1px 0 #444, 2px 2px 0 #222, 3px 3px 0 #111, 4px 4px 0 #000, 5px 5px 0 #000, 0px 0px 40px rgba(255, 69, 0, 1)",
        duration: 0.8,
        yoyo: true,
        repeat: 1, // 0->1->0 (One perfect fade in/out cycle without hanging in a glaring bright state)
        stagger: STAGGER,
      }, 0.4);

      // 3. Explosion / Massive Cinematic Zoom
      tl.to(word, {
        scale: 50, // Massive scale
        opacity: 0,
        duration: 0.8,
        ease: "power4.in" // Classic Netflix punch acceleration for a singular zoom
      }, 2.6);

      // 4. Flare bloom flash to blind the viewer smoothly and hide transition
      tl.to(flare, {
        opacity: 1,
        scale: 10,
        duration: 0.5,
        ease: "power2.in"
      }, 2.8);

      // 5. Master fade out to reveal the Home page seamlessly
      tl.to(overlay, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.out"
      }, 3.3);
      tl.duration(3.8); // Shortened the total intro length for better pacing
    }, overlayRef); // Scope to the overlay component

    return () => {
      ctx.revert(); // Automatically kills the timeline AND reverting initial `gsap.set()` styles!
    };
  }, []);

  return (
    <div 
      ref={overlayRef} 
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden pointer-events-none select-none bg-black"
    >
      <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
        
        {/* The cinematic flare in the background (Replaces 80 laggy divs) */}
        <div 
          ref={flareRef}
          className="absolute inset-0 pointer-events-none flex justify-center items-center"
        >
          {/* Using 1 simple radial gradient instead of box-shadow/blur for max GPU performance */}
          <div className="w-[50vw] h-[50vw] rounded-full mix-blend-screen" style={{
            background: "radial-gradient(circle, rgba(230,99,17,1) 0%, rgba(230,99,17,0.4) 30%, rgba(0,0,0,0) 70%)",
            willChange: "transform, opacity"
          }} />
        </div>

        {/* Text Word */}
        <div ref={lettersRef} className="flex font-bold" style={{ gap: "2px", willChange: "transform" }}>
          {LETTERS.map((char, i) => (
            <span 
              key={i} 
              className="intro-letter relative inline-block text-center"
              style={{
                fontFamily: "'Playfair Display Black', 'Cinzel Decorative', 'Impact', 'Rockwell', serif", // Aggressive sharp serif / ultra-bold
                fontWeight: 900, // Ultra-bold
                fontStyle: "italic", // Matches the forward kinetic momentum
                fontSize: "clamp(4.5rem, 13vw, 11rem)",
                letterSpacing: "-0.05em", // Condensed formatting
                lineHeight: 1,
                paddingBottom: "0.1em", // prevent clipping of long strokes
                textTransform: "uppercase",
                willChange: "transform, opacity, text-shadow, background-position",
              }}
            >
              {char}
            </span>
          ))}
        </div>
        
      </div>
    </div>
  );
}