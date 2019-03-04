const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const checkAuth = require('../middleware/check-auth');

const Order = require('../models/order');
const Product = require('../models/product')

router.get('/', (req, res, next) => {
    Order.find()
    .select('_id order order.items.product order.items.quantity')
    .populate({
        path: 'order.items.product',
        model: 'Product',
        select: 'name price'
    })
    .exec()
    .then(docs => {
        res.status(200).json({
            count: docs.length,
            orders: docs
        });
    })
    .catch(err => {
        res.json(500).json({
            error: err
        });
    });
});

router.post('/', (req, res, next) => {
    const order = new Order({
        _id: mongoose.Types.ObjectId(),
        order: req.body.order
    });
    if (!(req.body.order && req.body.order.items && req.body.order.items.length > 0)) {
        return res.status(400).json({
            message: "Invalid order details"
        });
    }
    orderIds = req.body.order.items.map(a => a.product);
    Product.find({ _id: {$in: orderIds} })
    .exec()
    .then(result => {
        if(result.length > 0 && result.length == orderIds.length){
            return order.save();
        }
        return res.status(404).json({
            message: "Product not found"
        })
    })
    .then(result => {
        res.status(200).json({
            _id: result._id,
            order: result.order
        })
    })
    .catch(err => res.status(404).json({
        error: err
    }));
    
});

router.get('/:orderId', (req, res, next) => {
    Order.findById(req.params.orderId)
    .select('_id order order.items.product order.items.quantity')
    .populate({
        path: 'order.items.product',
        model: 'Product',
        select: 'name price'
    })
    .exec()
    .then(order => {
        if(!order) {
            return res.status(404).json({
                message: 'Order not found'
            })
        }
        res.status(200).json(order);
    })
    .catch(err => {
        res.status(500).json({
            error: err
        });
    });
});

router.delete('/:orderId', (req, res, next) => {
    const id = req.params.productId;
    Order.remove({ _id: id })
    .exec()
    .then(result => {
        res.status(200).json({
            message: "Order deleted",
            response: result
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

module.exports = router;