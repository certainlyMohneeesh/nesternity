import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldContent, FieldSet } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';

export function PreferencesForm({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    // theme: 'light', // Force light as the only option
    weekStart: settings.weekStart,
    timezone: settings.timezone,
  });

  return (
    <FieldSet>
      <div className="grid grid-cols-2 gap-4">
        {/* <Field>
          <FieldLabel>Theme</FieldLabel>
          <FieldContent>
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
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">Dark mode coming soon</span>
          </FieldContent>
        </Field> */}
        <Field>
          <FieldLabel>Week starts on</FieldLabel>
          <FieldContent>
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
          </FieldContent>
        </Field>
      </div>

      <Field>
        <FieldLabel>Timezone</FieldLabel>
        <FieldContent>
          <Input
            value={form.timezone}
            onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
            placeholder="America/New_York"
          />
        </FieldContent>
      </Field>

      <div className="flex items-center">
        <Button onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </FieldSet>
  );
}
