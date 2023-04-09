import * as alert from './alert.js'
import { Model } from './model.js'

import { MainReaderView } from './mainReaderView.js';
import { SidebarParagraphView } from './sidebarParagraphView.js';
import { SidebarLoadDocumentView } from './sidebarLoadDocumentView.js';
import { AudioController } from './audioController.js';

window.addEventListener('load', load);

// Model for the application.
var model;

// Views for the application.
var mainReaderView;
var sidebarParagraphView;
var sidebarLoadDocumentView;
var audioController;

function load() {
    console.log("Application loading...");
    init();
}

function init() {
    console.log("Application initializing...");

    model = new Model();

    mainReaderView = new MainReaderView(model);
    sidebarParagraphView = new SidebarParagraphView(model);
    sidebarLoadDocumentView = new SidebarLoadDocumentView(model);
    audioController = new AudioController(model);

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
    model.openDocument(model.documents[0].id).then(() => {
        // console.log(model.currentDocument);
    });
}
