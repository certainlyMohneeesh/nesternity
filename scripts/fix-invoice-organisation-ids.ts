import { prisma } from '@/lib/db';

/**
 * This script fixes invoices that have null organisationId
 * by looking up the organisationId from their linked proposals
 */
async function fixInvoiceOrganisationIds() {
    console.log('🔧 Starting invoice organisationId fix...');

    // Find all invoices with null organisationId
    const invoicesWithNullOrg = await prisma.invoice.findMany({
        where: {
            organisationId: null,
        },
        select: {
            id: true,
            invoiceNumber: true,
            clientId: true,
        },
    });

    console.log(`📊 Found ${invoicesWithNullOrg.length} invoices with null organisationId`);

    if (invoicesWithNullOrg.length === 0) {
        console.log('✅ No invoices need fixing!');
        return;
    }

    let fixed = 0;
    let errors = 0;

    for (const invoice of invoicesWithNullOrg) {
        try {
            // Get the client to find the organisationId
            const client = await prisma.client.findUnique({
                where: { id: invoice.clientId },
                select: { organisationId: true },
            });

            if (client?.organisationId) {
                // Update the invoice with the organisationId
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { organisationId: client.organisationId },
                });

                console.log(`✅ Fixed ${invoice.invoiceNumber}: set organisationId to ${client.organisationId}`);
                fixed++;
            } else {
                console.warn(`⚠️  ${invoice.invoiceNumber}: Client has no organisationId`);
                errors++;
            }
        } catch (error) {
            console.error(`❌ Error fixing ${invoice.invoiceNumber}:`, error);
            errors++;
        }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Fixed: ${fixed}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log('🎉 Done!\n');
}

// Run the fix
fixInvoiceOrganisationIds()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
