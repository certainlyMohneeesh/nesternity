// Configuration file to switch between email providers
// Change this value to switch email systems

export type EmailProvider = 'resend' | 'supabase-auth' | 'hybrid';

// 🎯 CHANGE THIS TO SWITCH EMAIL SYSTEMS:
export const EMAIL_PROVIDER: EmailProvider = 'resend'; // Switched back to working system

// Provider-specific configurations
export const EMAIL_CONFIG = {
  'resend': {
    name: 'Resend',
    free: false,
    description: 'Professional email service with excellent deliverability',
    cost: '100 emails/day free, then $20/month'
  },
  'supabase-auth': {
    name: 'Supabase Auth',
    free: true,
    description: 'Built-in Supabase email invites - completely free',
    cost: 'FREE'
  },
  'hybrid': {
    name: 'Hybrid (Auto-detect)',
    free: true,
    description: 'Try Supabase first, fallback to Resend if needed',
    cost: 'FREE when Supabase works'
  }
} as const;
