const SendOtp = require('sendotp');
const MSG91 = require('msg91-node-v2');
const Order = require('../models/order');

const msg91 = new MSG91(process.env.MSG_AUTH_API_KEY);

module.exports = {
    sendOtp: (otp, contactNumber) => {
        console.log("otpotpotp => " + otp);

    // let opt = {
    //     "sender": "CHERRY",
    //     "route": "4",
    //     "country": "91",
    //     "sms": [
    //             {
    //                 "message": "Thank you for ordering from CherryBrooklyn. Your OTP is: " + otp,
    //                 "to": ['91'+contactNumber]
    //             }
    //         ]
    //     }    
    //     msg91.send(opt).then((data) => {
    //             console.log(data);
    //             // in success you'll get object
    //             // {"message":"REQUET_ID","type":"success"}
    //         }).catch((error) => {
    //             // refer Handle error section
    //             console.log(error);
    //         });

        const sendOtp = new SendOtp(process.env.MSG_AUTH_API_KEY, "Thank you for ordering from CherryBrooklyn. Your OTP is: " + otp);
        sendOtp.send('91'+contactNumber, "CHERRY", otp, (error, data) => {
            if(data) {
                console.log(data);
            }
            if(error) {
                console.log(error);
            }
        });
    },
    verifyOtp: async (otpCode, orderId) => {
        var result = Order.findById(orderId)
        .exec()
        .then(orderDetail => {
            if (orderDetail.order.status > 1) {
                return false;
            }
            return (orderDetail.order.otpCode == otpCode);
        })
        .catch(err => {
            return err;
        })
        return result;
    },
    sendConfirmationSms: (orderId) => {
        console.log(orderId);
        Order.findById(orderId)
        .exec()
        .then(orderDetail => {
            // const orderConfirmText = "Your order from CherryBrooklyn with orderId: " + orderId + 
            //     " has been Placed Successfully and will be delivered soon.";
            // // nexmo.message.sendSms(from, '91'+orderDetail.order.phone, orderConfirmText);
            // sendConfirmation.send('91'+contactNumber, "CHERRY", otpCode, (error, data) => {
            //     console.log(data);
            // });

            let adminreceivers = process.env.SMS_CONTACTS.split(' ');
            let opts = {
                "sender": "CHERRY",
                "route": "4",
                "country": "91",
                "sms": [
                {
                    "message": "Your order from CherryBrooklyn amounted Rs." + orderDetail.order.finalAmount + " has been placed successfully and will be delivered soon.",
                    "to": [orderDetail.order.phone+""]
                },
                {
                    "message": "New order for - " + orderDetail.order.customerName + " - " + orderDetail.order.phone + ". Address: " + orderDetail.order.address + ". Amount: " + orderDetail.order.finalAmount + ".",
                    "to": adminreceivers
                }
                ]
            };
            // const sendConfirmation = new SendOtp(process.env.MSG_AUTH_API_KEY, "Your order from CherryBrooklyn with orderId: " + 1 + " has been Placed Successfully and will be delivered soon.")
            // sendConfirmation.send('91'+orderDetail.order.phone, "CHERRY", 1, (error, data) => {
            //     console.log(data);
            // });
            msg91.send(opts).then((data) => {
                console.log(data);
                // in success you'll get object
                // {"message":"REQUET_ID","type":"success"}
            }).catch((error) => {
                // refer Handle error section
                console.log(error);
            });
        })
        .catch(err => {
            return err;
        })

    }
}