import * as alert from './alert.js'
import { Model } from './model.js'

window.addEventListener('load', load);

var model;

function load() {
    console.log("Application loading...");
    init();
}

function init() {
    console.log("Application initializing...");

    model = new Model();

    // Initialize all modules. We need to wait for all of them to finish
    // before we can start the application.
    let alertPromise = alert.init().then(() => {
        console.log("Alert module initialized.")
    });
    let modelPromise = model.loadDocuments().then(() => {
        console.log("Model loaded.")
    });
    let promises = [
        alertPromise,
        modelPromise
    ];
    Promise.allSettled(promises).then(() => {
        start();
    });
}

function start() {
    console.log("Application started.");
    console.log(model);
}
