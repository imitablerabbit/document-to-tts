import gsap from "gsap";

var alertContainer;

const alertClass = 'alert'
const successClass = 'success';
const errorClass = 'error'

// Initialize the alert container. Returns a promise that resolves when the
// container has been initialized for alerts.
export function init() {
    return new Promise((resolve, reject) => {
        alertContainer = document.getElementById('alert-container');
        resolve();
    });
}

export function alert(content) {
    createAlert(content);
}

export function success(content) {
    createAlert("Success: " + content, successClass);
}

export function error(content) {
    createAlert("Error: " + content, errorClass);
}

function createAlert(content, ...alertClasses) {
    var alertElement = generateAlertElement('section', content, alertClasses);
    if (alertContainer != null) {
        alertContainer.appendChild(alertElement);
    }

    alertElement.style.opacity = "0%";
    alertElement.style.right = "-100%";
    var tl = gsap.timeline({delay: 0});
    tl.to(alertElement, {
            opacity: "100%",
            right: "0%",
            duration: 0.5
        })
       .to(alertElement, {bottom: "10px", duration: 0.2})
       .to(alertElement, {bottom: "0px", duration: 0.2});

    setTimeout(() => closeAlert(alertElement), 5 * 1000);
}

function generateAlertElement(tag, content, ...alertClasses) {
    var alertElement = document.createElement(tag);
    alertElement.className = alertClass + " " + alertClasses.join(" ");

    var alertTextElement = document.createElement('p');
    alertTextElement.innerHTML = content;

    var alertCloseButton = document.createElement('button');
    alertCloseButton.className = "close";
    alertCloseButton.innerText = 'x';
    alertCloseButton.addEventListener('click', event => closeAlert(alertElement));

    alertElement.appendChild(alertTextElement);
    alertElement.appendChild(alertCloseButton);
    return alertElement;
}

function closeAlert(alertElement) {
    var tl3 = gsap.timeline({delay: 0});
    tl3.to(alertElement, {
        right: "-100%",
        opacity: "0",
        duration: 0.5,
        onComplete: () => alertElement.remove()
    });
}
