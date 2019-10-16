module.exports.isEmpty = (object) => {
    return (Object.keys(object).length == 0 ? true : false)
}

module.exports.any =  (arr) => {
    if (!Array.isArray(arr)) {
        if (arr == null || arr == undefined) return false;
        if (typeof(arr) == 'object') { throw new Error('Invalid error datatype')}
    } else {
        return ((arr.length > 0 ) ? true : false)
    }
}

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
    try {
        let value = await func;

        return [value, []];
    } catch (e) {
        let errors = [];

        if (e.name == 'SequelizeValidationError') {
            errors = e.errors.map(error => error.message)
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