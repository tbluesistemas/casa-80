
import { getProducts } from '@/lib/actions'

async function main() {
    console.log('Testing getProducts with UTC DAY range...')
    const now = new Date() // Local time

    // Construct UTC Range for "Today"
    // Validating against the event we found: Feb 11 2026 (00:00 UTC)
    // Note: If running this script on a different day, it might fail to find THAT specific event unless we hardcode.
    // However, the Goal is "Today's Availability".
    // If we assume the test environment date is relevant.
    // The previous script showed the event has Start/End as Feb 11 00:00 UTC.
    // If today is Feb 11, we should find it.

    // Hardcoding to Feb 11 2026 for robust verification of the specific reported issue
    // (Since user screenshot showed Feb 11)
    const targetYear = 2026
    const targetMonth = 1 // Feb
    const targetDay = 11

    const startDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0))
    const endDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 23, 59, 59))

    console.log(`Checking range: ${startDate.toISOString()} to ${endDate.toISOString()}`)

    const { success, data, error } = await getProducts({
        startDate,
        endDate
    })

    if (!success) {
        console.error('Error:', error)
        return
    }

    if (!data) {
        console.error('No data returned')
        return
    }

    // Find a product that we expect to be reserved (based on user screenshot "ADORNO PEZ GRANDE")
    // Or just look for any product with allocatedQuantity > 0
    const reservedProducts = data.filter((p: any) => p.allocatedQuantity > 0)

    if (reservedProducts.length > 0) {
        console.log(`Found ${reservedProducts.length} products with allocations:`)
        reservedProducts.forEach((p: any) => {
            console.log(`- ${p.name}: Total ${p.totalQuantity}, Allocated ${p.allocatedQuantity}, Available ${p.availableQuantity}`)
        })
    } else {
        console.log('No allocated products found in this UTC range.')
    }
}

main().catch(console.error)
