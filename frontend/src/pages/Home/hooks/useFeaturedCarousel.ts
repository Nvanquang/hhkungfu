// Quản lý index của hero carousel và tự động chuyển slide mỗi 6 giây khi có data.
import { useEffect, useState } from "react";

export function useFeaturedCarousel(featuredCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!featuredCount) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % Math.min(5, featuredCount));
    }, 6000);
    return () => window.clearInterval(id);
  }, [featuredCount]);

  return { activeIndex, setActiveIndex };
}