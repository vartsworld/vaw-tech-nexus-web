import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowRight, RefreshCw, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { usePricingData } from "@/hooks/usePricingData";
import PackageCard from "@/components/pricing/PackageCard";
import AddonCard from "@/components/pricing/AddonCard";
import CartSummaryPanel from "@/components/pricing/CartSummaryPanel";
import CheckoutForm, { type SubmittedPlan } from "@/components/pricing/CheckoutForm";
import CustomRequestForm from "@/components/pricing/CustomRequestForm";
import RequestSent from "@/components/pricing/RequestSent";
import PromoBanner from "@/components/pricing/PromoBanner";
import { CONTACT_EMAIL } from "@/lib/inquiries";
import { EMPTY_CART, formatPrice, loadCart, saveCart, summarizeCart, type CartState } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type View = "build" | "checkout" | "sent";
const ALL = "All";

const Pricing = () => {
  const { packages, addons, offer, loading, error, reload } = usePricingData();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cart, setCart] = useState<CartState>(() => loadCart());
  const [view, setView] = useState<View>("build");
  const [sent, setSent] = useState<SubmittedPlan | null>(null);
  const [tab, setTab] = useState<"build" | "custom">(searchParams.get("tab") === "custom" ? "custom" : "build");
  const [category, setCategory] = useState(ALL);
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [sheetOpen, setSheetOpen] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
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

  const summary = useMemo(() => summarizeCart(cart, packages, addons), [cart, packages, addons]);

  /* If the cart empties while on the checkout step, go back */
  useEffect(() => {
    if (view === "checkout" && summary.itemCount === 0) setView("build");
  }, [view, summary.itemCount]);

  const scrollToTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goTo = (next: View) => {
    setView(next);
    setSheetOpen(false);
    requestAnimationFrame(scrollToTop);
  };

  const changeTab = (value: string) => {
    const next = value === "custom" ? "custom" : "build";
    setTab(next);
    const params = new URLSearchParams(searchParams);
    if (next === "custom") params.set("tab", "custom");
    else params.delete("tab");
    setSearchParams(params, { replace: true });
  };

  /* ── cart actions ── */
  const togglePackage = useCallback((id: string) => setCart((c) => ({ ...c, packageId: c.packageId === id ? null : id })), []);
  const toggleAddon = useCallback(
    (id: string) =>
      setCart((c) => ({ ...c, addonIds: c.addonIds.includes(id) ? c.addonIds.filter((x) => x !== id) : [...c.addonIds, id] })),
    []
  );
  const applyCoupon = (code: string) => {
    setCart((c) => ({ ...c, coupon: code }));
    toast({ title: "Coupon added", description: `${code} will be included with your request.` });
  };
  const clearCart = () => setCart(EMPTY_CART);

  /* ── filtering ── */
  const categories = useMemo(() => Array.from(new Set(packages.map((p) => p.category))), [packages]);
  const visiblePackages = useMemo(() => {
    const list = category === ALL ? [...packages] : packages.filter((p) => p.category === category);
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => Number(b.popular) - Number(a.popular));
    return list;
  }, [packages, category, sort]);

  const canContinue = summary.itemCount > 0;

  const continueButton = (
    <Button type="button" size="lg" className="w-full font-semibold" disabled={!canContinue} onClick={() => goTo("checkout")}>
      Continue to details <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Button>
  );

  const customLink = (
    <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
      Need something that isn't listed?{" "}
      <button
        type="button"
        className="font-semibold text-foreground underline underline-offset-2 hover:text-brand"
        onClick={() => {
          setSheetOpen(false);
          changeTab("custom");
          requestAnimationFrame(scrollToTop);
        }}
      >
        Send a custom request
      </button>
    </p>
  );

  const cartPanel = (
    <CartSummaryPanel
      summary={summary}
      coupon={cart.coupon}
      onRemovePackage={() => setCart((c) => ({ ...c, packageId: null }))}
      onRemoveAddon={toggleAddon}
      onClearCoupon={() => setCart((c) => ({ ...c, coupon: "" }))}
      onClear={clearCart}
      action={continueButton}
      footer={customLink}
    />
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Pricing & Packages | VAW Technologies"
        description="Pick a website, web app or AI package, add the extras you need and send us your request. Clear one-time prices from VAW Technologies, Kerala."
        keywords="web development pricing, website cost Kerala, web app cost, e-commerce development pricing, VAW Technologies packages"
        ogImage="/og/pricing.png"
      />
      <Navbar />

      <main className={cn("pt-28 md:pt-36", view === "build" && tab === "build" && summary.itemCount > 0 ? "pb-32 lg:pb-20" : "pb-20")}>
        <div ref={topRef} className="container mx-auto px-4 sm:px-8 scroll-mt-24">
          <header className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground">Build your plan</h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Choose a package, add whatever extras you need, then send us your details. You'll get a confirmed scope and price before anything is
              charged.
            </p>
          </header>

          <div className="mt-8 space-y-8">
            <PromoBanner offer={offer} appliedCoupon={cart.coupon} onApply={applyCoupon} />

            <Tabs value={tab} onValueChange={changeTab}>
              <TabsList className="h-auto w-full justify-start gap-1 sm:w-auto">
                <TabsTrigger value="build" className="flex-1 sm:flex-none px-4 py-2">
                  Packages &amp; add-ons
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex-1 sm:flex-none px-4 py-2">
                  Custom request
                </TabsTrigger>
              </TabsList>

              {/* ───────────── BUILD ───────────── */}
              <TabsContent value="build" className="mt-8 focus-visible:outline-none">
                {view === "sent" && sent ? (
                  <RequestSent
                    result={sent}
                    onStartOver={() => {
                      clearCart();
                      setSent(null);
                      goTo("build");
                    }}
                  />
                ) : view === "checkout" ? (
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
                    <CheckoutForm
                      summary={summary}
                      coupon={cart.coupon}
                      onBack={() => goTo("build")}
                      onSubmitted={(result) => {
                        setSent(result);
                        goTo("sent");
                      }}
                    />
                    <div className="lg:sticky lg:top-28 order-first lg:order-none">
                      <CartSummaryPanel summary={summary} coupon={cart.coupon} />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                    <div className="space-y-14 min-w-0">
                      {/* Step 1 */}
                      <section aria-labelledby="step-packages">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-brand">Step 1</p>
                            <h2 id="step-packages" className="text-2xl font-bold text-foreground">
                              Choose a package
                            </h2>
                          </div>
                          {!loading && !error && packages.length > 1 && (
                            <div className="flex items-center gap-2">
                              <label htmlFor="pricing-sort" className="text-sm text-muted-foreground">
                                Sort
                              </label>
                              <select
                                id="pricing-sort"
                                value={sort}
                                onChange={(e) => setSort(e.target.value as typeof sort)}
                                className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                              >
                                <option value="featured">Featured</option>
                                <option value="price-asc">Price: low to high</option>
                                <option value="price-desc">Price: high to low</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {!loading && !error && categories.length > 1 && packages.length > 3 && (
                          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter packages by category">
                            {[ALL, ...categories].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setCategory(c)}
                                aria-pressed={category === c}
                                className={cn(
                                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                                  category === c
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                                )}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="mt-6">
                          {loading ? (
                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
                              {[0, 1, 2].map((i) => (
                                <Skeleton key={i} className="h-[420px] rounded-xl" />
                              ))}
                            </div>
                          ) : error ? (
                            <div className="rounded-xl border border-border bg-card p-8 text-center" role="alert">
                              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                              <h3 className="mt-3 font-semibold text-foreground">{error}</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Check your connection and try again, or send us a custom request and we'll quote you directly.
                              </p>
                              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                                <Button type="button" variant="outline" onClick={() => reload()}>
                                  <RefreshCw className="h-4 w-4" /> Try again
                                </Button>
                                <Button type="button" onClick={() => changeTab("custom")}>
                                  Send a custom request
                                </Button>
                              </div>
                            </div>
                          ) : packages.length === 0 ? (
                            <div className="rounded-xl border border-border bg-card p-8 text-center">
                              <h3 className="font-semibold text-foreground">Packages are being updated</h3>
                              <p className="mt-1 text-sm text-muted-foreground">Send us a custom request and we'll prepare a quote for you.</p>
                              <Button type="button" className="mt-5" onClick={() => changeTab("custom")}>
                                Send a custom request
                              </Button>
                            </div>
                          ) : (
                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                              {visiblePackages.map((pkg) => (
                                <PackageCard key={pkg.id} pkg={pkg} selected={cart.packageId === pkg.id} onToggle={togglePackage} />
                              ))}
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Step 2 */}
                      {!loading && !error && addons.length > 0 && (
                        <section aria-labelledby="step-addons">
                          <p className="text-sm font-semibold text-brand">Step 2 · Optional</p>
                          <h2 id="step-addons" className="text-2xl font-bold text-foreground">
                            Add extras
                          </h2>
                          <p className="mt-1.5 text-sm text-muted-foreground">Add as many as you like. Items marked “Quote” are priced after we talk.</p>
                          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {addons.map((addon) => (
                              <AddonCard key={addon.id} addon={addon} selected={cart.addonIds.includes(addon.id)} onToggle={toggleAddon} />
                            ))}
                          </div>
                        </section>
                      )}
                    </div>

                    {/* Cart – desktop */}
                    <div className="hidden lg:block lg:sticky lg:top-28">{cartPanel}</div>
                  </div>
                )}
              </TabsContent>

              {/* ───────────── CUSTOM ───────────── */}
              <TabsContent value="custom" className="mt-8 focus-visible:outline-none">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                  <CustomRequestForm summary={summary} />
                  <aside className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground leading-relaxed">
                    <h2 className="text-base font-bold text-foreground">What happens next</h2>
                    <ol className="mt-3 list-decimal space-y-2 pl-5">
                      <li>We read your request and ask any follow-up questions.</li>
                      <li>You receive a tailored proposal with scope, timeline and price.</li>
                      <li>You approve it, and we get started.</li>
                    </ol>
                    <p className="mt-4 border-t border-border pt-4">
                      Prefer to talk? Email{" "}
                      <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground underline underline-offset-2">
                        {CONTACT_EMAIL}
                      </a>
                      .
                    </p>
                  </aside>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Cart – mobile bottom bar + sheet */}
      {tab === "build" && view === "build" && summary.itemCount > 0 && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
            <div className="mx-auto flex max-w-xl items-center gap-3">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                aria-label="Review your plan"
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <ShoppingBag className="h-5 w-5 text-foreground" aria-hidden="true" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                    {summary.itemCount}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-muted-foreground">Estimated total</span>
                  <span className="block truncate text-lg font-extrabold tabular-nums text-foreground">{formatPrice(summary.subtotal)}</span>
                </span>
              </button>
              <Button type="button" className="shrink-0 font-semibold" onClick={() => goTo("checkout")}>
                Continue
              </Button>
            </div>
          </div>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-4 pb-6">
              <SheetHeader className="text-left">
                <SheetTitle className="sr-only">Your plan</SheetTitle>
                <SheetDescription className="sr-only">Review the items in your plan before continuing.</SheetDescription>
              </SheetHeader>
              <div className="mt-2">{cartPanel}</div>
            </SheetContent>
          </Sheet>
        </>
      )}

      <Footer />
    </div>
  );
};

export default Pricing;
