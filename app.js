const express = require('express');
const app = express();
const mongoose = require('mongoose');

// for logging requests
const morgan = require('morgan');

// for extracting incoming body
const bodyParser = require('body-parser');

const productRoutes = require('./api/routes/productsRoute');
const orderRoutes = require('./api/routes/ordersRoute');
const userRoutes = require('./api/routes/userRoute');

mongoose.connect('mongodb://cherrybrooklyn:'+ process.env.MONGO_ATLAS_PASSWORD + '@cherrybrooklyn-shard-00-00-af8qu.mongodb.net:27017,cherrybrooklyn-shard-00-01-af8qu.mongodb.net:27017,cherrybrooklyn-shard-00-02-af8qu.mongodb.net:27017/test?ssl=true&replicaSet=CherryBrooklyn-shard-0&authSource=admin&retryWrites=true', {
    useNewUrlParser: true
});

mongoose.Promise = global.Promise;

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    req.header('Access-Control-Allow-Origin', '*');
    req.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if(req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
})

app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/user', userRoutes);

app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
})

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    })
})
module.exports = app;
