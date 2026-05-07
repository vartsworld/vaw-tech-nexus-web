import { useEffect } from "react";

const GPSProposal = () => {
  useEffect(() => {
    document.title = "Website Proposal – Global Education Trust | VAW Technologies";
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
        src="/lovable-uploads/GPS_Proposal_VAWTech_v2.html"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        title="Website Proposal – Global Education Trust"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
      />
    </div>
  );
};

export default GPSProposal;
