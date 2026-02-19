'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getClients, createClient } from '@/lib/actions'
import { toast } from 'sonner'
import { COLOMBIA_DATA, DEPARTAMENTOS } from "@/lib/colombia-data"
import { useAuth } from '@/components/auth-provider'
import { maskPhone, maskEmail, maskDocument } from '@/lib/permissions'

type Client = {
    id: string
    name: string
    email?: string | null
    document?: string | null
    phone?: string | null
    department?: string | null
    city?: string | null
    neighborhood?: string | null
    address?: string | null
    notes?: string | null
}

interface ClientSelectorProps {
    onSelect: (client: Client) => void
    selectedClient?: Client | null
}

const INITIAL_CLIENT_STATE = {
    name: '',
    document: '',
    email: '',
    phone: '',
    department: '',
    city: '',
    neighborhood: '',
    address: '',
    notes: ''
}

export function ClientSelector({ onSelect, selectedClient }: ClientSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState('')
    const [clients, setClients] = React.useState<Client[]>([])
    const [loading, setLoading] = React.useState(false)

    // Form state for new client
    const [showCreateDialog, setShowCreateDialog] = React.useState(false)
    const [newClient, setNewClient] = React.useState(INITIAL_CLIENT_STATE)

    const { role } = useAuth() // Get current role

    // Expanded Address State
    const [neighborhoodType, setNeighborhoodType] = React.useState('Barrio')
    const [neighborhoodName, setNeighborhoodName] = React.useState('')
    const [addressType, setAddressType] = React.useState('Casa')
    const [addressDetail, setAddressDetail] = React.useState('')

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (open) {
                setLoading(true)
                getClients(query).then(res => {
                    if (res.success && res.data) {
                        setClients(res.data)
                    }
                    setLoading(false)
                })
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [query, open])

    const handleCreateClick = () => {
        setNewClient(prev => ({ ...INITIAL_CLIENT_STATE, name: query }))
        setShowCreateDialog(true)
    }

    const handleSaveClient = async () => {
        // Construct final strings
        const finalNeighborhood = `${neighborhoodType} ${neighborhoodName}`.trim()
        const finalAddress = `${addressType} ${addressDetail}`.trim()

        // Validation
        const requiredCheck = [
            { val: newClient.name, label: 'Nombre / Razón Social' },
            { val: newClient.document, label: 'CC / NIT' },
            { val: newClient.email, label: 'Correo' },
            { val: newClient.phone, label: 'Teléfono / Celular' },
            { val: newClient.department, label: 'Departamento' },
            { val: newClient.city, label: 'Ciudad' },
            // Check composite fields
            { val: neighborhoodName, label: 'Nombre del Barrio/Vereda' },
            { val: addressDetail, label: 'Detalle de Dirección' }
        ]

        for (const field of requiredCheck) {
            if (!field.val || !field.val.toString().trim()) {
                return toast.error(`El campo "${field.label}" es obligatorio`)
            }
        }

        const clientData = {
            ...newClient,
            neighborhood: finalNeighborhood,
            address: finalAddress
        }

        const promise = createClient(clientData)

        toast.promise(promise, {
            loading: 'Guardando cliente...',
            success: (res) => {
                if (res.success && res.data) {
                    onSelect(res.data)
                    setOpen(false)
                    setShowCreateDialog(false)
                    // Reset form
                    setNewClient(INITIAL_CLIENT_STATE)
                    setNeighborhoodType('Barrio')
                    setNeighborhoodName('')
                    setAddressType('Casa')
                    setAddressDetail('')
                    return `Cliente "${res.data.name}" creado`
                }
                throw new Error(res.error)
            },
            error: (err) => err.message
        })
    }

    const availableCities = newClient.department ? (COLOMBIA_DATA[newClient.department] || []) : []

    return (
        <>
            <div className="flex w-full gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <div className="relative w-full flex-1">
                            <Input
                                placeholder="Buscar por Nombre, CC, Correo o Teléfono..."
                                value={selectedClient ? selectedClient.name : query}
                                onChange={(e) => {
                                    setQuery(e.target.value)
                                    if (selectedClient) onSelect(null as any) // Clear selection if typing
                                    setOpen(true)
                                }}
                                onClick={() => setOpen(true)}
                                className={cn(
                                    "w-full pr-10 truncate",
                                    selectedClient && "font-medium"
                                )}
                            />
                            <div className="absolute right-3 top-2.5 text-muted-foreground">
                                {loading ? (
                                    <span className="text-xs animate-pulse">...</span>
                                ) : (
                                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                )}
                            </div>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <div className="p-2 gap-2 flex flex-col">
                            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                                {!loading && (
                                    <>
                                        {clients.map((client) => (
                                            <div
                                                key={client.id}
                                                className={cn(
                                                    "flex flex-col px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors border border-transparent hover:border-border",
                                                    selectedClient?.id === client.id && "bg-accent text-accent-foreground border-border"
                                                )}
                                                onClick={() => {
                                                    onSelect(client)
                                                    setQuery('')
                                                    setOpen(false)
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold">{client.name}</span>
                                                    {selectedClient?.id === client.id && <Check className="h-4 w-4 text-primary" />}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                                                    {client.document && <span>🆔 {maskDocument(client.document, role)}</span>}
                                                    {client.phone && <span>📞 {maskPhone(client.phone, role)}</span>}
                                                    {client.city && <span>📍 {client.city}</span>}
                                                </div>
                                                {client.email && <div className="text-xs text-muted-foreground mt-0.5">📧 {maskEmail(client.email, role)}</div>}
                                            </div>
                                        ))}

                                        {clients.length === 0 && query.trim().length > 0 && (
                                            <div className="text-xs text-center p-2 text-muted-foreground">
                                                No se encontraron coincidencias.
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {role === 'ADMIN' && (
                    <Button
                        size="icon"
                        variant="soft"
                        className="shrink-0 border"
                        onClick={handleCreateClick}
                        title={query.trim().length > 0 ? `Crear nuevo: ${query}` : "Crear nuevo cliente"}
                    >
                        <UserPlus className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nuevo Cliente</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <Label>Nombre / Razón Social <span className="text-red-500">*</span></Label>
                            <Input
                                value={newClient.name}
                                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <Label>CC / NIT <span className="text-red-500">*</span></Label>
                            <Input
                                value={newClient.document}
                                onChange={(e) => setNewClient({ ...newClient, document: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <Label>Correo <span className="text-red-500">*</span></Label>
                            <Input
                                type="email"
                                value={newClient.email}
                                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <Label>Teléfono / Celular <span className="text-red-500">*</span></Label>
                            <Input
                                value={newClient.phone}
                                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <Label>Departamento <span className="text-red-500">*</span></Label>
                            <Select
                                value={newClient.department || ''}
                                onValueChange={(val) => setNewClient({ ...newClient, department: val, city: '' })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPARTAMENTOS.map(dept => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <Label>Ciudad <span className="text-red-500">*</span></Label>
                            <Select
                                value={newClient.city || ''}
                                onValueChange={(val) => setNewClient({ ...newClient, city: val })}
                                disabled={!newClient.department}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCities.map(city => (
                                        <SelectItem key={city} value={city}>{city}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label>Ubicación (Barrio / Vereda) <span className="text-red-500">*</span></Label>
                            <div className="flex gap-2">
                                <Select value={neighborhoodType} onValueChange={setNeighborhoodType}>
                                    <SelectTrigger className="w-[110px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Barrio">Barrio</SelectItem>
                                        <SelectItem value="Vereda">Vereda</SelectItem>
                                        <SelectItem value="Otro">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="Nombre..."
                                    value={neighborhoodName}
                                    onChange={(e) => setNeighborhoodName(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label>Dirección <span className="text-red-500">*</span></Label>
                            <div className="flex gap-2">
                                <Select value={addressType} onValueChange={setAddressType}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Casa">Casa</SelectItem>
                                        <SelectItem value="Apartamento">Apartamento</SelectItem>
                                        <SelectItem value="Edificio">Edificio</SelectItem>
                                        <SelectItem value="Oficina">Oficina</SelectItem>
                                        <SelectItem value="Local">Local</SelectItem>
                                        <SelectItem value="Otro">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="Detalles (N°, Torre, etc)..."
                                    value={addressDetail}
                                    onChange={(e) => setAddressDetail(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label>Nota</Label>
                            <Textarea
                                value={newClient.notes}
                                onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSaveClient}>Guardar Cliente</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
