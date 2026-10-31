import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

export interface GoalItem {
  id: string;
  title: string;
  category: 'academic' | 'wellness' | 'personal';
  completed: boolean;
  dueTime?: string;
}

const INITIAL_GOALS: GoalItem[] = [
  {
    id: 'g-1',
    title: 'Submit CS 161 Dynamic Programming Homework',
    category: 'academic',
    completed: true,
    dueTime: '11:59 PM',
  },
  {
    id: 'g-2',
    title: 'Read 2 chapters of Environmental Policy brief',
    category: 'academic',
    completed: false,
    dueTime: '02:00 PM',
  },
  {
    id: 'g-3',
    title: 'Hydration check: 2.0 Liters before 4 PM',
    category: 'wellness',
    completed: true,
  },
  {
    id: 'g-4',
    title: 'Schedule advising meeting for senior project',
    category: 'personal',
    completed: false,
    dueTime: '05:00 PM',
  },
];

interface DailyGoalsWidgetProps {
  onGoalsChange?: (completedCount: number, totalCount: number) => void;
}

export const DailyGoalsWidget: React.FC<DailyGoalsWidgetProps> = ({ onGoalsChange }) => {
  const [goals, setGoals] = useState<GoalItem[]>(() => {
    try {
      const saved = localStorage.getItem('rosewood_daily_goals');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_GOALS;
  });

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'academic' | 'wellness' | 'personal'>('academic');

  useEffect(() => {
    try {
      localStorage.setItem('rosewood_daily_goals', JSON.stringify(goals));
    } catch (e) {
      console.error(e);
    }
    const completed = goals.filter((g) => g.completed).length;
    onGoalsChange?.(completed, goals.length);
  }, [goals, onGoalsChange]);

  const toggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newGoal: GoalItem = {
      id: `g-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      completed: false,
    };
    setGoals((prev) => [newGoal, ...prev]);
    setNewTitle('');
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const progressPercent = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <Card elevated className="p-6">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>Daily Focus & Tasks</CardTitle>
          <CardDescription>
            {completedCount} of {goals.length} completed ({progressPercent}%)
          </CardDescription>
        </div>
        <Badge variant={progressPercent === 100 ? 'forest' : 'rose'} size="sm">
          {progressPercent === 100 ? 'All Completed' : 'In Progress'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="w-full bg-blush/40 h-2 rounded-full overflow-hidden">
          <div
            className="bg-forest h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quick Add Form */}
        <form onSubmit={addGoal} className="flex gap-2 pt-1">
          <Input
            placeholder="Add priority task (e.g. Read 20 pages CogSci)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="text-xs"
          />
          <Button type="submit" variant="primary" size="sm" className="shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </form>

        {/* Goals List */}
        <div className="space-y-2 pt-2">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="flex items-center justify-between p-3 rounded-xl border border-blush/70 bg-ivory-paper hover:bg-white transition-all group"
            >
              <div
                onClick={() => toggleGoal(goal.id)}
                className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
              >
                <button
                  type="button"
                  aria-label="Toggle goal"
                  className="text-forest shrink-0 focus:outline-none cursor-pointer"
                >
                  {goal.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-forest" />
                  ) : (
                    <div className="w-4 h-4 rounded border border-charcoal-faded group-hover:border-forest" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-medium truncate ${
                      goal.completed ? 'line-through text-charcoal-muted' : 'text-charcoal'
                    }`}
                  >
                    {goal.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] uppercase font-semibold ${
                        goal.category === 'academic'
                          ? 'text-forest'
                          : goal.category === 'wellness'
                          ? 'text-rose'
                          : 'text-gold'
                      }`}
                    >
                      {goal.category}
                    </span>
                    {goal.dueTime && (
                      <span className="text-[10px] text-charcoal-muted flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> Due {goal.dueTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteGoal(goal.id)}
                aria-label="Delete goal"
                className="opacity-0 group-hover:opacity-100 p-1 text-charcoal-muted hover:text-rose transition-opacity cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
