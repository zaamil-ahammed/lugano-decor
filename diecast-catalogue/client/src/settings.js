import { createContext, useContext } from 'react';

export const SettingsContext = createContext({ shopName: 'Diecast', tagline: '', whatsappNumber: '', setSettings: () => {} });
export const useSettings = () => useContext(SettingsContext);
