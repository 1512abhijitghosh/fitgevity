// Web stub - Stripe React Native is not available on web.
export const useStripe = () => ({
  initPaymentSheet: async () => ({ error: { message: "Stripe is only available on iOS/Android.", code: "WebUnsupported" } }),
  presentPaymentSheet: async () => ({ error: { message: "Stripe is only available on iOS/Android.", code: "WebUnsupported" } }),
});
