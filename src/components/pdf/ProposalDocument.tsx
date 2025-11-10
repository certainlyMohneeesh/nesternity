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
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 3,
    borderBottomColor: '#2563eb',
    borderBottomStyle: 'solid',
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 3,
  },
  value: {
    fontSize: 12,
    color: '#1f2937',
    marginBottom: 2,
  },
  text: {
    fontSize: 11,
    color: '#4b5563',
    lineHeight: 1.6,
    marginBottom: 10,
  },
  deliverableItem: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingLeft: 10,
  },
  deliverableNumber: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 1.8,
    marginRight: 10,
  },
  deliverableContent: {
    flex: 1,
  },
  deliverableTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 3,
  },
  deliverableDescription: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 10,
  },
  phaseNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 2.2,
    marginRight: 12,
  },
  phaseContent: {
    flex: 1,
  },
  phaseName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  phaseDuration: {
    fontSize: 10,
    color: '#6b7280',
  },
  pricingBox: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#2563eb',
    borderStyle: 'solid',
  },
  pricingLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  pricingAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  signatureSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  signatureBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  signatureImage: {
    width: 150,
    height: 50,
    marginBottom: 10,
  },
  signatureInfo: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
})

export function ProposalDocument({ proposal }: ProposalProps) {
  const deliverables = Array.isArray(proposal.deliverables) ? proposal.deliverables : []
  const timeline = Array.isArray(proposal.timeline) ? proposal.timeline : []
  const currencySymbol = proposal.currency === 'INR' ? '₹' : '$'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
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

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
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

        {/* Project Information */}
        {proposal.project && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project</Text>
            <Text style={styles.value}>{proposal.project.name}</Text>
            {proposal.project.description && (
              <Text style={styles.text}>{proposal.project.description}</Text>
            )}
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
                    {item.title || item.name}
                  </Text>
                  {item.description && (
                    <Text style={styles.deliverableDescription}>
                      {item.description}
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
                  <Text style={styles.phaseName}>{phase.phase || phase.name}</Text>
                  <Text style={styles.phaseDuration}>
                    {phase.duration || phase.timeline}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment</Text>
          <View style={styles.pricingBox}>
            <Text style={styles.pricingLabel}>Total Project Cost</Text>
            <Text style={styles.pricingAmount}>
              {currencySymbol}{proposal.pricing.toLocaleString()}
            </Text>
          </View>
          {proposal.paymentTerms && (
            <View>
              <Text style={styles.label}>Payment Terms</Text>
              <Text style={styles.text}>{proposal.paymentTerms}</Text>
            </View>
          )}
        </View>

        {/* Signatures */}
        {proposal.signatures && proposal.signatures.length > 0 && (
          <View style={styles.signatureSection}>
            <Text style={styles.sectionTitle}>Signatures</Text>
            {proposal.signatures.map((signature, index) => (
              <View key={index} style={styles.signatureBox}>
                <Image
                  src={signature.signatureBlob}
                  style={styles.signatureImage}
                />
                <Text style={styles.signatureInfo}>
                  Signed by: {signature.signerName}
                </Text>
                <Text style={styles.signatureInfo}>
                  Email: {signature.signerEmail}
                </Text>
                {signature.signerTitle && (
                  <Text style={styles.signatureInfo}>
                    Title: {signature.signerTitle}
                  </Text>
                )}
                <Text style={styles.signatureInfo}>
                  Date: {new Date(signature.signedAt).toLocaleDateString('en-US', {
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
          <Text>This proposal is valid for 30 days from the date of issue.</Text>
          <Text>Proposal ID: {proposal.id}</Text>
        </View>
      </Page>
    </Document>
  )
}
