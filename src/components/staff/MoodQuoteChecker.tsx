import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Heart, Smile, Meh, Frown, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MoodQuoteCheckerProps {
  userId: string;
  onMoodSubmitted: () => void;
}

const MoodQuoteChecker = ({ userId, onMoodSubmitted }: MoodQuoteCheckerProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [personalQuote, setPersonalQuote] = useState('');
  const [shareAnonymously, setShareAnonymously] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<any>(null);
  const [todayMoodEntry, setTodayMoodEntry] = useState<any>(null);
  const { toast } = useToast();

  const moods = [
    { id: 'happy', label: 'Happy', icon: Smile, color: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500/30' },
    { id: 'excited', label: 'Excited', icon: Zap, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/30' },
    { id: 'neutral', label: 'Neutral', icon: Meh, color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' },
    { id: 'sad', label: 'Sad', icon: Frown, color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30' },
    { id: 'stressed', label: 'Stressed', icon: Heart, color: 'text-orange-400', bgColor: 'bg-orange-500/20 border-orange-500/30' }
  ];

  useEffect(() => {
    fetchDailyQuote();
    checkTodayMoodEntry();
  }, [userId]);

  const fetchDailyQuote = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_quotes_staff')
        .select('*')
        .eq('is_system', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setDailyQuote(data);
    } catch (error) {
      console.error('Error fetching daily quote:', error);
    }
  };

  const checkTodayMoodEntry = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('user_mood_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking mood entry:', error);
        return;
      }

      setTodayMoodEntry(data);
    } catch (error) {
      console.error('Error checking mood entry:', error);
    }
  };

  const submitMoodAndQuote = async () => {
    if (!selectedMood) {
      toast({
        title: "Please select your mood",
        description: "We need to know how you're feeling today!",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate sentiment score based on mood
      const sentimentScores: Record<string, number> = {
        happy: 0.8,
        excited: 0.9,
        neutral: 0.0,
        sad: -0.7,
        stressed: -0.5
      };

      const { error } = await supabase
        .from('user_mood_entries')
        .insert({
          user_id: userId,
          mood: selectedMood as 'happy' | 'excited' | 'neutral' | 'sad' | 'stressed',
          personal_quote: personalQuote || null,
          share_anonymously: shareAnonymously,
          sentiment_score: sentimentScores[selectedMood] || 0
        });

      if (error) throw error;

      // Award points for mood check-in
      await supabase
        .from('user_points_log')
        .insert({
          user_id: userId,
          points: personalQuote ? 15 : 10,
          reason: personalQuote ? 'Daily Mood & Quote Submission' : 'Daily Mood Check-in',
          category: 'mood_checkin'
        });

      toast({
        title: "Mood & Quote Submitted!",
        description: `Thanks for sharing! You earned ${personalQuote ? 15 : 10} points.`,
      });

      onMoodSubmitted();
      checkTodayMoodEntry();
    } catch (error) {
      console.error('Error submitting mood:', error);
      toast({
        title: "Error",
        description: "Failed to submit mood entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (todayMoodEntry) {
    const mood = moods.find(m => m.id === todayMoodEntry.mood);
    const MoodIcon = mood?.icon || Smile;
    
    return (
      <Card className={mood?.bgColor || "bg-blue-500/20 border-blue-500/30"}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <MoodIcon className={`w-12 h-12 ${mood?.color}`} />
            <div>
              <h3 className="text-lg font-semibold text-white">Today's Mood Recorded!</h3>
              <p className="text-blue-300">
                You're feeling {mood?.label.toLowerCase()} today
              </p>
              {todayMoodEntry.personal_quote && (
                <p className="text-white/80 mt-2 italic">
                  "{todayMoodEntry.personal_quote}"
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Daily Inspiration & Mood Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Quote */}
        {dailyQuote && (
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-lg border border-blue-500/30">
            <p className="text-white italic text-lg mb-2">"{dailyQuote.content}"</p>
            <p className="text-blue-300 text-sm">— {dailyQuote.author}</p>
          </div>
        )}

        {/* Mood Selection */}
        <div>
          <Label className="text-white text-base mb-4 block">How are you feeling today?</Label>
          <div className="grid grid-cols-5 gap-2">
            {moods.map((mood) => {
              const Icon = mood.icon;
              const isSelected = selectedMood === mood.id;
              return (
                <Button
                  key={mood.id}
                  variant="outline"
                  className={`flex flex-col items-center gap-2 p-4 h-auto transition-all ${
                    isSelected 
                      ? `${mood.bgColor} border-2 scale-105` 
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                  onClick={() => setSelectedMood(mood.id)}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? mood.color : 'text-white/60'}`} />
                  <span className={`text-xs ${isSelected ? 'text-white font-medium' : 'text-white/60'}`}>
                    {mood.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Personal Quote */}
        <div className="space-y-3">
          <Label className="text-white text-base">Share your own quote or reflection (optional)</Label>
          <Textarea
            placeholder="What's inspiring you today? Share a quote, thought, or reflection..."
            value={personalQuote}
            onChange={(e) => setPersonalQuote(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
            rows={3}
          />
          
          <div className="flex items-center space-x-2">
            <Switch
              id="share-anonymous"
              checked={shareAnonymously}
              onCheckedChange={setShareAnonymously}
            />
            <Label htmlFor="share-anonymous" className="text-white/80">
              Share my quote anonymously with the team
            </Label>
          </div>
        </div>

        <Button
          onClick={submitMoodAndQuote}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          size="lg"
        >
          {isSubmitting ? "Submitting..." : "🌟 Submit Mood & Continue to Dashboard"}
        </Button>

        <p className="text-xs text-white/60 text-center">
          Complete your daily check-in to unlock the dashboard and earn points!
        </p>
      </CardContent>
    </Card>
  );
};

export default MoodQuoteChecker;