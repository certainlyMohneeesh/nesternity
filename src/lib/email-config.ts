// Configuration file to switch between email providers
// Change this value to switch email systems

export type EmailProvider = 'zeptomail' | 'supabase-auth' | 'hybrid';

// 🎯 CHANGE THIS TO SWITCH EMAIL SYSTEMS:
export const EMAIL_PROVIDER: EmailProvider = 'zeptomail'; // Using Zoho ZeptoMail

// Provider-specific configurations
export const EMAIL_CONFIG = {
  'zeptomail': {
    name: 'Zoho ZeptoMail',
    free: false,
    description: 'Professional transactional email service by Zoho with excellent deliverability',
    cost: '10,000 emails free, then pay-as-you-go'
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
    description: 'Try Supabase first, fallback to ZeptoMail if needed',
    cost: 'FREE when Supabase works'
  }
} as const;
