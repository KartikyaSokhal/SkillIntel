const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid value: ${err.value} — expected a valid ${err.kind}`;
    }
    if (err.name === 'ValidationError') {
        statusCode = 422;
        const fields = Object.values(err.errors).map(e => e.message);
        message = `Validation failed: ${fields.join(', ')}`;
    }
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired';
    }
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate value for field: ${field}`;
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
module.exports = errorHandler;
