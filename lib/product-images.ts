type ProductImageSource = {
    imageUrl?: string | null
    imageUrls?: string[] | null
}

function cleanUrl(url?: string | null) {
    const trimmed = url?.trim()
    return trimmed ? trimmed : null
}

export function normalizeProductImageUrls(source?: ProductImageSource | null) {
    const orderedImages = (source?.imageUrls ?? [])
        .map(cleanUrl)
        .filter((url): url is string => Boolean(url))

    const coverImage = cleanUrl(source?.imageUrl)

    if (coverImage && orderedImages[0] !== coverImage) {
        orderedImages.unshift(coverImage)
    }

    return orderedImages.filter((url, index) => orderedImages.indexOf(url) === index)
}

export function sanitizeProductImageUrls(imageUrls?: Array<string | null | undefined>, imageUrl?: string | null) {
    return normalizeProductImageUrls({
        imageUrl,
        imageUrls: (imageUrls ?? [])
            .map(cleanUrl)
            .filter((url): url is string => Boolean(url)),
    })
}

export function getPrimaryProductImage(source?: ProductImageSource | null) {
    return normalizeProductImageUrls(source)[0] ?? null
}
