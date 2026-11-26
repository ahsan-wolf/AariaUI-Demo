/* Adds/removes the .is-invalid class on the control a validator is attached to.
   Include AFTER the ASP.NET validation script (end of the page or the Scripts placeholder).
   Works with the client-side validation that WebUIValidation.js performs; server-side-only
   validation can add the class in code-behind: txtName.CssClass += " is-invalid"; */
(function () {
  function init() {
    if (typeof window.ValidatorUpdateDisplay !== 'function' || !window.Page_Validators) return;
    var original = window.ValidatorUpdateDisplay;
    window.ValidatorUpdateDisplay = function (val) {
      original.apply(this, arguments);
      var ctl = val && val.controltovalidate ? document.getElementById(val.controltovalidate) : null;
      if (!ctl) return;
      var invalid = false;
      for (var i = 0; i < Page_Validators.length; i++) {
        var v = Page_Validators[i];
        if (v.controltovalidate === val.controltovalidate && v.isvalid === false) { invalid = true; break; }
      }
      ctl.classList.toggle('is-invalid', invalid);
    };
  }
  if (document.readyState === 'complete') init(); else window.addEventListener('load', init);
})();
