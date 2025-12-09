'use client';

import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldContent, FieldSet } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { MapPin, Globe } from 'lucide-react';

// Timezone to country mapping
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Kolkata': 'India',
  'Asia/Calcutta': 'India',
  'America/New_York': 'United States',
  'America/Chicago': 'United States',
  'America/Denver': 'United States',
  'America/Los_Angeles': 'United States',
  'Europe/London': 'United Kingdom',
  'Europe/Paris': 'France',
  'Europe/Berlin': 'Germany',
  'Asia/Dubai': 'United Arab Emirates',
  'Asia/Singapore': 'Singapore',
  'Asia/Tokyo': 'Japan',
  'Australia/Sydney': 'Australia',
};

// Common timezones for select dropdown
const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India (IST)', country: 'India' },
  { value: 'America/New_York', label: 'New York (EST/EDT)', country: 'United States' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)', country: 'United States' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', country: 'United States' },
  { value: 'Europe/London', label: 'London (GMT/BST)', country: 'United Kingdom' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', country: 'France' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', country: 'Germany' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', country: 'United Arab Emirates' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', country: 'Singapore' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', country: 'Japan' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)', country: 'Australia' },
];

export function PreferencesForm({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    weekStart: settings?.weekStart || 'monday',
    timezone: settings?.timezone || 'Asia/Kolkata',
    country: settings?.country || 'India',
  });

  // Detect browser timezone on mount
  useEffect(() => {
    if (!settings?.timezone) {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const detectedCountry = TIMEZONE_TO_COUNTRY[browserTimezone] || 'India';
      
      setForm(prev => ({
        ...prev,
        timezone: browserTimezone,
        country: detectedCountry,
      }));
    }
  }, [settings]);

  // Update country when timezone changes
  const handleTimezoneChange = (newTimezone: string) => {
    const detectedCountry = TIMEZONE_TO_COUNTRY[newTimezone] || form.country;
    setForm(prev => ({
      ...prev,
      timezone: newTimezone,
      country: detectedCountry,
    }));
  };

  return (
    <FieldSet>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <Field>
          <FieldLabel className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Timezone
          </FieldLabel>
          <FieldContent>
            <Select
              value={form.timezone}
              onValueChange={handleTimezoneChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {COMMON_TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Your timezone is used for date/time displays and payment routing
            </p>
          </FieldContent>
        </Field>
      </div>

      <Field>
        <FieldLabel className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Country/Region
        </FieldLabel>
        <FieldContent>
          <Input
            value={form.country}
            onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
            placeholder="India"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Auto-detected from timezone. This helps route payments correctly (UPI for India, Dodo Payments for international).
          </p>
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
