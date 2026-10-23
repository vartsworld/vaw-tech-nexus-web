import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowRight, ChevronDown, Headphones, Plus, RefreshCw, Search, Server, ShieldCheck, Sparkles, X, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { usePricingData } from "@/hooks/usePricingData";
import PackageCard from "@/components/pricing/PackageCard";
import AddonCard from "@/components/pricing/AddonCard";
import CartSummaryPanel from "@/components/pricing/CartSummaryPanel";
import CartDrawer from "@/components/pricing/CartDrawer";
import CouponBox from "@/components/pricing/CouponBox";
import CheckoutForm, { type SubmittedPlan } from "@/components/pricing/CheckoutForm";
import CustomRequestForm from "@/components/pricing/CustomRequestForm";
import RequestSent from "@/components/pricing/RequestSent";
import PromoBanner from "@/components/pricing/PromoBanner";
import { EMPTY_CART, GST_LABEL, formatPrice, loadCart, saveCart, summarizeCart, type CartState } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type View = "build" | "checkout" | "sent";
const ALL = "All plans";

const Pricing = () => {
  const { packages, addons, offer, loading, error, reload } = usePricingData();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cart, setCart] = useState<CartState>(() => loadCart());
  const [view, setView] = useState<View>("build");
  const [sent, setSent] = useState<SubmittedPlan | null>(null);
  const [customOpen, setCustomOpen] = useState(searchParams.get("tab") === "custom");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const topRef = useRef<HTMLDivElement>(null);
  const packagesRef = useRef<HTMLElement>(null);
  const addonsRef = useRef<HTMLElement>(null);
  const preselected = useRef(false);

  /* Persist the cart between visits */
  useEffect(() => saveCart(cart), [cart]);

  /* Drop anything that no longer exists in the price list (HR may disable items) */
  useEffect(() => {
    if (loading || error) return;
    setCart((c) => {
      const packageId = c.packageId && packages.some((p) => p.id === c.packageId) ? c.packageId : null;
      const addonIds = c.addonIds.filter((id) => addons.some((a) => a.id === id));
      if (packageId === c.packageId && addonIds.length === c.addonIds.length) return c;
      return { ...c, packageId, addonIds };
    });
  }, [packages, addons, loading, error]);

  /* Deep link: /pricing?package=<slug|id> preselects a package */
  useEffect(() => {
    if (loading || preselected.current) return;
    preselected.current = true;
    const wanted = searchParams.get("package") || searchParams.get("plan");
    if (!wanted) return;
    const match = packages.find((p) => p.slug === wanted || p.id === wanted);
    if (match) setCart((c) => ({ ...c, packageId: match.id }));
  }, [loading, packages, searchParams]);

  const summary = useMemo(() => summarizeCart(cart, packages, addons, offer), [cart, packages, addons, offer]);

  /* Back to the catalogue if the cart empties during checkout */
  useEffect(() => {
    if (view === "checkout" && summary.itemCount === 0) setView("build");
  }, [view, summary.itemCount]);

  const scrollTo = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goTo = (next: View) => {
    setView(next);
    setDrawerOpen(false);
    requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(topRef.current)));
  };

  const openCustom = (open: boolean) => {
    setCustomOpen(open);
    const params = new URLSearchParams(searchParams);
    if (open) params.set("tab", "custom");
    else params.delete("tab");
    setSearchParams(params, { replace: true });
  };

  /* ── cart actions ── */
  const selectPackage = useCallback(
    (id: string) => {
      const removing = cart.packageId === id;
      setCart((c) => ({ ...c, packageId: removing ? null : id }));
      if (removing) return;
      // Move the visitor on to the add-ons so they don't have to hunt for them
      if (addons.length > 0) {
        toast({ title: "Package selected", description: "Add any extras below, or open your plan to continue." });
        setTimeout(() => scrollTo(addonsRef.current), 120);
      }
    },
    [addons.length, cart.packageId]
  );
  const toggleAddon = useCallback(
    (id: string) => setCart((c) => ({ ...c, addonIds: c.addonIds.includes(id) ? c.addonIds.filter((x) => x !== id) : [...c.addonIds, id] })),
    []
  );
  const applyCoupon = (code: string) => {
    setCart((c) => ({ ...c, coupon: code }));
    toast({ title: "Coupon applied", description: `${code} has been added to your plan.` });
    if (summary.itemCount === 0) setTimeout(() => scrollTo(packagesRef.current), 120);
  };
  const clearCoupon = () => setCart((c) => ({ ...c, coupon: "" }));
  const clearCart = () => setCart(EMPTY_CART);

  /* ── filtering ── */
  const categories = useMemo(() => Array.from(new Set(packages.map((p) => p.category))), [packages]);
  const visiblePackages = useMemo(() => {
    let list = category === ALL ? [...packages] : packages.filter((p) => p.category === category);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.features.some((f) => f.toLowerCase().includes(q)));
    }
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => Number(b.popular) - Number(a.popular));
    return list;
  }, [packages, category, query, sort]);

  const drawerContent = (
    <CartSummaryPanel
      summary={summary}
      onRemovePackage={() => setCart((c) => ({ ...c, packageId: null }))}
      onRemoveAddon={toggleAddon}
      onClear={clearCart}
      coupon={<CouponBox offer={offer} summary={summary} onApply={applyCoupon} onClear={clearCoupon} />}
      action={
        <Button type="button" size="lg" className="h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-500" disabled={summary.itemCount === 0} onClick={() => goTo("checkout")}>
          Continue to details <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      }
      footer={
        <p className="mt-4 border-t border-white/10 pt-4 text-sm text-gray-400">
          Need something that isn't listed?{" "}
          <button
            type="button"
            className="font-semibold text-white underline underline-offset-2 hover:text-indigo-300"
            onClick={() => {
              setDrawerOpen(false);
              openCustom(true);
            }}
          >
            Send a custom request
          </button>
        </p>
      }
    />
  );

  const inBuild = view === "build";

  return (
    <div className="dark min-h-screen overflow-x-hidden bg-[#0A0A0E] text-white selection:bg-indigo-500/30 selection:text-white">
      <SEO
        title="Pricing & Packages | VAW Technologies"
        description="Transparent, value-driven pricing for web development, AI integration and e-commerce. Pick a package, add the extras you need and send us your request."
        keywords="web development pricing, website cost Kerala, web app cost, e-commerce development pricing, VAW Technologies packages"
        ogImage="/og/pricing.png"
      />
      <Navbar />

      <div ref={topRef} className="scroll-mt-0" />

      {inBuild && (
        <>
          {/* ── HERO ── */}
          <section className="relative overflow-hidden pb-14 pt-32 sm:pt-36">
            <div className="pointer-events-none absolute left-1/2 top-1/4 h-[350px] w-[700px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-transparent blur-[120px]" />
            <div className="pointer-events-none absolute -top-10 left-10 h-96 w-96 rounded-full bg-sky-500/10 blur-[130px]" />
            <div className="pointer-events-none absolute right-10 top-40 h-80 w-80 rounded-full bg-amber-500/10 blur-[140px]" />

            <div className="container relative z-10 mx-auto px-4">
              <div className="mx-auto max-w-4xl space-y-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 shadow-lg shadow-indigo-500/5 backdrop-blur-md">
                  <Sparkles className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">Transparent &amp; value-driven pricing</span>
                </div>

                <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl md:text-6xl">
                  Engineering scalable digital experiences with{" "}
                  <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">predictable pricing</span>
                </h1>

                <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg md:text-xl">
                  No hidden fees, no ambiguity. Pick a package, add the extras you need and send us your request. Full-cycle development, fast hosting and
                  post-launch support included.
                </p>

                <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
                  {[
                    { Icon: ShieldCheck, color: "text-emerald-400", title: "100% IP ownership", sub: "Full source code & rights" },
                    { Icon: Server, color: "text-sky-400", title: "Free 1-yr cloud hosting", sub: "Domain + SSL included" },
                    { Icon: Zap, color: "text-amber-400", title: "7–14 days delivery", sub: "Rapid agile deployment" },
                    { Icon: Headphones, color: "text-violet-400", title: "Dedicated tech lead", sub: "Priority SLA support" },
                  ].map(({ Icon, color, title, sub }) => (
                    <div key={title} className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left">
                      <Icon className={cn("h-5 w-5 shrink-0", color)} aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white">{title}</div>
                        <div className="text-[10px] text-gray-500">{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                  <Button
                    type="button"
                    size="lg"
                    className="h-12 rounded-xl bg-white px-7 font-bold text-black hover:bg-gray-200"
                    onClick={() => scrollTo(packagesRef.current)}
                  >
                    Choose a package <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-xl border-white/15 bg-transparent px-7 font-semibold text-white hover:bg-white/10 hover:text-white"
                    onClick={() => openCustom(true)}
                  >
                    Send a custom request
                  </Button>
                </div>
                <p className="text-xs text-gray-500">All prices are in INR and exclude {GST_LABEL}, which is added to your total at checkout.</p>
              </div>
            </div>
          </section>

          <PromoBanner offer={offer} appliedCoupon={summary.couponCode} hasSelection={summary.itemCount > 0} onApply={applyCoupon} />

          {/* ── PACKAGES ── */}
          <section ref={packagesRef} id="packages" className="container mx-auto scroll-mt-24 px-4 pb-6" aria-labelledby="step-packages">
            <div className="mb-6 flex flex-col gap-1">
              <p className="text-sm font-semibold text-indigo-400">Step 1</p>
              <h2 id="step-packages" className="text-2xl font-extrabold sm:text-3xl">
                Choose your package
              </h2>
            </div>

            {!loading && !error && packages.length > 0 && (
              <div className="mb-8 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                    <Input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search packages, features, technologies…"
                      aria-label="Search packages"
                      className="h-11 rounded-xl border-white/10 bg-[#111116] pl-10 pr-10 text-white placeholder:text-gray-500"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="pricing-sort" className="text-sm text-gray-400">
                      Sort by
                    </label>
                    <select
                      id="pricing-sort"
                      value={sort}
                      onChange={(e) => setSort(e.target.value as typeof sort)}
                      className="h-11 rounded-xl border border-white/10 bg-[#111116] px-3 text-sm text-white"
                    >
                      <option value="featured">Featured / popular</option>
                      <option value="price-asc">Price: low to high</option>
                      <option value="price-desc">Price: high to low</option>
                    </select>
                  </div>
                </div>

                {categories.length > 1 && (
                  <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="Filter packages by category">
                    {[ALL, ...categories].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        aria-pressed={category === c}
                        className={cn(
                          "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                          category === c ? "border-indigo-500 bg-indigo-600 text-white" : "border-white/10 text-gray-400 hover:border-white/25 hover:text-white"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500" aria-live="polite">
                  Showing {visiblePackages.length} package{visiblePackages.length === 1 ? "" : "s"}
                </p>
              </div>
            )}

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-[520px] rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : error ? (
              <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[#111116] p-8 text-center" role="alert">
                <AlertCircle className="mx-auto h-10 w-10 text-gray-500" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-white">{error}</h3>
                <p className="mt-1 text-sm text-gray-400">Check your connection and try again, or send us a custom request and we'll quote you directly.</p>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button type="button" variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => reload()}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Try again
                  </Button>
                  <Button type="button" onClick={() => openCustom(true)}>
                    Send a custom request
                  </Button>
                </div>
              </div>
            ) : packages.length === 0 ? (
              <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[#111116] p-8 text-center">
                <h3 className="font-semibold text-white">Packages are being updated</h3>
                <p className="mt-1 text-sm text-gray-400">Send us a custom request and we'll prepare a quote for you.</p>
                <Button type="button" className="mt-5" onClick={() => openCustom(true)}>
                  Send a custom request
                </Button>
              </div>
            ) : visiblePackages.length === 0 ? (
              <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[#111116] p-10 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-gray-500" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-bold text-white">No packages found</h3>
                <p className="mt-1 text-sm text-gray-400">Nothing matches your search. Try different keywords or reset the filters.</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    setQuery("");
                    setCategory(ALL);
                  }}
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visiblePackages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} selected={cart.packageId === pkg.id} onSelect={selectPackage} />
                ))}
              </div>
            )}
          </section>

          {/* ── ADD-ONS ── */}
          {!loading && !error && addons.length > 0 && (
            <section ref={addonsRef} id="addons" className="container mx-auto scroll-mt-24 px-4 pt-20" aria-labelledby="step-addons">
              <div className="mb-10 space-y-2 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Step 2 · Optional
                </div>
                <h2 id="step-addons" className="text-3xl font-extrabold sm:text-4xl">
                  Add-on <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">services &amp; upgrades</span>
                </h2>
                <p className="mx-auto max-w-xl text-sm text-gray-400">
                  Pick as many as you like. Items marked "Custom quote" are priced after we talk. Your plan is always one tap away at the bottom of the screen.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {addons.map((addon) => (
                  <AddonCard key={addon.id} addon={addon} selected={cart.addonIds.includes(addon.id)} onToggle={toggleAddon} />
                ))}
              </div>

              {summary.itemCount > 0 && (
                <div className="mt-10 flex justify-center">
                  <Button type="button" size="lg" className="h-12 rounded-xl bg-indigo-600 px-8 font-semibold text-white hover:bg-indigo-500" onClick={() => setDrawerOpen(true)}>
                    Review your plan ({summary.itemCount}) <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* ── CUSTOM REQUEST CTA ── */}
          <section className={cn("container mx-auto px-4 pt-20", summary.itemCount > 0 ? "pb-40" : "pb-20")}>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-[#0F172A]/70 p-8 text-center sm:p-12">
              <div className="mx-auto max-w-2xl space-y-4">
                <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white">Enterprise &amp; bespoke builds</span>
                <h2 className="text-3xl font-extrabold sm:text-4xl">Have a complex or custom requirement?</h2>
                <p className="text-sm leading-relaxed text-gray-300">
                  Full-scale SaaS platforms, specialised AI integration, payment gateways or bespoke cloud services — tell us what you need and our architects
                  will prepare a proper scope of work and quote.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <Button type="button" size="lg" className="h-12 rounded-xl bg-white px-8 font-bold text-black shadow-xl hover:bg-gray-200" onClick={() => openCustom(true)}>
                    Send a custom request
                  </Button>
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition-colors hover:border-white/25 hover:text-white"
                  >
                    General contact <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── CHECKOUT ── */}
      {view === "checkout" && (
        <main className="container mx-auto px-4 pb-24 pt-28 sm:pt-32">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold text-indigo-400">Step 3</p>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Your details</h1>
            <p className="mt-2 text-gray-400">Check your plan, tell us who you are and send the request. You'll get a confirmed scope and price before anything is charged.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <CheckoutForm
              summary={summary}
              onBack={() => goTo("build")}
              onSubmitted={(result) => {
                setSent(result);
                clearCart();
                goTo("sent");
              }}
            />
            {(() => {
              const panel = (
                <CartSummaryPanel
                  summary={summary}
                  onRemovePackage={() => setCart((c) => ({ ...c, packageId: null }))}
                  onRemoveAddon={toggleAddon}
                  coupon={<CouponBox offer={offer} summary={summary} onApply={applyCoupon} onClear={clearCoupon} />}
                />
              );
              return (
                <>
                  {/* Phones & tablets: collapsible order summary above the form */}
                  <details className="group order-first rounded-2xl border border-white/10 bg-[#111116] lg:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                      <span className="text-sm font-semibold">
                        Order summary <span className="font-normal text-gray-400">({summary.itemCount} item{summary.itemCount === 1 ? "" : "s"})</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-lg font-extrabold tabular-nums">{formatPrice(summary.total)}</span>
                        <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                      </span>
                    </summary>
                    <div className="border-t border-white/10 p-4">{panel}</div>
                  </details>
                  <aside className="hidden rounded-2xl border border-white/10 bg-[#111116] p-5 lg:sticky lg:top-28 lg:block">{panel}</aside>
                </>
              );
            })()}
          </div>
        </main>
      )}

      {/* ── CONFIRMATION ── */}
      {view === "sent" && sent && (
        <main className="container mx-auto px-4 pb-24 pt-28 sm:pt-32">
          <RequestSent result={sent} onStartOver={() => { setSent(null); goTo("build"); }} />
        </main>
      )}

      {/* Cart: bottom bar + drawer (all screen sizes) */}
      {inBuild && (
        <CartDrawer summary={summary} open={drawerOpen} onOpenChange={setDrawerOpen} onContinue={() => goTo("checkout")}>
          {drawerContent}
        </CartDrawer>
      )}

      {/* Custom request dialog */}
      <Dialog open={customOpen} onOpenChange={openCustom}>
        <DialogContent className="dark max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto border-white/10 bg-[#0E0E13] p-4 text-white sm:p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold">Custom request</DialogTitle>
            <DialogDescription className="text-gray-400">Tell us what you need and we'll reply with a tailored proposal, scope and price.</DialogDescription>
          </DialogHeader>
          <CustomRequestForm summary={summary} />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Pricing;
