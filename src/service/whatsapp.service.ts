import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export const sendOTP = async (
  phone: string,
  countryCode: string,
  otp: string,
): Promise<{ success: boolean; messageID: string }> => {
  try {
    const response = await axios.post(
      config.whatsappApiUrl,
      {
        messaging_product: 'whatsapp',
        to: `${countryCode}${phone}`,
        type: 'template',
        template: {
          name: 'authentication_code_copy_code_button',
          language: { code: 'en_US' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: otp }],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [{ type: 'text', text: `${otp}` }],
            },
          ],
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.whatsappAuthToken}`,
        },
      },
    );

    return {
      // success: true,
      // messageID: 'mocked_id_for_testing',
      success: true,
      messageID: response?.data?.messages?.[0]?.id || 'unknown',
    };
  } catch (error) {
    logger.error({ error }, 'Error sending OTP via WhatsApp API');
    return { success: false, messageID: 'unknown' };
  }
};
