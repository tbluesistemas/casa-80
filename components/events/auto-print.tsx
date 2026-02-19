'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function AutoPrint() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const shouldPrint = searchParams.get('print') === 'true'

    useEffect(() => {
        if (shouldPrint) {
            // Small delay to ensure rendering is complete
            const timer = setTimeout(() => {
                window.print()

                // Optional: Remove the query param to allow refresh without printing again
                // const newParams = new URLSearchParams(searchParams.toString())
                // newParams.delete('print')
                // router.replace(`?${newParams.toString()}`, { scroll: false })
            }, 500)

            return () => clearTimeout(timer)
        }
    }, [shouldPrint])

    return null
}
