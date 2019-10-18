const isEmpty = (object) => {
    return (Object.keys(object).length == 0 ? true : false)
}

module.exports.isEmpty = isEmpty;

const any =  (arr) => {
    if (!Array.isArray(arr)) {
        if (arr == null || arr == undefined) return false;
        if (typeof(arr) == 'object')         return (!isEmpty(arr));
    } else {
        return ((arr.length > 0 ) ? true : false)
    }
}

module.exports.any = any;

/*


    function syncError(func: Promise): Array


    Example:
    --------------------------------------------------------
    let [err, user] = await syncError(models.User.create({
            username: null,
            email: "abc"
    }))
 */

const syncError = async (func) => {
    const sequelizeErrors = ['SequelizeUniqueConstraintError', 'SequelizeValidationError']
    try {
        let value = await func;

        return [value, []];
    } catch (e) {
        let errors = [];

        if (sequelizeErrors.includes(e.name)) {
            errors = e.errors.map(error => { return error.message})
            return [null, errors];
        } else {
            throw e;
        }
    }
}

module.exports.syncError = syncError;

/* Flattens an array ***/
const flatten = (arr) => {
    return [].concat.apply([], arr)
}

module.exports.flatten = flatten;