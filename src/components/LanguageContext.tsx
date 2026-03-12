
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const translations: Translations = {
  app_name: { en: 'MandiConnect', hi: 'मंडीकनेक्ट' },
  welcome: { en: 'Welcome to MandiConnect', hi: 'मंडीकनेक्ट में आपका स्वागत है' },
  select_role: { en: 'I am a...', hi: 'मैं एक हूँ...' },
  farmer: { en: 'Farmer', hi: 'किसान' },
  retailer: { en: 'Retailer', hi: 'रिटेलर' },
  marketplace: { en: 'Marketplace', hi: 'बाज़ार' },
  my_listings: { en: 'My Listings', hi: 'मेरी लिस्टिंग' },
  add_crop: { en: 'Add New Crop', hi: 'नई फसल जोड़ें' },
  crop_name: { en: 'Crop Name', hi: 'फसल का नाम' },
  quantity: { en: 'Quantity', hi: 'मात्रा' },
  price_unit: { en: 'Price / Unit', hi: 'कीमत / इकाई' },
  submit: { en: 'Submit', hi: 'जमा करें' },
  offline_msg: { en: 'You are offline. Data saved locally.', hi: 'आप ऑफलाइन हैं। डेटा स्थानीय रूप से सहेजा गया।' },
  sync_now: { en: 'Sync Now', hi: 'अभी सिंक करें' },
  search: { en: 'Search crops...', hi: 'फसलें खोजें...' },
  settings: { en: 'Settings', hi: 'सेटिंग्स' },
  language: { en: 'Language', hi: 'भाषा' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
