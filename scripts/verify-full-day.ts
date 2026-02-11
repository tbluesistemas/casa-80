
import { prisma } from '@/lib/prisma'

async function main() {
    console.log('Listing active events (RESERVADO/DESPACHADO)...')

    // Using prisma directly to see raw data
    const events = await prisma.event.findMany({
        where: {
            status: { in: ['RESERVADO', 'DESPACHADO'] }
        },
        include: { items: true }
    })

    console.log(`Found ${events.length} active events.`)
    events.forEach(e => {
        console.log(`Event: "${e.name}"`)
        console.log(`  ID: ${e.id}`)
        console.log(`  Start (JS Date): ${e.startDate.toString()}`)
        console.log(`  Start (ISO):     ${e.startDate.toISOString()}`)
        console.log(`  End (JS Date):   ${e.endDate.toString()}`)
        console.log(`  End (ISO):       ${e.endDate.toISOString()}`)
        console.log(`  Items: ${e.items.length}`)
    })
}

main().catch(console.error)
