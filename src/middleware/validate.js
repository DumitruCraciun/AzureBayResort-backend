// backend/src/middleware/validate.js
const Joi = require('joi');

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                message: 'Validation failed',
                errors
            });
        }

        next();
    };
};

// Schemas for validation
const schemas = {
    // Register validation
    register: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.min': 'Password must be at least 6 characters long',
                'any.required': 'Password is required'
            }),
        full_name: Joi.string()
            .min(2)
            .max(100)
            .required()
            .messages({
                'string.min': 'Full name must be at least 2 characters long',
                'any.required': 'Full name is required'
            }),
        phone: Joi.string()
            .pattern(/^[0-9+\-\s()]+$/)
            .optional()
            .messages({
                'string.pattern.base': 'Please provide a valid phone number'
            })
    }),

    // Login validation
    login: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .required()
            .messages({
                'any.required': 'Password is required'
            })
    }),

    // Update profile validation
    updateProfile: Joi.object({
        full_name: Joi.string()
            .min(2)
            .max(100)
            .optional(),
        phone: Joi.string()
            .pattern(/^[0-9+\-\s()]+$/)
            .optional()
            .messages({
                'string.pattern.base': 'Please provide a valid phone number'
            })
    }),

    // Change password validation
    changePassword: Joi.object({
        currentPassword: Joi.string()
            .required()
            .messages({
                'any.required': 'Current password is required'
            }),
        newPassword: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.min': 'New password must be at least 6 characters long',
                'any.required': 'New password is required'
            })
    }),

    // Create booking
    createBooking: Joi.object({
        room_id: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.uuid': 'Invalid room ID format',
                'any.required': 'Room ID is required'
            }),
        check_in_date: Joi.date()
            .iso()
            .required()
            .messages({
                'date.base': 'Invalid check-in date format',
                'any.required': 'Check-in date is required'
            }),
        check_out_date: Joi.date()
            .iso()
            .greater(Joi.ref('check_in_date'))
            .required()
            .messages({
                'date.base': 'Invalid check-out date format',
                'date.greater': 'Check-out date must be after check-in date',
                'any.required': 'Check-out date is required'
            }),
        guest_count: Joi.number()
            .integer()
            .min(1)
            .max(10)
            .default(1)
            .messages({
                'number.min': 'At least 1 guest required',
                'number.max': 'Maximum 10 guests allowed'
            }),
        special_requests: Joi.string()
            .max(500)
            .optional()
            .messages({
                'string.max': 'Special requests cannot exceed 500 characters'
            })
    }), 

    updateBookingStatus: Joi.object({
        status: Joi.string()
            .valid('pending', 'confirmed', 'cancelled', 'completed')
            .required()
            .messages({
                'any.only': 'Status must be one of: pending, confirmed, cancelled, completed',
                'any.required': 'Status is required'
            })
    })
};

module.exports = {
    validate,
    schemas
};