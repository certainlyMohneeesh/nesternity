import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { getCurrencySymbol, formatCurrency, replaceSymbolWithCurrencyCode } from '@/lib/utils'

// Register Roboto font for Unicode symbol support (Industry Standard)
// This ensures currency symbols like ₹, €, £, ¥ display correctly
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-lightitalic-webfont.ttf',
      fontWeight: 300,
      fontStyle: 'italic',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf',
      fontWeight: 400,
      fontStyle: 'italic',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-mediumitalic-webfont.ttf',
      fontWeight: 500,
      fontStyle: 'italic',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bolditalic-webfont.ttf',
      fontWeight: 700,
      fontStyle: 'italic',
    },
  ],
})

interface ProposalProps {
  proposal: {
    id: string
    title: string
    createdAt: Date | string
    pricing: number
    currency: string
    paymentTerms?: string | null
    brief: string
    deliverables: any
    timeline: any
    client: {
      name: string
      email: string
      company?: string | null
      address?: string | null
      phone?: string | null
    }
    project?: {
      name: string
      description?: string | null
    } | null
    signatures?: Array<{
      signerName: string
      signerEmail: string
      signerTitle?: string | null
      signatureBlob: string
      signedAt: Date | string
    }>
  }
}

// LOGO CDN URL - Replace this with your Cloudflare CDN URL after setup
const LOGO_URL = 'https://scmyzihaokadwwszaimd.supabase.co/storage/v1/object/public/nesternity-assets/nesternity_l.png' // Update this!

// Get locale for currency formatting
const getCurrencyLocale = (currency: string): string => {
  const localeMap: Record<string, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    AUD: 'en-AU',
    CAD: 'en-CA',
    SGD: 'en-SG',
    HKD: 'zh-HK',
    NZD: 'en-NZ',
    BRL: 'pt-BR',
    MXN: 'es-MX',
    KRW: 'ko-KR',
  }
  return localeMap[currency.toUpperCase()] || 'en-US'
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 50,
    fontFamily: 'Roboto',
  },
  // Hero Header
  hero: {
    marginBottom: 40,
    paddingBottom: 25,
    borderBottomWidth: 3,
    borderBottomColor: '#2563eb',
  },
  logo: {
    width: 160,
    height: 45,
    objectFit: 'contain',
    objectPosition: 'left center',
    marginBottom: 20,
    marginLeft: 0,
  },
  titleRow: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 15,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 12,
    lineHeight: 1.4,
    textAlign: 'center',
    maxWidth: '90%',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 1.6,
    marginBottom: 4,
    textAlign: 'center',
  },
  pricingBox: {
    backgroundColor: '#eff6ff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
  },
  pricingLabel: {
    fontSize: 10,
    color: '#1e40af',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  pricingAmount: {
    fontSize: 40,
    fontWeight: 700,
    color: '#2563eb',
    letterSpacing: -1,
    fontFamily: 'Roboto',
  },
  // Section Styles
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  // Client Info Card
  infoCard: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 30,
  },
  infoColumn: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 11,
    color: '#1f2937',
    fontWeight: '500',
  },
  // Project Brief
  textContent: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.8,
    textAlign: 'justify',
  },
  // Deliverables - Card Style
  deliverableCard: {
    backgroundColor: '#ffffff',
    padding: 18,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  deliverableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deliverableNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 8,
    marginRight: 15,
  },
  deliverableTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  deliverableDescription: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.7,
    marginLeft: 47,
  },
  deliverableTimeline: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 8,
    marginLeft: 47,
    fontStyle: 'italic',
  },
  // Timeline - Modern Phase Cards
  phaseCard: {
    backgroundColor: '#f8fafc',
    padding: 18,
    marginBottom: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 9,
    marginRight: 15,
  },
  phaseName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  phaseDuration: {
    fontSize: 10,
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: 'bold',
  },
  phaseDeliverables: {
    marginTop: 10,
  },
  phaseBullet: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 5,
    paddingLeft: 0,
    lineHeight: 1.5,
  },
  // Investment Section
  investmentSection: {
    backgroundColor: '#f0f9ff',
    padding: 25,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  investmentTitle: {
    fontSize: 14,
    color: '#1e40af',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  investmentAmount: {
    fontSize: 40,
    fontWeight: 700,
    color: '#2563eb',
    marginBottom: 15,
    fontFamily: 'Roboto',
  },
  paymentTermsBox: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  paymentTermsLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paymentTermsText: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.7,
  },
  // Signatures
  signatureSection: {
    marginTop: 40,
    paddingTop: 25,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  signatureCard: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 15,
  },
  signatureImage: {
    width: 200,
    height: 70,
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
  },
  signatureInfo: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
  },
  signatureBold: {
    fontWeight: 'bold',
    color: '#374151',
  },
  signatureDate: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  validityBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    fontSize: 9,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    lineHeight: 1.5,
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nesternity: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2563eb',
  },
})

export function ProposalDocument({ proposal }: ProposalProps) {
  const deliverables = Array.isArray(proposal.deliverables) ? proposal.deliverables : []
  const timeline = Array.isArray(proposal.timeline) ? proposal.timeline : []
  const locale = getCurrencyLocale(proposal.currency)

  // Format the pricing amount with currency code (more reliable than symbols in PDF)
  const formattedPrice = proposal.pricing.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Hero Header */}
        <View style={styles.hero}>
          <Image src={LOGO_URL} style={styles.logo} />
          <View style={styles.titleRow}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>{proposal.title}</Text>
              <Text style={styles.subtitle}>
                Prepared for {proposal.client.company || proposal.client.name}
              </Text>
              <Text style={styles.subtitle}>
                {new Date(proposal.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.pricingBox}>
              <Text style={styles.pricingLabel}>Investment</Text>
              <Text style={styles.pricingAmount}>
                {proposal.currency} {formattedPrice}
              </Text>
            </View>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.label}>Client Name</Text>
                <Text style={styles.value}>{proposal.client.name}</Text>
              </View>
              {proposal.client.company && (
                <View style={styles.infoColumn}>
                  <Text style={styles.label}>Company</Text>
                  <Text style={styles.value}>{proposal.client.company}</Text>
                </View>
              )}
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{proposal.client.email}</Text>
              </View>
              {proposal.client.phone && (
                <View style={styles.infoColumn}>
                  <Text style={styles.label}>Phone</Text>
                  <Text style={styles.value}>{proposal.client.phone}</Text>
                </View>
              )}
            </View>
            {proposal.client.address && (
              <View>
                <Text style={styles.label}>Address</Text>
                <Text style={styles.value}>{proposal.client.address}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Project Brief */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Brief</Text>
          <Text style={styles.textContent}>{proposal.brief}</Text>
        </View>

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deliverables</Text>
            {deliverables.map((item: any, index: number) => (
              <View key={index} style={styles.deliverableCard}>
                <View style={styles.deliverableHeader}>
                  <Text style={styles.deliverableNumber}>{index + 1}</Text>
                  <Text style={styles.deliverableTitle}>
                    {item.item || item.title || item.name}
                  </Text>
                </View>
                {item.description && (
                  <Text style={styles.deliverableDescription}>
                    {item.description}
                  </Text>
                )}
                {item.timeline && (
                  <Text style={styles.deliverableTimeline}>
                    ⏱ {item.timeline}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Timeline</Text>
            {timeline.map((phase: any, index: number) => (
              <View key={index} style={styles.phaseCard}>
                <View style={styles.phaseHeader}>
                  <Text style={styles.phaseNumber}>{index + 1}</Text>
                  <Text style={styles.phaseName}>{phase.name || phase.phase}</Text>
                  <Text style={styles.phaseDuration}>
                    {phase.duration || phase.timeline}
                  </Text>
                </View>
                {phase.deliverables && Array.isArray(phase.deliverables) && (
                  <View style={styles.phaseDeliverables}>
                    {phase.deliverables.map((del: string, i: number) => (
                      <Text key={i} style={styles.phaseBullet}>
                        • {del}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Investment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment</Text>
          <View style={styles.investmentSection}>
            <Text style={styles.investmentTitle}>Total Project Cost</Text>
            <Text style={styles.investmentAmount}>
              {proposal.currency} {formattedPrice}
            </Text>
            {proposal.paymentTerms && (
              <View style={styles.paymentTermsBox}>
                <Text style={styles.paymentTermsLabel}>Payment Terms</Text>
                <Text style={styles.paymentTermsText}>{proposal.paymentTerms}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Signatures */}
        {proposal.signatures && proposal.signatures.length > 0 && (
          <View style={styles.signatureSection}>
            <Text style={styles.sectionTitle}>Authorized Signatures</Text>
            {proposal.signatures.map((sig, index) => (
              <View key={index} style={styles.signatureCard}>
                <Image src={sig.signatureBlob} style={styles.signatureImage} />
                <Text style={styles.signatureInfo}>
                  <Text style={styles.signatureBold}>Signed by: </Text>
                  {sig.signerName}
                </Text>
                <Text style={styles.signatureInfo}>
                  <Text style={styles.signatureBold}>Email: </Text>
                  {sig.signerEmail}
                </Text>
                {sig.signerTitle && (
                  <Text style={styles.signatureInfo}>
                    <Text style={styles.signatureBold}>Title: </Text>
                    {sig.signerTitle}
                  </Text>
                )}
                <Text style={styles.signatureDate}>
                  Signed on {new Date(sig.signedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.validityBadge}>
            VALID FOR 30 DAYS
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              This proposal is valid for 30 days{'\n'}
              Proposal ID: {proposal.id}
            </Text>
            <View style={styles.poweredBy}>
              <Text style={styles.footerText}>Powered by </Text>
              <Text style={styles.nesternity}>Nesternity</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
