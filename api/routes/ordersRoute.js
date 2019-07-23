const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const checkAuth = require('../middleware/check-auth');
const nexmo = require('../middleware/nexmo-sms');
const pushNotification = require('../middleware/fcm');


const Order = require('../models/order');
const Product = require('../models/product');


router.get('/', (req, res, next) => {
    var datetime = new Date();
    datetime.setHours(0, 0, 0, 0);
    var midnightTime = datetime.toISOString();
    Order.find({createdAt: {$gte: midnightTime}, 'order.status': {$ne: 1}})
    .sort({_id: -1})
    .select('_id order updatedAt createdAt')
    .populate({
        path: 'order.items.productId',
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
        res.status(500).json({
            error: err
        });
    });
});

router.post('/', (req, res, next) => {
    if (!(req.body.order && req.body.order.items && req.body.order.items.length > 0) &&
        !(req.body.order.customerName && req.body.order.phone && req.body.order.address)) {
        return res.status(400).json({
            message: "Invalid order details"
        });
    }
    const newOrder = new Order({
        _id: mongoose.Types.ObjectId(),
        order: req.body.order,
    });
    userPhone = req.body.order.phone; 
    newOrder.order.netAmount = 0;
    newOrder.order.otpCode = Math.floor(Math.random()* 999999-100001) + 100001;
    productIds = req.body.order.items.map(a => a._id);
    productQuantities = req.body.order.items.map(a => a.quantity);
    Product.find({ _id: {$in: productIds} })
    .exec()
    .then(result => {
        if(result.length > 0 && result.length == productIds.length){
            result.map(x => {
                productIds.forEach((id, index) => {
                    if(id == x._id) {
                        newOrder.order.netAmount += productQuantities[index] * x.price;
                        newOrder.order.items[index].productId = x._id;
                    }
                });
                newOrder.order.deliveryCharges = newOrder.order.netAmount >= 100 ? 0 : 5;  
                newOrder.order.finalAmount = newOrder.order.netAmount + newOrder.order.deliveryCharges;
            });
            Order.find({'order.phone': userPhone})
            .where('order.status').ne(1)
            .exec()
            .then(prevOrders => {
                if(prevOrders.length == 0) {
                    //newOrder.order.discount = ((newOrder.order.netAmount/2 > 50) ? 50 : (newOrder.order.netAmount/2));
                    newOrder.order.discount = 0;
                    newOrder.order.finalAmount = newOrder.order.netAmount - newOrder.order.discount + newOrder.order.deliveryCharges;
                }
                newOrder.save()
                .then(result => {
                    nexmo.sendOtp(newOrder.order.otpCode, userPhone);
                    res.status(200).json({
                        _id: result._id,
                        order: result.order
                    });
                });
            })
            // .catch(err => console.log(err));

        } else {
            return res.status(404).json({
                message: "Product not found"
            });
        }

    })
    .catch(err => {
        console.log("Error aa gaya => " + err)
        res.status(404).json({
            error: err
        });
    });
});

router.get('/:orderId', (req, res, next) => {
    Order.findById(req.params.orderId)
    .select('-order.otpCode')
    .populate({
        path: 'order.items.productId',
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

router.delete('/:orderId', checkAuth, (req, res, next) => {
    const id = req.params.orderId;
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

router.patch('/:orderId', (req, res, next) => {
    const id = req.params.orderId;
    // const updateOps = {};
    // console.log(req.body);
    // for(const ops of req.body){
    //     updateOps[ops.propName] = ops.value;
    // }
    // console.log("req.body.otpCode: ", req.body.otpItem.otpCode)
    if (req.body.otpItem && req.body.otpItem.otpCode) {
        var otpVerified = false;    
        nexmo.verifyOtp(req.body.otpItem.otpCode, id).then(
            result => {
                // console.log('result: ', result);
                otpVerified = result;
                // otpVerified = true;
                if (otpVerified) {
                    Order.update({ _id: id }, { $set: {'order.status': 2} })
                    .exec()
                    .then(result => {
                        // console.log("Updated: ", result);
                        try{
                            nexmo.sendConfirmationSms(id);
                            pushNotification();
                        } catch (error) {
                            console.log(error);
                        }
                        res.status(200).json({
                            message: 'Order updated'
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({
                            error: err
                        });
                    });
                } else {
                    res.status(401).json({
                        message: 'Invalid OTP'
                    });
                }
        })
        .catch(
            err => {
                console.log(err);
                res.status(500).json({
                error: err
                });
            }
        )
    } else {
        // checkAuth(req, res, next);
        const updateOps = {};
        for(const ops of req.body){
            updateOps[ops.propName] = ops.value;
        }
        Order.update({ _id: id }, { $set: updateOps })
        .exec()
        .then(result => {
            if(result.n > 0) {
                res.status(200).json({
                message: 'Order updated'
                });
            } else {
                res.status(401).json({
                message: 'Order not found'
                });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
    }
    
});

module.exports = router;
