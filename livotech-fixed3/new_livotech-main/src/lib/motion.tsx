import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/* Shared motion tokens */
export const EASE = [0.22, 1, 0.36, 1] as const;

export function usePrefersReducedMotion() {
  return useReducedMotion() ?? false;
}

/* Fade-up on scroll into view */
export function Reveal({
  children, delay = 0, y = 26, className, once = true,
}: { children: ReactNode; delay?: number; y?: number; className?: string; once?: boolean }) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* Stagger parent/children */
const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const staggerChild: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
      {children}
    </motion.div>
  );
}
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  );
}

/* Same stagger effect, but animates in as soon as it mounts instead of waiting to
   scroll into view. Use this for content that re-renders from user interaction
   (filters, search, tabs) rather than a one-time page-load reveal — whileInView's
   IntersectionObserver can miss content that mounts while already on-screen with
   no real scroll happening, leaving it stuck invisible. */
export function StaggerNow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerParent} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}
export function StaggerItemNow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  );
}

/* Animated counter when visible */
export function Counter({
  to, decimals = 0, prefix = "", suffix = "", duration = 1.6, className,
}: { to: number; decimals?: number; prefix?: string; suffix?: string; duration?: number; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        if (reduced) { setVal(to); return; }
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / (duration * 1000));
          const eased = 1 - Math.pow(1 - p, 4);
          setVal(to * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}{val.toFixed(decimals)}{suffix}
    </span>
  );
}

/* Gentle floating wrapper */
export function Float({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reduced ? undefined : { y: [0, -10, 0] }}
      transition={{ duration: 6.5, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

/* Pointer-based 3D tilt (desktop only, disabled for reduced motion) */
export function Tilt({ children, max = 7, className }: { children: ReactNode; max?: number; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ rx: 0, ry: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current || window.matchMedia("(pointer: coarse)").matches) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setT({ rx: -py * max, ry: px * max });
  };
  const reset = () => setT({ rx: 0, ry: 0 });

  return (
    <div
      ref={ref} onMouseMove={onMove} onMouseLeave={reset}
      className={className}
      style={{ transform: `perspective(1100px) rotateX(${t.rx}deg) rotateY(${t.ry}deg)`, transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)", willChange: "transform" }}
    >
      {children}
    </div>
  );
}

/* Subtle magnetic pull for primary CTAs */
export function Magnetic({ children, strength = 0.18, className }: { children: ReactNode; strength?: number; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState({ x: 0, y: 0 });
  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current || window.matchMedia("(pointer: coarse)").matches) return;
    const r = ref.current.getBoundingClientRect();
    setP({ x: (e.clientX - (r.left + r.width / 2)) * strength, y: (e.clientY - (r.top + r.height / 2)) * strength });
  };
  return (
    <div ref={ref} className={`inline-block ${className ?? ""}`} onMouseMove={onMove} onMouseLeave={() => setP({ x: 0, y: 0 })}
      style={{ transform: `translate(${p.x}px, ${p.y}px)`, transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
      {children}
    </div>
  );
}

/* Infinite marquee — children are duplicated for a seamless loop */
export function Marquee({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="relative flex overflow-hidden" aria-hidden>
      <div className={`anim-marquee flex w-max shrink-0 items-center ${className ?? ""}`}>{children}</div>
      <div className={`anim-marquee flex w-max shrink-0 items-center ${className ?? ""}`}>{children}</div>
    </div>
  );
}
