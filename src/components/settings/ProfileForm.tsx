import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldContent, FieldSet } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

export function ProfileForm({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    displayName: settings.displayName || '',
    email: settings.email || '',
    avatarUrl: settings.avatarUrl || '',
  });

  return (
    <FieldSet>
      <div className="grid grid-cols-2 gap-4">
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
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </FieldContent>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="avatarUrl">Avatar URL</FieldLabel>
        <FieldContent>
          <Input
            id="avatarUrl"
            type="url"
            value={form.avatarUrl}
            onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
            placeholder="https://example.com/avatar.jpg"
          />
        </FieldContent>
      </Field>

      <div className="flex items-center">
        <Button onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </FieldSet>
  );
}
