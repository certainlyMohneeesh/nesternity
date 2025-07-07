import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export function PreferencesForm({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    theme: settings.theme,
    weekStart: settings.weekStart,
    timezone: settings.timezone,
  });
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(form.theme);
  }, [form.theme, setTheme]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select
            value={form.theme}
            onValueChange={value => setForm(f => ({ ...f, theme: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" /> Light
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" /> Dark
                </div>
              </SelectItem>
              <SelectItem value="system">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" /> System
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
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
