import { useEffect } from "react";

const GPSProposal = () => {
  useEffect(() => {
    document.title = "Website Proposal – Global Education Trust | VAW Technologies";
  }, []);

  return (
    <iframe
      src="/lovable-uploads/GPS_Proposal_VAWTech_v2.html"
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        display: "block",
        margin: 0,
        padding: 0,
      }}
      title="Website Proposal – Global Education Trust"
    />
  );
};

export default GPSProposal;
