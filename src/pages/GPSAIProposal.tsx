import { useEffect } from "react";

const GPSAIProposal = () => {
  useEffect(() => {
    document.title = "AI Chatbot Proposal – Global Public School | VAW Technologies";
    // Prevent the main app body from scrolling behind the overlay
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,
        background: "#fff",
      }}
    >
      <iframe
        src="/lovable-uploads/GPS_Proposal_AI_VAWTech.html"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        title="AI Chatbot Proposal – Global Public School"
        sandbox="allow-scripts allow-popups allow-forms allow-top-navigation"
      />
    </div>
  );
};

export default GPSAIProposal;
