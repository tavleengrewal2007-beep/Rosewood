import React from 'react';
import { Feather, ArrowRight, Flame, Sparkles, Mic } from 'lucide-react';
import { useSva } from '../../context/SvaContext';
import { useNavigation } from '../../context/NavigationContext';
import { SVA_MOODS, SVA_PROMPTS } from '../../types/sva';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const SvaDashboardCard: React.FC = () => {
  const { entries, streakDays, totalVoiceNotes } = useSva();
  const { setActiveModule } = useNavigation();

  const latestEntry = entries[0];
  const latestMood = latestEntry
    ? SVA_MOODS.find((m) => m.id === latestEntry.mood)
    : undefined;
  const todayPrompt = SVA_PROMPTS[new Date().getDate() % SVA_PROMPTS.length];

  return (
    <Card elevated className="border-blush/90 bg-gradient-to-br from-white to-rose-soft/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose/15 text-rose flex items-center justify-center">
              <Feather className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">SVA Reflection</CardTitle>
              <span className="text-[11px] text-charcoal-muted font-medium">
                Text & voice journaling ({totalVoiceNotes} voice)
              </span>
            </div>
          </div>
          <Badge variant="gold" size="sm">
            <Flame className="w-3 h-3 mr-1 text-rose inline" />
            {streakDays}d Streak
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        <div className="p-3 rounded-xl bg-ivory-paper border border-blush/70 text-xs">
          <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-forest flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3 text-gold" />
            Today’s SVA Prompt
          </span>
          <p className="italic text-charcoal leading-relaxed">"{todayPrompt}"</p>
        </div>

        {latestEntry && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-heading font-semibold text-charcoal-muted">
                Latest Entry
              </span>
              {latestMood && (
                <Badge variant={latestMood.badgeVariant} size="sm">
                  {latestMood.label}
                </Badge>
              )}
            </div>
            <p className="text-xs font-semibold text-charcoal truncate">{latestEntry.title}</p>
            <p className="text-xs text-charcoal-muted line-clamp-2 leading-relaxed">
              {latestEntry.content || 'Saved audio reflection'}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          leftIcon={<Mic className="w-3.5 h-3.5 text-rose" />}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={() => setActiveModule('sva')}
        >
          Write or Record in SVA
        </Button>
      </CardFooter>
    </Card>
  );
};
