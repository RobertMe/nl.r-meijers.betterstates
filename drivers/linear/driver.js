'use strict';

const SingleStateContainerDriver = require('../../lib/drivers/SingleStateContainerDriver');
const StateContainer = require('../../lib/containers/LinearStateContainer');

class StateContainerDriver extends SingleStateContainerDriver {
    constructor() {
        super('linear');
    }

    _createContainer(settings) {
        return new StateContainer(settings);
    }
}

module.exports = new StateContainerDriver();
