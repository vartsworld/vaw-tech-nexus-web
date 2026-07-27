import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const [showButton, setShowButton] = useState(false);

  // Check if current page is public-facing (i.e. not in dashboards or admin sections)
  const isPublicPage = !pathname.startsWith("/staff") &&
    !pathname.startsWith("/team-head") &&
    !pathname.startsWith("/client") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/hr") &&
    !pathname.startsWith("/super-admin");

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  useEffect(() => {
    if (!isPublicPage) {
      setShowButton(false);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isPublicPage]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isPublicPage || !showButton) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in duration-300">
      <Button
        variant="secondary"
        size="icon"
        onClick={scrollToTop}
        className="rounded-full shadow-lg border border-border/50 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label="Scroll to top of the page"
        title="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default ScrollToTop;
