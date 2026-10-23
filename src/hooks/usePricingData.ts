import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  inferCategory,
  toNumber,
  type PricingAddon,
  type PricingPackage,
  type PromotionalOffer,
} from "@/lib/pricing";

interface PricingData {
  packages: PricingPackage[];
  addons: PricingAddon[];
  offer: PromotionalOffer | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Loads the public price list (packages, add-ons, promo) and keeps it in sync
 * with changes made from the HR "Pricing Manager" in real time.
 */
export const usePricingData = (): PricingData => {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [addons, setAddons] = useState<PricingAddon[]>([]);
  const [offer, setOffer] = useState<PromotionalOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [pkgRes, addonRes, offerRes] = await Promise.all([
        supabase.from("pricing_packages").select("*").eq("is_enabled", true).order("sort_order"),
        supabase.from("pricing_addons").select("*").eq("is_enabled", true).order("sort_order"),
        supabase.from("app_settings").select("value").eq("key", "pricing_promotional_offer").maybeSingle(),
      ]);

      if (pkgRes.error) throw pkgRes.error;
      if (addonRes.error) throw addonRes.error;

      setPackages(
        (pkgRes.data ?? []).map((pkg) => {
          const description = pkg.description || "";
          return {
            id: pkg.id,
            name: pkg.name,
            slug: pkg.slug ?? undefined,
            description,
            originalPrice: toNumber(pkg.original_price),
            price: toNumber(pkg.discount_price),
            popular: !!pkg.is_popular,
            features: Array.isArray(pkg.features) ? pkg.features : [],
            category: inferCategory(pkg.name, description),
          };
        })
      );

      setAddons(
        (addonRes.data ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          slug: a.slug ?? undefined,
          description: a.description || "",
          price: toNumber(a.price),
        }))
      );

      const value = offerRes.data?.value as unknown as PromotionalOffer | undefined;
      setOffer(value && typeof value === "object" ? value : null);
      setError(null);
    } catch (err) {
      console.error("Error fetching pricing data:", err);
      setError("We couldn't load our latest prices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel("public-pricing-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pricing_packages" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "pricing_addons" }, load)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: "key=eq.pricing_promotional_offer" },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { packages, addons, offer, loading, error, reload: load };
};
