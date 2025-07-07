import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export function PreferencesForm({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    theme: 'light', // Force light as the only option
    weekStart: settings.weekStart,
    timezone: settings.timezone,
  });
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select value="light" disabled>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" /> Light
          </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
            Dark mode coming soon
          </span>
        </div>
        <div className="space-y-2">
          <Label>Week starts on</Label>
          <Select
            value={form.weekStart}
            onValueChange={value => setForm(f => ({ ...f, weekStart: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Timezone</Label>
        <Input
          value={form.timezone}
          onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
          placeholder="America/New_York"
        />
      </div>
      <Button onClick={() => onSave(form)} disabled={saving}>
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  );
}
