// ==UserScript==
// @name         Heures Hebdo — Auto-sync Factorial
// @namespace    https://heures-hebdo.vercel.app
// @version      1.0
// @description  Sync automatique des pointages Factorial vers Heures Hebdo
// @author       Paul Bindler
// @match        https://app.factorialhr.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const SUPABASE_URL = 'https://hmznrhoxeptkmstyavbc.supabase.co';
  const ANON_KEY     = 'sb_publishable_pWEsnpJBGmTpF-3HSqpSxg_fufOVNrF';
  const EMP_ID       = '2275641';
  const DAYS         = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

  function getSlug() {
    let slug = localStorage.getItem('hh_slug');
    if (!slug) {
      slug = prompt('Heures Hebdo — Identifiant ? (ex: paulb)');
      if (!slug) return null;
      localStorage.setItem('hh_slug', slug.trim());
    }
    return slug.trim();
  }

})();
