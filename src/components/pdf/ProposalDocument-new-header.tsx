import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Register Roboto font for Unicode symbol support (Industry Standard)
// This ensures currency symbols like ₹, €, £, ¥ display correctly
Font.register({
    family: 'Roboto',
    fonts: [
        {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
            fontWeight: 400,
        },
        {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
            fontWeight: 700,
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

// LOGO CDN URL
const LOGO_URL = 'https://scmyzihaokadwwszaimd.supabase.co/storage/v1/object/public/nesternity-assets/nesternity_l.png'

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
