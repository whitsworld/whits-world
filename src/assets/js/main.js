/* ============================================================================
   WHIT'S WORLD — main.js
   ============================================================================
   Small, dependency-free vanilla JavaScript. There is nothing to build or
   compile here — this file is shipped to the browser exactly as written.

   What it does:
     1. Opens/closes the mobile menu
     2. Powers the category filter buttons on the Shop page
     3. Keeps the footer copyright year current
   ========================================================================= */

document.addEventListener('DOMContentLoaded', function () {
  // ---- 1. Mobile nav toggle ------------------------------------------------
  var toggle = document.querySelector('.nav-toggle');
  var mobileNav = document.getElementById('nav-mobile');

  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close the menu when a link inside it is clicked
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- 2. Shop page category filters ---------------------------------------
  // Any button with data-filter="beauty" will show only the items whose
  // data-categories attribute (on the product card) includes "beauty".
  // data-filter="all" (or no matching buttons at all) shows everything.
  var filterBar = document.querySelector('[data-filter-bar]');
  if (filterBar) {
    var buttons = filterBar.querySelectorAll('button[data-filter]');
    var items = document.querySelectorAll('[data-shop-item]');

    function applyFilter(filter, clickedBtn) {
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b === clickedBtn ? 'true' : 'false');
      });
      items.forEach(function (item) {
        var categories = (item.getAttribute('data-categories') || '').split(' ');
        var show = filter === 'all' || categories.indexOf(filter) !== -1;
        item.hidden = !show;
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyFilter(btn.getAttribute('data-filter'), btn);
      });
    });

    // Allow linking straight to a filtered view, e.g. /shop/?filter=beauty
    // or /shop/#gifts
    var params = new URLSearchParams(window.location.search);
    var requested = params.get('filter') || window.location.hash.replace('#', '');
    if (requested) {
      var match = filterBar.querySelector('button[data-filter="' + requested + '"]');
      if (match) applyFilter(requested, match);
    }
  }

  // ---- 3. Footer year -------------------------------------------------------
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
});
