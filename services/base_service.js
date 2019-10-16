const {flatten, any } = require('./utils');


class BaseService{
    constructor(){
        this.errors = [];
        this.errorCode = null;
    }

    addErrors(errArray){
        this.errors.push(errArray);
        this.errors = flatten(this.errors);
    }

    anyErrors(){
        return ((this.errors.length > 0) ? true : false);
    }
}

module.exports = BaseService;