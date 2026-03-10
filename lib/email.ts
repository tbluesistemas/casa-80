import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || 'ethereal_user',
        pass: process.env.SMTP_PASS || 'ethereal_pass',
    },
})

export async function sendReservationEmail(
    to: string,
    clientName: string,
    eventDetails: {
        id: string
        name: string
        startDate: Date
        endDate: Date
        totalItems: number
    },
    items: { productName: string; quantity: number }[]
) {
    if (!to || !to.includes('@')) {
        console.log('Skipping email: Invalid recipient', to)
        return
    }

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
            <h1>Casa80 Eventos</h1>
            <p>Confirmación de Reserva</p>
        </div>
        
        <div style="padding: 20px;">
            <p>Hola <strong>${clientName}</strong>,</p>
            <p>Gracias por tu reserva. Aquí están los detalles de tu evento en Casa80.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Evento:</strong> ${eventDetails.name}</p>
                <p><strong>ID Reserva:</strong> ${eventDetails.id}</p>
                <p><strong>Desde:</strong> ${eventDetails.startDate.toLocaleDateString()}</p>
                <p><strong>Hasta:</strong> ${eventDetails.endDate.toLocaleDateString()}</p>
            </div>

            <h3>Artículos Reservados</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="border-bottom: 2px solid #ddd; text-align: left;">
                        <th style="padding: 10px;">Producto</th>
                        <th style="padding: 10px; text-align: right;">Cantidad</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px;">${item.productName}</td>
                            <td style="padding: 10px; text-align: right;">${item.quantity}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #777;">
                <p><strong>Casa80 Eventos</strong></p>
                <p>Calle 72 58 - 45, Barranquilla</p>
                <p>Tel: 123456789</p>
                <p>Email: contacto@casa80.com</p>
            </div>
        </div>
    </div>
    `

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Casa80 Reservas" <no-reply@casa80.com>',
            to,
            subject: `Confirmación Reserva: ${eventDetails.name}`,
            html: htmlContent,
        })

        console.log('Email sent: %s', info.messageId)
        // Preview only available when using Ethereal account (nodemailer v6)
        const previewUrl = typeof nodemailer.getTestMessageUrl === 'function'
            ? nodemailer.getTestMessageUrl(info)
            : null
        if (previewUrl) {
            console.log('Preview URL: %s', previewUrl)
        }
        return { success: true }
    } catch (error) {
        console.error('Error sending email:', error)
        return { success: false, error }
    }
}
