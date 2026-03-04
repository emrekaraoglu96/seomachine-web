"use client";

import { useState, useEffect } from "react";
import { useProject } from "@/hooks/use-project";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { TONE_OPTIONS } from "@/lib/tone-options";

export default function SettingsPage() {
  const { project, loading: projectLoading, refetch } = useProject();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    company_url: "",
    industry: "",
    target_audience: "",
    tone_of_voice: "Professional",
    tone_description: "",
  });
  const supabase = createClient();

  useEffect(() => {
    if (project) {
      setForm({
        company_name: project.company_name,
        company_url: project.company_url || "",
        industry: project.industry || "",
        target_audience: project.target_audience || "",
        tone_of_voice: project.tone_of_voice,
        tone_description: project.tone_description || "",
      });
    }
  }, [project]);

  async function handleSave() {
    if (!project) return;
    setSaving(true);

    const { error } = await supabase
      .from("projects")
      .update(form)
      .eq("id", project.id);

    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Settings saved");
      await refetch();
    }
    setSaving(false);
  }

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Update your brand voice and company info
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
          <CardDescription>Basic company information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={form.company_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, company_name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_url">Website</Label>
            <Input
              id="company_url"
              value={form.company_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, company_url: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={form.industry}
              onChange={(e) =>
                setForm((f) => ({ ...f, industry: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audience & Voice</CardTitle>
          <CardDescription>
            This context shapes how your articles are written
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target_audience">Target Audience</Label>
            <Textarea
              id="target_audience"
              value={form.target_audience}
              onChange={(e) =>
                setForm((f) => ({ ...f, target_audience: e.target.value }))
              }
              rows={3}
            />
          </div>
          <div className="space-y-3">
            <Label>Tone of Voice</Label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((tone) => (
                <Badge
                  key={tone.label}
                  variant={form.tone_of_voice === tone.label ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() =>
                    setForm((f) => ({ ...f, tone_of_voice: tone.label }))
                  }
                >
                  {tone.label}
                </Badge>
              ))}
            </div>
            <div className="bg-muted/50 border rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Example of {form.tone_of_voice.toLowerCase()} tone:
              </p>
              <p className="text-sm italic text-foreground/80">
                {TONE_OPTIONS.find((t) => t.label === form.tone_of_voice)?.example}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tone_description">Tone Notes</Label>
            <Textarea
              id="tone_description"
              value={form.tone_description}
              onChange={(e) =>
                setForm((f) => ({ ...f, tone_description: e.target.value }))
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save Changes
      </Button>
    </div>
  );
}
