import { useEffect } from "react";

const FintechProposal = () => {
  useEffect(() => {
    document.title = "UK–India Remittance Platform — Proposal | VAW Technologies";
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
        background: "#EFF2F4",
      }}
    >
      <iframe
        src="/pdf/fintech-proposal.html"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        title="UK–India Remittance Platform — Proposal"
        sandbox="allow-scripts allow-popups allow-forms allow-top-navigation allow-same-origin"
      />
    </div>
  );
};

export default FintechProposal;
