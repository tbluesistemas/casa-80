export type EventStatus =
    | 'SIN_CONFIRMAR'
    | 'RESERVADO'
    | 'DESPACHADO'
    | 'COMPLETADO'
    | 'CANCELADO'

export const ACTIVE_EVENT_STATUSES = ['SIN_CONFIRMAR', 'RESERVADO', 'DESPACHADO'] as const
export const INVENTORY_BLOCKING_EVENT_STATUSES = ['RESERVADO', 'DESPACHADO'] as const
export const COMPLETED_EVENT_STATUSES = ['COMPLETADO', 'COMPLETED'] as const
export const CANCELLED_EVENT_STATUSES = ['CANCELADO', 'CANCELLED'] as const
export const CLOSED_EVENT_STATUSES = [...COMPLETED_EVENT_STATUSES, ...CANCELLED_EVENT_STATUSES] as const

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
    SIN_CONFIRMAR: 'Sin Confirmar',
    RESERVADO: 'Reservado',
    DESPACHADO: 'Despachado',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado'
}

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
    SIN_CONFIRMAR: 'yellow',
    RESERVADO: 'blue',
    DESPACHADO: 'orange',
    COMPLETADO: 'green',
    CANCELADO: 'red'
}

export const EVENT_STATUS_DESCRIPTIONS: Record<EventStatus, string> = {
    SIN_CONFIRMAR: 'Evento creado, pendiente de confirmación',
    RESERVADO: 'Evento confirmado y reservado',
    DESPACHADO: 'Productos entregados, evento en curso',
    COMPLETADO: 'Evento finalizado, productos devueltos',
    CANCELADO: 'Evento cancelado'
}

// Transiciones permitidas
export const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
    SIN_CONFIRMAR: ['RESERVADO', 'CANCELADO'],
    RESERVADO: ['DESPACHADO', 'CANCELADO'],
    DESPACHADO: ['COMPLETADO'],
    COMPLETADO: [],
    CANCELADO: []
}

export function canTransition(from: EventStatus, to: EventStatus): boolean {
    return ALLOWED_TRANSITIONS[from]?.includes(to) || false
}

export function getNextStatuses(current: EventStatus): EventStatus[] {
    return ALLOWED_TRANSITIONS[current] || []
}

// Mapeo de estados antiguos a nuevos (para migración)
export const LEGACY_STATUS_MAP: Record<string, EventStatus> = {
    'BOOKED': 'RESERVADO',
    'ACTIVE': 'DESPACHADO',
    'COMPLETED': 'COMPLETADO',
    'CANCELLED': 'CANCELADO'
}

export function migrateLegacyStatus(oldStatus: string): EventStatus {
    return LEGACY_STATUS_MAP[oldStatus] || 'SIN_CONFIRMAR'
}
