import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Register Roboto font (Standard for PDF generation)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontStyle: 'italic' },
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
    signatures?: Array<{
      signerName: string
      signerEmail: string
      signerTitle?: string | null
      signatureBlob: string
      signedAt: Date | string
    }>
  }
}

const LOGO_URL = 'https://scmyzihaokadwwszaimd.supabase.co/storage/v1/object/public/nesternity-assets/nesternity_l.png'

const getCurrencyLocale = (currency: string): string => {
  const localeMap: Record<string, string> = { INR: 'en-IN', USD: 'en-US', EUR: 'de-DE' }
  return localeMap[currency.toUpperCase()] || 'en-US'
}

const styles = StyleSheet.create({
  // Global
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
  },
  
  // --- COVER PAGE STYLES ---
  coverPage: {
    padding: 40,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  coverHeader: {
    marginTop: 20,
  },
  coverLogo: {
    width: 150,
    marginBottom: 40,
  },
  coverTitleContainer: {
    marginTop: 60,
  },
  coverLabel: {
    fontSize: 10,
    color: '#2563eb', // Brand Blue
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  coverTitle: {
    fontSize: 32,
    color: '#111827',
    fontWeight: 'bold',
    lineHeight: 1.2,
    marginBottom: 20,
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 40,
  },
  coverBottom: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coverMetaBlock: {
    flexDirection: 'column',
  },
  coverMetaLabel: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  coverMetaValue: {
    fontSize: 11,
    color: '#111827',
    fontWeight: 'medium',
  },

  // --- CONTENT PAGE STYLES ---
  contentPage: {
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 10,
  },
  headerLogo: {
    width: 80,
  },
  headerText: {
    fontSize: 8,
    color: '#9ca3af',
    alignSelf: 'center',
  },
  
  // Typography
  h1: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb', // Blue underline for sections
    paddingBottom: 5,
    marginTop: 20,
  },
  h2: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  text: {
    fontSize: 10,
    marginBottom: 8,
    textAlign: 'justify',
  },

  // Sections
  section: {
    marginBottom: 10,
  },
  
  // Deliverables List
  deliverableItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 5,
  },
  bulletPoint: {
    width: 20,
    fontSize: 10,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  deliverableContent: {
    flex: 1,
  },
  deliverableDesc: {
    fontSize: 10,
    color: '#4b5563',
  },
  deliverableMeta: {
    fontSize: 9,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Timeline (Left Border Style)
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 15,
    borderLeftWidth: 2,
    borderLeftColor: '#dbeafe', // Light blue line
    paddingLeft: 15,
    marginLeft: 5,
  },
  timelineDot: {
    position: 'absolute',
    left: -19,
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  timelineDuration: {
    fontSize: 9,
    color: '#2563eb',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  
  // Investment
  investmentBox: {
    marginTop: 10,
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  termsText: {
    marginTop: 10,
    fontSize: 9,
    color: '#6b7280',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },

  // Signatures
  signatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 40,
    marginTop: 20,
  },
  signatureBox: {
    width: '45%',
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
    paddingBottom: 5,
    marginBottom: 20,
  },
  sigImage: {
    height: 40,
    width: 120,
    objectFit: 'contain',
  },
  sigLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 4,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
})

export function ProposalDocument({ proposal }: ProposalProps) {
  const deliverables = Array.isArray(proposal.deliverables) ? proposal.deliverables : []
  const timeline = Array.isArray(proposal.timeline) ? proposal.timeline : []
  const locale = getCurrencyLocale(proposal.currency)
  
  const formattedPrice = proposal.pricing.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  return (
    <Document>
      {/* PAGE 1: COVER PAGE (Distinct layout) */}
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <View style={styles.coverHeader}>
          <Image src={LOGO_URL} style={styles.coverLogo} />
        </View>

        <View style={styles.coverTitleContainer}>
          <Text style={styles.coverLabel}>Project Proposal</Text>
          <Text style={styles.coverTitle}>{proposal.title}</Text>
          <Text style={styles.coverSubtitle}>
            Prepared specifically for {proposal.client.company || proposal.client.name}
          </Text>
        </View>

        <View style={styles.coverBottom}>
          <View style={styles.coverMetaBlock}>
            <Text style={styles.coverMetaLabel}>Prepared For</Text>
            <Text style={styles.coverMetaValue}>{proposal.client.name}</Text>
            <Text style={styles.coverMetaValue}>{proposal.client.company}</Text>
            <Text style={styles.coverMetaValue}>{proposal.client.email}</Text>
          </View>
          
          <View style={styles.coverMetaBlock}>
            <Text style={styles.coverMetaLabel}>Date Issued</Text>
            <Text style={styles.coverMetaValue}>{formatDate(proposal.createdAt)}</Text>
            <Text style={[styles.coverMetaLabel, { marginTop: 10 }]}>Proposal ID</Text>
            <Text style={styles.coverMetaValue}>{proposal.id}</Text>
          </View>
        </View>
      </Page>

      {/* PAGE 2+: CONTENT (Flowing layout) */}
      <Page size="A4" style={[styles.page, styles.contentPage]}>
        
        {/* Header on every content page */}
        <View style={styles.header} fixed>
          <Image src={LOGO_URL} style={styles.headerLogo} />
          <Text style={styles.headerText}>{proposal.title}</Text>
        </View>

        {/* 1. Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.h1}>1. Executive Summary</Text>
          <Text style={styles.text}>{proposal.brief}</Text>
        </View>

        {/* 2. Scope of Work / Deliverables */}
        {deliverables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.h1}>2. Scope of Work</Text>
            {deliverables.map((item: any, index: number) => (
              <View key={index} style={styles.deliverableItem} wrap={false}>
                <Text style={styles.bulletPoint}>{index + 1}.</Text>
                <View style={styles.deliverableContent}>
                  <Text style={styles.h2}>{item.item || item.title || item.name}</Text>
                  {item.description && <Text style={styles.deliverableDesc}>{item.description}</Text>}
                  {item.timeline && <Text style={styles.deliverableMeta}>Est. Time: {item.timeline}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 3. Project Timeline */}
        {timeline.length > 0 && (
          <View style={styles.section} break={timeline.length > 4}> 
             {/* Add a page break before timeline if it's long, to keep it together */}
            <Text style={styles.h1}>3. Project Timeline</Text>
            {timeline.map((phase: any, index: number) => (
              <View key={index} style={styles.timelineItem} wrap={false}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{phase.name || phase.phase}</Text>
                  <Text style={styles.timelineDuration}>{phase.duration || phase.timeline}</Text>
                  {phase.deliverables && Array.isArray(phase.deliverables) && (
                     phase.deliverables.map((del: string, i: number) => (
                       <Text key={i} style={[styles.text, { fontSize: 9, color: '#666', marginBottom: 2 }]}>
                         • {del}
                       </Text>
                     ))
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 4. Investment */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.h1}>4. Investment</Text>
          <View style={styles.investmentBox}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total Project Investment</Text>
              <Text style={styles.priceValue}>{proposal.currency} {formattedPrice}</Text>
            </View>
            {proposal.paymentTerms && (
               <Text style={styles.termsText}>
                 <Text style={{ fontWeight: 'bold' }}>Payment Terms: </Text>
                 {proposal.paymentTerms}
               </Text>
            )}
          </View>
        </View>

        {/* 5. Signatures */}
        {proposal.signatures && proposal.signatures.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.h1}>5. Acceptance</Text>
            <View style={styles.signatureGrid}>
              {proposal.signatures.map((sig, index) => (
                <View key={index} style={styles.signatureBox}>
                  <Image src={sig.signatureBlob} style={styles.sigImage} />
                  <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 0 }]}>{sig.signerName}</Text>
                  <Text style={[styles.text, { fontSize: 8, color: '#6b7280' }]}>{sig.signerTitle || 'Client'}</Text>
                  <Text style={styles.sigLabel}>Date: {formatDate(sig.signedAt)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer on every page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Nesternity | Confidential Proposal</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  )
}