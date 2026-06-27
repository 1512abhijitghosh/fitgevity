import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";

const pk = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_emergent";

export function StripeWrap({ children }: { children: React.ReactNode }) {
  return (
    <StripeProvider publishableKey={pk} urlScheme="frontend">
      {children}
    </StripeProvider>
  );
}
