import { useEffect } from "react";

const GPSProposal = () => {
  useEffect(() => {
    document.title = "Website Proposal – Global Education Trust | VAW Technologies";
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", margin: 0, padding: 0 }}>
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
