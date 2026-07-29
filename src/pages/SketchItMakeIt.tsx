import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  ChevronDown,
  Paintbrush,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle,
} from "lucide-react";
import SEO from "@/components/SEO";
import { CAMPAIGN_CONFIG, DrawingItem } from "./sketchit-makeit-config";
import posterImg from "@/assets/sketchit-makeit-poster.jpg";

export default function SketchItMakeIt() {
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const triggerDownload = (drawing: DrawingItem) => {
    // Standard secure way to trigger single-click immediate file download
    const link = document.createElement("a");
    link.href = drawing.filepath;
    link.download = drawing.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFaq = (index: number) => {
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FCF5] text-slate-800 font-sans overflow-x-hidden selection:bg-red-200 selection:text-red-800">
      <SEO
        title="Sketch It Make It | S-Mart × Art Flair"
        description="Download free coloring pages, color them, share on Instagram, and win exciting prizes while receiving a FREE 3-Day Art Bootcamp."
        keywords="Sketch It Make It, S-Mart Supermarket, Art Flair, coloring contest children Kerala, drawing campaign Instagram, free art bootcamp Anchal"
      />

      {/* Decorative Floating Elements/Doodles */}
      <div className="absolute top-12 left-6 animate-bounce pointer-events-none hidden md:block select-none opacity-60">
        <span className="text-4xl">✏️</span>
      </div>
      <div className="absolute top-32 right-12 animate-pulse pointer-events-none hidden md:block select-none opacity-60">
        <span className="text-4xl">🎨</span>
      </div>
      <div className="absolute top-[30%] left-10 animate-bounce pointer-events-none hidden lg:block select-none opacity-50 [animation-delay:1s]">
        <span className="text-4xl">🖍️</span>
      </div>
      <div className="absolute top-[50%] right-8 animate-pulse pointer-events-none hidden lg:block select-none opacity-50 [animation-delay:1.5s]">
        <span className="text-4xl">🖌️</span>
      </div>
      <div className="absolute bottom-[20%] left-8 animate-bounce pointer-events-none hidden md:block select-none opacity-60">
        <span className="text-4xl">🚀</span>
      </div>
      <div className="absolute bottom-[10%] right-12 animate-pulse pointer-events-none hidden md:block select-none opacity-60">
        <span className="text-4xl">⭐</span>
      </div>

      {/* Header Banner - Collaborative Branding */}
      <header className="bg-emerald-600 text-white py-4 px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎪</span>
            <span className="font-bold tracking-tight text-lg sm:text-xl">
              S-MART SUPERMARKET × ART FLAIR
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollToSection("gallery")}
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-4 py-1.5 rounded-full text-sm transition-all shadow-sm"
              data-cuelume-press="click"
              data-cuelume-release="click"
            >
              Get Drawing Pages
            </button>
            <button
              onClick={() => scrollToSection("how-to")}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-1.5 rounded-full text-sm transition-all shadow-sm"
              data-cuelume-press="click"
              data-cuelume-release="click"
            >
              How to Win
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col items-start gap-6 text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-emerald-100 border-2 border-emerald-400 text-emerald-800 px-4 py-2 rounded-full font-bold text-sm shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
            Children's Special Creative Campaign
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black text-emerald-700 leading-tight drop-shadow-sm select-none"
          >
            ✏️ Sketch It <br className="hidden sm:block" />
            <span className="text-red-500 font-extrabold relative inline-block">
              Make It
              <span className="absolute bottom-1 left-0 w-full h-2.5 bg-yellow-300 -z-10 rounded-full"></span>
            </span>
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl sm:text-2xl font-bold text-slate-700 mt-2"
          >
            Download, Color, Share & Win Exciting Gifts!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-slate-600 leading-relaxed max-w-xl"
          >
            Download your favorite coloring sheet, bring it to life with your imagination, and share your masterpiece on Instagram for a chance to win exciting prizes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center gap-4 mt-4 w-full sm:w-auto"
          >
            <button
              onClick={() => scrollToSection("gallery")}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-8 py-4 rounded-[2rem] border-b-4 border-emerald-800 hover:border-emerald-900 text-lg transition-all shadow-lg flex items-center justify-center gap-2"
              data-cuelume-press="click"
              data-cuelume-release="click"
            >
              <Download className="w-5 h-5" />
              Download Drawings
            </button>
            <button
              onClick={() => scrollToSection("how-to")}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-emerald-700 border-2 border-emerald-400 font-bold px-8 py-4 rounded-[2rem] text-lg transition-all shadow-sm flex items-center justify-center gap-2"
              data-cuelume-press="click"
              data-cuelume-release="click"
            >
              How to Participate
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>

        <div className="lg:col-span-5 relative w-full flex justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative bg-white p-4 rounded-[2.5rem] border-4 border-emerald-400 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 max-w-sm sm:max-w-md w-full overflow-hidden group"
          >
            <img
              src={posterImg}
              alt="Sketch It Make It Poster"
              className="rounded-[2rem] object-cover w-full h-auto aspect-[16/10] sm:aspect-[1.8/1]"
            />
            <div className="absolute top-4 right-4 bg-red-500 text-white font-bold py-1 px-3 rounded-full text-xs shadow-md">
              Official Poster
            </div>
            <div className="p-4 text-center">
              <p className="text-xs font-semibold text-emerald-800">
                S-MART SUPERMARKET & ART FLAIR CO-PARTNERSHIP
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-emerald-50 py-20 px-6 border-y-2 border-emerald-100">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="bg-red-100 border border-red-300 text-red-600 font-bold px-4 py-1.5 rounded-full text-sm inline-flex items-center gap-2 shadow-sm">
            <Paintbrush className="w-4 h-4 animate-pulse" />
            Anchal, Kerala Edition
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-emerald-800">
            What is Sketch It Make It?
          </h2>
          <div className="h-1 w-24 bg-red-500 rounded-full my-1"></div>
          <p className="text-lg sm:text-xl text-slate-700 leading-relaxed max-w-3xl">
            <strong>Sketch It Make It</strong> is a fun, creative activity organized by{" "}
            <span className="text-emerald-700 font-bold">S-Mart Supermarket, Anchal, Kerala</span> in collaboration with{" "}
            <span className="text-red-500 font-bold">Art Flair Anchal</span>.
          </p>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Children can download free coloring pages, color them beautifully with their favorite tools, and share their artwork on Instagram.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mt-6">
            <div className="bg-white p-6 rounded-3xl border-2 border-emerald-200 shadow-sm flex flex-col items-center text-center">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="font-extrabold text-lg text-emerald-800 mb-2">FREE bootcamp for everyone</h3>
              <p className="text-sm text-slate-600">
                Every single eligible participant receives a <strong>FREE 3-Day Art Bootcamp</strong> voucher at Art Flair to enhance their creative genius!
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl border-2 border-emerald-200 shadow-sm flex flex-col items-center text-center">
              <div className="text-4xl mb-3">🕒</div>
              <h3 className="font-extrabold text-lg text-emerald-800 mb-2">Campaign Schedule</h3>
              <p className="text-sm text-slate-600">
                Starts from <strong>{CAMPAIGN_CONFIG.startDate}</strong> till <strong>{CAMPAIGN_CONFIG.endDate}</strong>. Let the colors loose!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 px-6 max-w-6xl mx-auto text-center">
        <div className="flex flex-col items-center gap-4 mb-12">
          <span className="text-4xl">🌟</span>
          <h2 className="text-3xl sm:text-5xl font-black text-emerald-800">
            Choose Your Favorite Sheet
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            Click any coloring card below to download and print it immediately. You can submit as many drawings as you like!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {CAMPAIGN_CONFIG.drawings.map((drawing) => (
            <div
              key={drawing.id}
              onClick={() => triggerDownload(drawing)}
              className="bg-white rounded-[2rem] border-4 border-slate-100 hover:border-emerald-400 p-4 transition-all duration-300 shadow-lg hover:shadow-2xl cursor-pointer group flex flex-col items-center"
              data-cuelume-press="click"
              data-cuelume-release="click"
            >
              <div className="w-full h-56 rounded-2xl bg-slate-50 overflow-hidden mb-4 relative flex items-center justify-center border-2 border-slate-100">
                <img
                  src={drawing.filepath}
                  alt={drawing.title}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg scale-95 group-hover:scale-100 transition-transform">
                    <Download className="w-4 h-4" /> Download Now
                  </div>
                </div>
              </div>
              <h3 className="font-extrabold text-lg text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">
                {drawing.title}
              </h3>
              <p className="text-xs text-slate-400 mb-4">Click anywhere to download</p>
              <button
                className="w-full bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerDownload(drawing);
                }}
              >
                <Download className="w-4 h-4" /> Download PDF/JPG
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* How to Participate Section */}
      <section id="how-to" className="bg-[#FFFCEE] py-20 px-6 border-y-2 border-yellow-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center flex flex-col items-center gap-4 mb-16">
            <span className="text-4xl">🚀</span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-800">
              How to Participate in 7 Steps
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl">
              Follow these simple steps with your child to participate and secure your free art bootcamp seat!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAMPAIGN_CONFIG.steps.map((step) => (
              <div
                key={step.number}
                className="bg-white p-6 rounded-[2rem] border-2 border-yellow-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col gap-4"
              >
                <div className="absolute -top-4 -left-4 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-md border-2 border-white">
                  {step.number}
                </div>
                <div className="pt-4">
                  <h3 className="font-black text-lg text-slate-800 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {step.number === 6 && (
                  <div className="bg-yellow-50 p-3 rounded-2xl border border-yellow-100 text-xs flex flex-col gap-1 mt-auto">
                    <span className="font-bold text-yellow-800">Tag Instagram handles:</span>
                    <span className="text-slate-700 font-semibold">{CAMPAIGN_CONFIG.instagramArtFlair}</span>
                    <span className="text-slate-700 font-semibold">{CAMPAIGN_CONFIG.instagramSmartSupermarket}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prizes Section */}
      <section id="prizes" className="py-20 px-6 max-w-6xl mx-auto text-center">
        <div className="flex flex-col items-center gap-4 mb-16">
          <span className="text-4xl">🎁</span>
          <h2 className="text-3xl sm:text-5xl font-black text-emerald-800">
            Exciting Prizes to Win!
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            Selected top entries will be gifted premium art bundles to foster their talent.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CAMPAIGN_CONFIG.prizes.map((prize) => (
            <div
              key={prize.id}
              className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 hover:border-red-200 transition-all shadow-md flex flex-col items-center gap-4 group"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 text-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                {prize.icon}
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-800 mb-1">
                  {prize.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {prize.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rules & Terms & Conditions Sections */}
      <section className="bg-slate-50 py-20 px-6 border-t border-slate-200">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Rules Section */}
          <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <h2 className="text-2xl font-black text-slate-800">Campaign Rules</h2>
            </div>
            <div className="h-0.5 w-16 bg-red-500 rounded-full"></div>
            <ul className="flex flex-col gap-3">
              {CAMPAIGN_CONFIG.rules.map((rule, idx) => (
                <li key={idx} className="flex gap-2.5 items-start text-sm text-slate-600 leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Terms & Conditions Section */}
          <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚖️</span>
              <h2 className="text-2xl font-black text-slate-800">Terms & Conditions</h2>
            </div>
            <div className="h-0.5 w-16 bg-emerald-500 rounded-full"></div>
            <ul className="flex flex-col gap-3">
              {CAMPAIGN_CONFIG.terms.map((term, idx) => (
                <li key={idx} className="flex gap-2.5 items-start text-sm text-slate-600 leading-relaxed">
                  <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center flex flex-col items-center gap-4 mb-16">
          <span className="text-4xl">❓</span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-800">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            Have a question? We have all the answers laid out for parents and kids.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {CAMPAIGN_CONFIG.faqs.map((faq, index) => {
            const isOpen = expandedFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 hover:bg-slate-50 transition-colors text-base sm:text-lg"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-slate-600 text-sm sm:text-base leading-relaxed bg-emerald-50/20 border-t border-slate-50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-slate-950 text-white py-12 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className="text-3xl">🎨</span>
              <span className="font-black text-xl tracking-wide">Sketch It Make It</span>
            </div>
            <p className="text-xs text-slate-400">
              Joint kids campaign by S-Mart Supermarket & Art Flair center.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-sm text-slate-300">
              Made with ❤️ by <span className="font-bold text-emerald-400">VAW Marketing</span> in collaboration with
            </p>
            <p className="text-xs text-slate-400 font-semibold tracking-wide">
              S-MART SUPERMARKET × ART FLAIR
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} VAW Technologies. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
