'use client';

import React, { createContext, useCallback, useState } from 'react';
import deepmerge from 'deepmerge';

import { NextIntlClientProvider } from 'next-intl';

export const CommonIntlContext = createContext<any>(null);

const CommonIntlProvider = ({ children, locale, defaultMessages }: any) => {
  const [messages, setMessages] = useState(defaultMessages);

  const addMessages = useCallback((newMessages: any) => {
    setMessages((messages: any) => deepmerge(messages, newMessages));
  }, []);

  const commonIntlValue = React.useMemo(
    () => ({
      messages,
      addMessages,
    }),
    [messages, addMessages],
  );

  return (
    <CommonIntlContext.Provider value={commonIntlValue}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="Europe/Bucharest"
      >
        {children}
      </NextIntlClientProvider>
    </CommonIntlContext.Provider>
  );
};

export default CommonIntlProvider;
