const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true},
    price: { type: Number, required: true },
    status: { type: Number, default: 0, required: true},
    type: {type: Number, default: 0, required: true},
    discount: {type: Number, default: 0}
});

module.exports = mongoose.model('Product', productSchema);