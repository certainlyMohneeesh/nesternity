import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

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

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#2563eb',
    borderBottomStyle: 'solid',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    border: '1 solid #cbd5e1',
    minWidth: 150,
  },
  brandingText: {
    fontSize: 10,
    color: '#64748b',
    marginRight: 6,
  },
  brandingLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 16,
    color: '#2563eb',
    marginRight: 4,
    fontWeight: 'bold',
  },
  logoText: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    paddingBottom: 6,
    paddingLeft: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    borderLeftStyle: 'solid',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 4,
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 20,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 11,
    color: '#1f2937',
    marginBottom: 2,
    fontWeight: '500',
  },
  text: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.7,
    marginBottom: 8,
    textAlign: 'justify',
  },
  projectCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderStyle: 'solid',
  },
  projectName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  deliverableItem: {
    flexDirection: 'row',
    marginBottom: 14,
    paddingLeft: 5,
    paddingRight: 10,
    paddingVertical: 8,
    backgroundColor: '#fafafa',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    borderLeftStyle: 'solid',
  },
  deliverableNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 2,
    marginRight: 12,
    marginLeft: 8,
  },
  deliverableContent: {
    flex: 1,
  },
  deliverableTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  deliverableDescription: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.6,
  },
  deliverableTimeline: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 14,
    paddingLeft: 5,
    paddingRight: 10,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
  },
  phaseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 2.3,
    marginRight: 14,
    marginLeft: 8,
  },
  phaseContent: {
    flex: 1,
  },
  phaseName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  phaseDuration: {
    fontSize: 10,
    color: '#6b7280',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  phaseDeliverables: {
    fontSize: 9,
    color: '#4b5563',
    marginTop: 6,
    lineHeight: 1.6,
    paddingLeft: 8,
  },
  deliverableBullet: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 3,
    paddingLeft: 4,
  },
  pricingSection: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2563eb',
    borderStyle: 'solid',
    marginBottom: 15,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pricingLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    letterSpacing: -1,
  },
  paymentTermsCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
  },
  paymentTermsLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 'bold',
  },
  paymentTermsText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.6,
  },
  signatureSection: {
    marginTop: 35,
    paddingTop: 25,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  signatureBox: {
    marginTop: 15,
    padding: 18,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
  },
  signatureImage: {
    width: 180,
    height: 60,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    borderBottomStyle: 'solid',
  },
  signatureInfo: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 3,
    lineHeight: 1.4,
  },
  signatureDate: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 6,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  footerText: {
    marginBottom: 4,
    lineHeight: 1.4,
  },
  validityBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 6,
  },
})

export function ProposalDocument({ proposal }: ProposalProps) {
  const deliverables = Array.isArray(proposal.deliverables) ? proposal.deliverables : []
  const timeline = Array.isArray(proposal.timeline) ? proposal.timeline : []
  const currencySymbol = proposal.currency === 'INR' ? '₹' : '$'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Branding */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{proposal.title}</Text>
            <Text style={styles.subtitle}>
              Prepared for {proposal.client.company || proposal.client.name}
            </Text>
            <Text style={styles.subtitle}>
              Date: {new Date(proposal.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.brandingContainer}>
              <Text style={styles.brandingText}>Built with</Text>
              <View style={styles.brandingLogo}>
                <Text style={styles.logoIcon}>◆</Text>
                <Text style={styles.logoText}>Nesternity</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Client Name</Text>
                <Text style={styles.value}>{proposal.client.name}</Text>
              </View>
              {proposal.client.company && (
                <View style={styles.column}>
                  <Text style={styles.label}>Company</Text>
                  <Text style={styles.value}>{proposal.client.company}</Text>
                </View>
              )}
            </View>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{proposal.client.email}</Text>
              </View>
              {proposal.client.phone && (
                <View style={styles.column}>
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

        {/* Project Information */}
        {proposal.project && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Overview</Text>
            <View style={styles.projectCard}>
              <Text style={styles.projectName}>{proposal.project.name}</Text>
              {proposal.project.description && (
                <Text style={styles.text}>{proposal.project.description}</Text>
              )}
            </View>
          </View>
        )}

        {/* Brief */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Brief</Text>
          <Text style={styles.text}>{proposal.brief}</Text>
        </View>

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deliverables</Text>
            {deliverables.map((item: any, index: number) => (
              <View key={index} style={styles.deliverableItem}>
                <Text style={styles.deliverableNumber}>{index + 1}</Text>
                <View style={styles.deliverableContent}>
                  <Text style={styles.deliverableTitle}>
                    {item.item || item.title || item.name}
                  </Text>
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
              </View>
            ))}
          </View>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Timeline</Text>
            {timeline.map((phase: any, index: number) => (
              <View key={index} style={styles.timelineItem}>
                <Text style={styles.phaseNumber}>{index + 1}</Text>
                <View style={styles.phaseContent}>
                  <Text style={styles.phaseName}>{phase.name || phase.phase}</Text>
                  <Text style={styles.phaseDuration}>
                    Duration: {phase.duration || phase.timeline}
                  </Text>
                  {phase.deliverables && Array.isArray(phase.deliverables) && phase.deliverables.length > 0 && (
                    <View style={{ marginTop: 4 }}>
                      {phase.deliverables.map((deliverable: string, delIndex: number) => (
                        <Text key={delIndex} style={styles.deliverableBullet}>
                          • {deliverable}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment</Text>
          <View style={styles.pricingSection}>
            <View style={styles.pricingHeader}>
              <Text style={styles.pricingLabel}>Total Project Cost</Text>
            </View>
            <Text style={styles.pricingAmount}>
              {currencySymbol}{proposal.pricing.toLocaleString()}
            </Text>
          </View>
          {proposal.paymentTerms && (
            <View style={styles.paymentTermsCard}>
              <Text style={styles.paymentTermsLabel}>Payment Terms</Text>
              <Text style={styles.paymentTermsText}>{proposal.paymentTerms}</Text>
            </View>
          )}
        </View>

        {/* Signatures */}
        {proposal.signatures && proposal.signatures.length > 0 && (
          <View style={styles.signatureSection}>
            <Text style={styles.sectionTitle}>Authorized Signatures</Text>
            {proposal.signatures.map((signature, index) => (
              <View key={index} style={styles.signatureBox}>
                <Image
                  src={signature.signatureBlob}
                  style={styles.signatureImage}
                />
                <Text style={styles.signatureInfo}>
                  <Text style={{ fontWeight: 'bold' }}>Signed by:</Text> {signature.signerName}
                </Text>
                <Text style={styles.signatureInfo}>
                  <Text style={{ fontWeight: 'bold' }}>Email:</Text> {signature.signerEmail}
                </Text>
                {signature.signerTitle && (
                  <Text style={styles.signatureInfo}>
                    <Text style={{ fontWeight: 'bold' }}>Title:</Text> {signature.signerTitle}
                  </Text>
                )}
                <Text style={styles.signatureDate}>
                  Signed on {new Date(signature.signedAt).toLocaleDateString('en-US', {
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
          <Text style={styles.footerText}>
            This proposal is valid for 30 days from the date of issue.
          </Text>
          <Text style={styles.footerText}>
            Proposal ID: {proposal.id}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
