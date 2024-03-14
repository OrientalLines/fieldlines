if (window["loadFirebugConsole"]) {
  window.loadFirebugConsole();
} else {
  if (!window["console"]) window.console = {};
  if (!window.console["time"]) window.console.time = function () {};
  if (!window.console["timeEnd"]) window.console.timeEnd = function () {};
  if (!window.console["debug"]) window.console.debug = function () {};
  if (!window.console["info"]) window.console.info = function () {};
  if (!window.console["log"]) window.console.log = function () {};
  if (!window.console["warn"]) window.console.warn = function () {};
  if (!window.console["profile"]) window.console.profile = function () {};
  if (!window.console["profileEnd"]) window.console.profileEnd = function () {};
  if (!window.console["trace"]) window.console.trace = function () {};
  if (!window.console["error"]) window.console.error = function () {};
}

let lastPopupActivationTime = 0;
const popupActivationInterval = 100; // 0.5 seconds in milliseconds

document.getElementById("do-popup").addEventListener("click", function () {
  debugger
  document.getElementById("PopupWindow").style.display = "block";
  return false;
});
document.getElementById("do-popup").addEventListener("tap", function () {
  debugger
  document.getElementById("PopupWindow").style.display = "block";
  return false;
});


window.addEventListener("click", function () {
  document.getElementById("PopupWindow").style.display = "none";
});
window.addEventListener("tap", function () {
  document.getElementById("PopupWindow").style.display = "none";
});


let lastTouchTime = 0;
const touchInterval = 100;

document.getElementById("do-popup").addEventListener("touchstart", function (event) {
  const currentTime = Date.now();

  if (currentTime - lastTouchTime >= touchInterval) {
    document.getElementById("PopupWindow").style.display = "block";
    lastTouchTime = currentTime;
    return false;
  }
});

window.addEventListener("touchstart", function (event) {
  const currentTime = Date.now();

  if (currentTime - lastTouchTime >= touchInterval) {
    document.getElementById("PopupWindow").style.display = "none";
    lastTouchTime = currentTime;
  }
});
