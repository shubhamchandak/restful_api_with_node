const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    order: {
        items: { 
                type: [{
                        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
                        quantity: { type: Number, default: 1 }
                }],
                required: true
        },
        customerName: {type: String, required: true},
        phone: {type: Number, required: true},
        netAmount: {type: Number, required: true},
        address: {type: String, required: true},
        status: {type: Number, default: 1},
        otpCode: {type: Number, required: true}
    }
});

module.exports = mongoose.model('Order', orderSchema);