import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Coins, Save, Settings2 } from "lucide-react";

interface CoinConfig {
    key: string;
    value: string;
    description: string;
}

interface CoinConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CoinConfigDialog = ({ open, onOpenChange }: CoinConfigDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [configs, setConfigs] = useState<CoinConfig[]>([]);

    useEffect(() => {
        if (open) {
            fetchConfigs();
        }
    }, [open]);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_settings' as any)
                .select('*')
                .filter('key', 'ilike', '%reward%');

            if (error) throw error;

            // If no reward configs found, it might be the first time or filter too restrictive
            // Fetch all if reward-specific ones are missing
            if (!data || data.length === 0) {
                const { data: allData } = await supabase
                    .from('app_settings' as any)
                    .select('*');
                setConfigs(allData || []);
            } else {
                setConfigs(data);
            }
        } catch (error) {
            console.error('Error fetching configs:', error);
            toast.error('Failed to load coin configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateValue = (key: string, newValue: string) => {
        setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const config of configs) {
                const { error } = await supabase
                    .from('app_settings' as any)
                    .update({ value: config.value })
                    .eq('key', config.key);

                if (error) throw error;
            }
            toast.success('Coin configuration updated successfully');
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving configs:', error);
            toast.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Settings2 className="w-5 h-5 text-amber-400" />
                        Coin Rewards Configuration
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Configure how many coins are awarded for various user activities.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                        </div>
                    ) : configs.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No configuration keys found. Run the migration script first.</p>
                    ) : (
                        configs.map((config) => (
                            <div key={config.key} className="space-y-2 bg-white/5 p-3 rounded-lg border border-white/5 transition-colors hover:bg-white/10">
                                <div className="flex justify-between items-center">
                                    <Label className="text-sm font-bold text-amber-200 uppercase tracking-wider">
                                        {config.key.replace(/_/g, ' ')}
                                    </Label>
                                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-amber-500/30">
                                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                                        <Input
                                            type="number"
                                            value={config.value}
                                            onChange={(e) => handleUpdateValue(config.key, e.target.value)}
                                            className="w-16 h-7 bg-transparent border-none p-0 text-center text-amber-200 font-bold focus-visible:ring-0"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 italic">{config.description}</p>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/10">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Rewards Config
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
