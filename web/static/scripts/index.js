import * as alert from './alert.js'
import { Model } from './model.js'

import { MainReaderView } from './mainReaderView.js';
import { SidebarParagraphView } from './sidebarParagraphView.js';
import { SidebarLoadDocumentView } from './sidebarLoadDocumentView.js';
import { AudioController } from './audioController.js';
import { SaveDocumentPositionController } from './saveDocumentPosition.js';

import { DocumentUploader } from './documentUploader.js';

window.addEventListener('load', load);

// Model for the application.
var model;

// Controllers for the application.
var audioController;
var saveDocumentPositionController;

// Views for the application.
var mainReaderView;
var sidebarParagraphView;
var sidebarLoadDocumentView;

var documentUploader;

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
    saveDocumentPositionController = new SaveDocumentPositionController(model, audioController);

    documentUploader = new DocumentUploader(model);

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
    model.addEventListener('documentOpened', (e) => {
        let d = e.detail;
        alert.alert('Document opened: ' + d.name);

        model.currentDocument.addEventListener('documentLoaded', () => {
            alert.success('Document loaded: ' + d.name);
        });
    });
    // saveDocumentPositionController.loadLastDocument();
}
