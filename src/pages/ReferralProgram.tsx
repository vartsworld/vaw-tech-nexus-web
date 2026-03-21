import React from 'react';
import { motion } from 'framer-motion';
import { Network, TrendingUp, IndianRupee, ArrowRight, Wallet, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';

const ReferralProgram = () => {
  const WHATSAPP_NUMBER = "918281543610";
  const REFERRAL_MESSAGE = "REFER";

  const handleWhatsAppRedirect = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(REFERRAL_MESSAGE)}`, '_blank');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const rewards = [
    { range: "₹8,500 – ₹10,000", payout: "₹500" },
    { range: "₹10,000 – ₹25,000", payout: "₹1,000" },
    { range: "₹25,000 – ₹50,000", payout: "₹2,000" },
    { range: "₹50,000 – ₹1,00,000", payout: "₹5,000" },
    { range: "Above ₹1,00,000", payout: "5% Commission", highlight: true },
  ];

  const benefits = [
    { text: "Instant earning opportunity", icon: <Zap className="w-5 h-5 text-tech-gold" /> },
    { text: "No investment required", icon: <Wallet className="w-5 h-5 text-tech-gold" /> },
    { text: "Fast payout (3–7 days)", icon: <IndianRupee className="w-5 h-5 text-tech-gold" /> },
    { text: "Unlimited referrals", icon: <Network className="w-5 h-5 text-tech-gold" /> },
  ];

  return (
    <>
      <SEO 
        title="Refer & Earn Program | VAW Technologies" 
        description="Refer clients for website and software projects and earn attractive rewards with VAW Technologies. Simple, transparent, and rewarding."
      />
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0618] to-[#040b16] text-white font-sans selection:bg-tech-gold/30 selection:text-white pb-20">
        
        {/* Navbar minimal */}
        <nav className="fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-center backdrop-blur-sm border-b border-white/5 bg-black/20">
          <Link to="/" className="flex flex-col items-start gap-0.5 group">
            <span className="text-xl md:text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
              VAW
            </span>
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-tech-gold group-hover:text-white transition-colors">
              Technologies
            </span>
          </Link>
          <Button variant="ghost" className="text-sm font-medium hover:text-tech-gold" onClick={() => window.history.back()}>
            Back to Home
          </Button>
        </nav>

        <main className="pt-32 px-6 max-w-5xl mx-auto">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-tech-gold/10 border border-tech-gold/20 text-tech-gold text-xs font-bold uppercase tracking-widest mb-4">
              <Network className="w-3.5 h-3.5" />
              Refer & Earn Program
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6">
              Turn Your Network <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D2FF] to-[#3A7BD5]">
                Into Earnings
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 font-light mix-blend-plus-lighter">
              Refer clients for website and software projects and earn attractive rewards. Simple, transparent, and rewarding.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid lg:grid-cols-12 gap-8 lg:gap-12"
          >
            {/* Rewards Table Section */}
            <motion.div variants={itemVariants} className="lg:col-span-7 space-y-8">
              <div className="bg-[#0f111a]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tech-gold to-transparent opacity-50"></div>
                
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-8">
                  <span className="w-10 h-10 rounded-full bg-tech-gold/10 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-tech-gold" />
                  </span>
                  Reward Structure
                </h2>

                <div className="space-y-3">
                  {rewards.map((reward, i) => (
                    <div 
                      key={i} 
                      className={`flex justify-between items-center p-4 rounded-xl transition-all duration-300 ${
                        reward.highlight 
                          ? "bg-gradient-to-r from-[#005c97]/20 to-[#363795]/20 border border-[#00d2ff]/30 shadow-[0_0_20px_rgba(0,210,255,0.1)]" 
                          : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10"
                      }`}
                    >
                      <span className={`font-medium ${reward.highlight ? "text-white" : "text-gray-300"}`}>
                        {reward.range}
                      </span>
                      <div className="flex items-center gap-3">
                        <ArrowRight className="w-4 h-4 text-gray-600 hidden md:block" />
                        <span className={`font-bold text-lg md:text-xl ${reward.highlight ? "text-[#00d2ff]" : "text-tech-gold"}`}>
                          {reward.payout}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note Section */}
              <div className="bg-black/40 border border-[#ff3366]/20 rounded-2xl p-6 text-sm text-gray-400">
                <h4 className="font-bold text-[#ff3366] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ff3366] animate-pulse"></span>
                  Important Notes
                </h4>
                <ul className="space-y-2 list-none">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 opacity-50">•</span> 
                    Applicable only for website & software projects.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 opacity-50">•</span> 
                    Not valid for digital marketing & creative services.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 opacity-50">•</span> 
                    Reward issued after successful project payment completion.
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Benefits & CTA Section */}
            <motion.div variants={itemVariants} className="lg:col-span-5 space-y-8">
              
              {/* Benefits */}
              <div className="bg-[#0f111a]/50 border border-white/5 rounded-3xl p-8">
                <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                  <TrendingUp className="w-5 h-5 text-[#00d2ff]" />
                  Why Join Us?
                </h3>
                <div className="space-y-5">
                  {benefits.map((b, i) => (
                    <div key={i} className="flex flex-row items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/5 flex items-center justify-center shrink-0">
                        {b.icon}
                      </div>
                      <span className="text-gray-300 font-medium">{b.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to Action Card */}
              <div className="relative overflow-hidden group">
                {/* Glow behind */}
                <div className="absolute -inset-1 bg-gradient-to-r from-tech-gold via-[#00d2ff] to-[#ff3366] rounded-[32px] blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative bg-[#050608] border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-tech-gold to-[#cc9900] flex items-center justify-center mb-6 shadow-lg shadow-tech-gold/20">
                    <Network className="w-8 h-8 text-black" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-white mb-2">Start Referring Today</h3>
                  <p className="text-sm text-gray-400 mb-8">
                    Send your referral via WhatsApp or reply <span className="text-white font-bold">“REFER”</span> to get started instantly.
                  </p>
                  
                  <Button 
                    onClick={handleWhatsAppRedirect}
                    size="lg"
                    className="w-full h-14 bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#1DA851] hover:to-[#128C3E] text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 group/btn"
                  >
                    Apply & Get Started
                    <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>

            </motion.div>
          </motion.div>

        </main>
      </div>
    </>
  );
};

export default ReferralProgram;
