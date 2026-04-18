import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Iniciando seed...')

    const hashedPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@casa80.com' },
        update: {},
        create: {
            email: 'admin@casa80.com',
            name: 'Administrador',
            password: hashedPassword,
            role: 'ADMIN',
            active: true,
        },
    })

    const silla = await prisma.product.upsert({
        where: { id: 'seed-silla-tiffany' },
        update: {},
        create: {
            id: 'seed-silla-tiffany',
            name: 'Silla Tiffany Dorada',
            description: 'Silla elegante para eventos formales, color dorado',
            totalQuantity: 100,
            priceReplacement: 150.0,
            imageUrl: '/images/silla-tiffany.jpg',
        },
    })

    const mesa = await prisma.product.upsert({
        where: { id: 'seed-mesa-redonda' },
        update: {},
        create: {
            id: 'seed-mesa-redonda',
            name: 'Mesa Redonda 10 personas',
            description: 'Mesa plegable de madera, 1.5m de diámetro',
            totalQuantity: 20,
            priceReplacement: 800.0,
            imageUrl: '/images/mesa-redonda.jpg',
        },
    })

    const mantel = await prisma.product.upsert({
        where: { id: 'seed-mantel-blanco' },
        update: {},
        create: {
            id: 'seed-mantel-blanco',
            name: 'Mantel Blanco Premium',
            description: 'Mantel de tela gruesa, resistente a manchas',
            totalQuantity: 50,
            priceReplacement: 200.0,
            imageUrl: '/images/mantel-blanco.jpg',
        },
    })

    const cliente1 = await prisma.client.upsert({
        where: { id: 'seed-client-1' },
        update: {},
        create: {
            id: 'seed-client-1',
            name: 'María García',
            document: '12345678',
            email: 'maria.garcia@example.com',
            phone: '3001234567',
            department: 'Atlántico',
            city: 'Barranquilla',
            neighborhood: 'El Prado',
            address: 'Calle 72 #45-23',
            notes: 'Cliente frecuente',
        },
    })

    const cliente2 = await prisma.client.upsert({
        where: { id: 'seed-client-2' },
        update: {},
        create: {
            id: 'seed-client-2',
            name: 'Carlos Rodríguez',
            document: '87654321',
            email: 'carlos.rodriguez@example.com',
            phone: '3009876543',
            department: 'Atlántico',
            city: 'Barranquilla',
            neighborhood: 'Riomar',
            address: 'Carrera 51B #85-45',
        },
    })

    const cliente3 = await prisma.client.upsert({
        where: { id: 'seed-client-3' },
        update: {},
        create: {
            id: 'seed-client-3',
            name: 'Ana Martínez',
            document: '11223344',
            email: 'ana.martinez@example.com',
            phone: '3005551234',
            department: 'Atlántico',
            city: 'Barranquilla',
            neighborhood: 'Alto Prado',
            address: 'Calle 98 #52-10',
        },
    })

    const webSections = [
        {
            id: 'seed-hero-principal',
            tipo: 'hero',
            titulo: 'Mobiliario elegante para eventos que se sienten especiales desde el primer vistazo.',
            subtitulo: 'Casa 80 | mobiliario para bodas, fiestas y eventos sociales',
            descripcion: 'Alquilamos piezas con una puesta en escena limpia y bien resuelta para que tu celebración se vea premium desde que los invitados entran.',
            imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
            orden: 1,
            activo: true,
        },
        {
            id: 'seed-servicio-entrega',
            tipo: 'servicios',
            titulo: 'Entrega e instalación',
            subtitulo: 'Servicio integral',
            descripcion: 'Llevamos y montamos todo el mobiliario en tu evento con una operación coordinada por el mismo equipo.',
            imageUrl: '',
            orden: 10,
            activo: true,
        },
        {
            id: 'seed-servicio-disponibilidad',
            tipo: 'servicios',
            titulo: 'Disponibilidad 24/7',
            subtitulo: 'Atención continua',
            descripcion: 'Cotiza y reserva en cualquier momento con acompañamiento cercano durante todo el proceso.',
            imageUrl: '',
            orden: 20,
            activo: true,
        },
        {
            id: 'seed-servicio-garantia',
            tipo: 'servicios',
            titulo: 'Garantía total',
            subtitulo: 'Respaldo operativo',
            descripcion: 'Piezas en excelente estado y respuesta rápida si hace falta reemplazar algo antes o durante el evento.',
            imageUrl: '',
            orden: 30,
            activo: true,
        },
        {
            id: 'seed-contacto-linea',
            tipo: 'contacto',
            titulo: '+57 315 645 3004',
            subtitulo: 'Línea principal',
            descripcion: 'Atendemos cotizaciones, disponibilidad y coordinación logística para eventos en Barranquilla y alrededores.',
            imageUrl: '',
            orden: 40,
            activo: true,
        },
        {
            id: 'seed-contacto-ubicacion',
            tipo: 'contacto',
            titulo: 'Barranquilla, Atlántico, Colombia',
            subtitulo: 'Cobertura local',
            descripcion: 'Visítanos o agenda tu evento para revisar el mobiliario, el montaje y la disponibilidad por fecha.',
            imageUrl: '',
            orden: 50,
            activo: true,
        },
    ]

    for (const section of webSections) {
        await prisma.webContentSection.upsert({
            where: { id: section.id },
            update: {
                tipo: section.tipo,
                titulo: section.titulo,
                subtitulo: section.subtitulo,
                descripcion: section.descripcion,
                imageUrl: section.imageUrl,
                orden: section.orden,
                activo: section.activo,
            },
            create: section,
        })
    }

    console.log('Usuario administrador:', admin.email)
    console.log('Productos creados:', { silla: silla.name, mesa: mesa.name, mantel: mantel.name })
    console.log('Clientes creados:', {
        cliente1: cliente1.name,
        cliente2: cliente2.name,
        cliente3: cliente3.name,
    })
    console.log('Secciones web creadas:', webSections.length)
    console.log('Seed completado.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (error) => {
        console.error(error)
        await prisma.$disconnect()
        process.exit(1)
    })
