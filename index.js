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

$(function () {
  $("#do-popup").click(function () {
    $("#PopupWindow").css("display", "block");
    return false;
  });
  $(window).click(function () {
    $("#PopupWindow").css("display", "none");
  });
});
