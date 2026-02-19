const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const damagedItems = await prisma.eventItem.findMany({
        where: {
            returnedDamaged: { gt: 0 }
        },
        include: {
            event: true,
            product: true
        }
    })

    console.log('Total damaged items found:', damagedItems.length)

    let totalCost = 0
    const statusBreakdown = {}

    for (const item of damagedItems) {
        const cost = item.returnedDamaged * item.product.priceReplacement
        if (!item.damageRestored) {
            totalCost += cost
        }

        const status = item.event.status
        if (!statusBreakdown[status]) {
            statusBreakdown[status] = { count: 0, cost: 0 }
        }
        statusBreakdown[status].count++
        if (!item.damageRestored) {
            statusBreakdown[status].cost += cost
        }
    }

    console.log('Total Pending Damage Cost:', totalCost)
    console.log('Breakdown by Event Status:', statusBreakdown)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
