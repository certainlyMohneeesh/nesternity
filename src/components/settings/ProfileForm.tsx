import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldContent, FieldSet } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

export function ProfileForm({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    displayName: settings.displayName || '',
  });

  return (
    <FieldSet>
      <div className="space-y-6">
        <Field>
          <FieldLabel htmlFor="displayName">Display Name</FieldLabel>
          <FieldContent>
            <Input
              id="displayName"
              value={form.displayName}
              onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
              placeholder="Your display name"
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email Address</FieldLabel>
          <FieldContent>
            <Input
              id="email"
              type="email"
              value={settings.email}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed
            </p>
          </FieldContent>
        </Field>
      </div>

      <div className="flex items-center pt-4">
        <Button onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </FieldSet>
  );
}
