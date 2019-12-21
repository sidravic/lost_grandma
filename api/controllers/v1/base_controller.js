const apiVersion = 1.0

const BaseController = {
    successResponse: (payload) => {

        return {
            api_version: apiVersion,
            data: {
                ...payload
            },
            errors: {
                messages: [],
                code: null,
            },
            success: true
        }
    },

    failureResponse: async (payload, errorMessages, errorCode) => {

        return {
            api_version: apiVersion,
            data: {
                ...payload
            },
            errors: {
                messages: errorMessages,
                code: errorCode,
            },
            success: false
        }
    },

    badRequest: async (errorMessages, data={}) => {

        return {
            api_version: apiVersion,
            data: data,
            errors: {
                messages: errorMessages,
                code: 'bad_request'
            },
            success: false
        }
    },

    unAuthorized: async (errorMessages) => {

        return {
            api_version: apiVersion,
            data: {

            },
            errors: {
                messages: errorMessages,
                code: 'unauthorized'
            },
            success: false
        }
    },

    notFound: (errorMessages) => {

        return {
            api_version: apiVersion,
            data: {

            },
            errors: {
                messages: errorMessages,
                code: 'not_found'
            },
            success: false
        }
    },

    internalError: (errorMessage=[]) => {
        return {
            api_version: apiVersion,
            data: {

            },
            errors: {
                messages: errorMessage,
                code: 'internal_error'
            },
            success: false
        }
    }
}

module.exports = BaseController