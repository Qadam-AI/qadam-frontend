"use client";

import { Info, Target, TrendingUp, Lightbulb } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WhyThisTaskDrawerProps {
  conceptName: string;
  difficulty: number;
  reason: string;
  mastery?: number;
}

export function WhyThisTaskDrawer({
  conceptName,
  difficulty,
  reason,
  mastery,
}: WhyThisTaskDrawerProps) {
  const getMasteryLevel = (m: number) => {
    if (m < 0.3) return "Beginner";
    if (m < 0.6) return "Intermediate";
    return "Advanced";
  };

  const getDifficultyColor = (d: number) => {
    if (d <= 2) return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (d <= 3) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    return "bg-red-500/10 text-red-600 dark:text-red-400";
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          Why this task?
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Task Selection Reasoning
          </SheetTitle>
          <SheetDescription>
            Understanding how your adaptive learning path works
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Concept Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Concept Focus
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="font-semibold text-lg">{conceptName}</div>
              {mastery !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Your mastery:
                  </span>
                  <Badge variant="secondary">
                    {Math.round(mastery * 100)}%
                  </Badge>
                  <Badge variant="outline">{getMasteryLevel(mastery)}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Difficulty Level
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <Badge className={getDifficultyColor(difficulty)}>
                  Level {difficulty}/5
                </Badge>
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${(difficulty / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                This difficulty is calculated based on your current mastery level to
                keep you in the optimal learning zone.
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4 text-purple-500" />
              Why This Task
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm leading-relaxed">{reason}</p>
            </div>
          </div>

          {/* Learning Path Info */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <h4 className="font-medium text-sm mb-2">🧠 Adaptive Learning</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Edusistent continuously adapts to your progress. Each task is selected to
              maximize your learning efficiency, focusing on your weakest concepts
              while adjusting difficulty to keep you engaged.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

