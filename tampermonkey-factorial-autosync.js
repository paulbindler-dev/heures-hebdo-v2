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

  function showToast(message, isError = false) {
    const existing = document.getElementById('hh-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'hh-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position:        'fixed',
      bottom:          '20px',
      right:           '20px',
      padding:         '10px 16px',
      borderRadius:    '8px',
      backgroundColor: isError ? '#fee2e2' : '#dcfce7',
      color:           isError ? '#991b1b' : '#166534',
      fontSize:        '13px',
      fontFamily:      'system-ui, sans-serif',
      boxShadow:       '0 2px 8px rgba(0,0,0,0.15)',
      zIndex:          '999999',
      opacity:         '1',
      transition:      'opacity 0.3s',
    });
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, isError ? 5000 : 2000);
  }

})();
