const Nexmo = require('nexmo');
const Order = require('../models/order');

const nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
});

const from = "CherryBrooklyn";
const otpText = "Thank you for Ordering from CherryBrooklyn. Your OTP is: ";

module.exports = {
    sendOtp: (otpCode, to) => {
        console.log("GHUSA => ", otpCode, to);
        nexmo.message.sendSms(from, '91'+to, otpText + otpCode);
    },
    verifyOtp: async (otpCode, orderId) => {
        var result = Order.findById(orderId)
        .exec()
        .then(orderDetail => {
            return (orderDetail.order.status == 1 && orderDetail.order.otpCode == otpCode);
        })
        .catch(err => {
            return err;
        })
        return result;
    },
    sendConfirmationSms: (orderId) => {
        Order.findById(orderId)
        .exec()
        .then(orderDetail => {
            const orderConfirmText = "Your order from CherryBrooklyn with orderId: " + orderId + 
                " has been Placed Successfully and will be delivered soon.";
            nexmo.message.sendSms(from, '91'+orderDetail.order.phone, orderConfirmText);
        })
        .catch(err => {
            return err;
        })

    }
}
