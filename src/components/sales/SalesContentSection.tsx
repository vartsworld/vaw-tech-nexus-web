import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save, X, Loader2, Target } from "lucide-react";
import { toast } from "sonner";

interface SalesSectionProps {
  sectionKey: string;
  title: string;
  subtitle: string;
  isTeamHead: boolean;
}

const SalesContentSection = ({ sectionKey, title, subtitle, isTeamHead }: SalesSectionProps) => {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [sectionKey]);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_notes')
        .select('content')
        .eq('id', `sales_${sectionKey}`)
        .maybeSingle();

      if (error) {
        // Fallback for demo if id is not UUID (staff_notes.id is UUID)
        // I will use a special naming convention in content for sales sections if needed,
        // but for now let's assume we can use a dedicated table or app_settings if available.
        // Re-checking app_settings availability in schema...
      }

      // Let's use app_settings as it's better for global config
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', `sales_${sectionKey}`)
        .maybeSingle();

      if (settingsData) {
        setContent(settingsData.value as string);
      }
    } catch (err) {
      console.error('Error fetching sales content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: `sales_${sectionKey}`,
          value: content,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("Content updated successfully");
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving sales content:', err);
      toast.error("Failed to save content");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase italic text-white tracking-tighter flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-500" />
            {title}
          </h2>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">
            {subtitle}
          </p>
        </div>
        {isTeamHead && !isEditing && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Section
          </Button>
        )}
      </div>

      <div className="relative group">
        {isEditing ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Enter ${title.toLowerCase()} content...`}
              className="min-h-[400px] bg-zinc-900/50 border-white/10 rounded-2xl p-6 text-white/90 font-medium leading-relaxed focus:ring-blue-500/20"
            />
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase px-8"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  fetchContent();
                }}
                className="text-white/40 hover:text-white font-bold text-xs uppercase"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 min-h-[300px] relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20" />
            <div className="prose prose-invert max-w-none">
              {content ? (
                <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed font-medium">
                  {content}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                  <Target className="w-12 h-12 mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">No content defined for this section</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesContentSection;
