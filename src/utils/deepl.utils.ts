import axios from 'axios';

export const translateText = async (text: string, targetLanguage: string) => {
  const apiKey = '64221e1a-30c5-4397-a85d-19e3cfab07d3:fx';
  const endpoint = 'https://api-free.deepl.com/v2/translate';

  try {
    const response = await axios.post(endpoint, null, {
      params: {
        auth_key: apiKey,
        text: text,
        target_lang: targetLanguage.toUpperCase(),
      },
    });

    return response.data.translations[0].text;
  } catch (error: any) {
    console.error(
      'Error during translation:',
      error.response ? error.response.data : error.message,
    );
  }
};
