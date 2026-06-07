/* Lightweight data source for the News/Announcements section (showcase site). */
(function () {
  'use strict';
  var PPS = {
    get: function (k, def) {
      try { var v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); }
      catch (e) { return def; }
    },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    push: function (k, v) { var a = this.get(k, []); if (!Array.isArray(a)) a = []; a.unshift(v); this.set(k, a); return a; },
    removeAt: function (k, i) { var a = this.get(k, []); a.splice(i, 1); this.set(k, a); return a; }
  };

  // Default announcements (the 4 from the source site — admin can edit these)
  PPS.DEFAULT_NEWS = [
    { cat: 'Academics', title: 'Online Classes for the Students of Class 10 (Batch of 2021-22)', date: '', body: '' },
    { cat: 'Examinations', title: '2020-21 Batch of Class 10 — SSC Public Exam Update', date: '', body: '' },
    { cat: 'Campus', title: 'Opening of School post Covid Wave 3', date: '', body: '' },
    { cat: 'Announcement', title: 'Roll-out of New CMS / SMS for the school along with Web page', date: '', body: '' }
  ];
  // Seed announcements once
  if (PPS.get('ppsAnnouncements', null) == null) PPS.set('ppsAnnouncements', PPS.DEFAULT_NEWS);

  PPS.escape = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  window.PPS = PPS;
})();
