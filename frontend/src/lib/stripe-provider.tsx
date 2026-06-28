import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";

const pk = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

export function StripeWrap({ children }: { children: React.ReactElement | React.ReactElement[] }) {
  if (!pk) return <>{children}</>;

  return (
    <StripeProvider publishableKey={pk} urlScheme="frontend">
      {children}
    </StripeProvider>
  );
}
