import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './css/LanguageFloatingButton.css';

const STORAGE_KEY = 'appLanguage';

export default function LanguageFloatingButton() {
  const { i18n } = useTranslation();

  const current = (i18n.language || 'ar').split('-')[0];
  const next = current === 'ar' ? 'en' : 'ar';

  const label = useMemo(() => (next === 'ar' ? 'AR' : 'EN'), [next]);

  useEffect(() => {
    const dir = current === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = current;
    document.documentElement.dir = dir;
  }, [current]);

  const toggleLanguage = async () => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors (private mode, blocked storage, etc.)
    }
    await i18n.changeLanguage(next);
  };

  return (
    <button
      type="button"
      className="language-fab"
      onClick={toggleLanguage}
      aria-label="Change language"
      title="Change language"
    >
      {label}
    </button>
  );
}
