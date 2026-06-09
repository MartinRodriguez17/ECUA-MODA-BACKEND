// Archivo: models/Pedido.js
// Este modelo representa un pedido que un cliente hace en la tienda de moda.
// Contiene información sobre quién hizo el pedido, qué productos compró, a dónde se lo enviamos, cuánto costó y el estado del envío.


const mongoose = require('mongoose');

const PedidoSchema = mongoose.Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: false 
    },
    correoComprador: { type: String, required: true },
    direccionEnvio: { type: String, required: true },
    telefonoComprador: { type: String, required: true },
    
    productos: [
        {
            producto: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Producto',
                required: true
            },
            cantidad: { type: Number, required: true, default: 1 },
            talla: { type: String, required: true },
            precio: { type: Number, required: true } 
        }
    ],
    
    // --- LÓGICA FINANCIERA DEL HUB ---
    subtotal: { type: Number, required: true }, // Lo que suma la ropa pura
    iva: { type: Number, required: true },      // 15% 
    total: { type: Number, required: true },    // Subtotal + IVA
    
    // --- LÓGICA DE PAGO Y COMISIONES ---
    // URL de la captura de pantalla de la transferencia del Banco Pichincha
    comprobantePagoUrl: { type: String, required: true }, 
    
    // El estado ahora es más específico para control administrativo
    estado: { 
        type: String, 
        enum: ['Pendiente Verificación', 'Pago Aprobado', 'Rechazado', 'Enviado'],
        default: 'Pendiente Verificación' 
    },
    fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pedido', PedidoSchema);