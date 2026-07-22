import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/**
 * Lazy initialization of Stripe SDK.
 * Never throws at module startup time if STRIPE_SECRET_KEY is missing.
 */
export function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-01-27.acacia' as any,
      appInfo: {
        name: 'Karrents Security Intelligence',
        version: '2.0.0'
      }
    });
  }
  return stripeClient;
}

export interface StripeCheckoutOptions {
  planName: string;
  priceAmount: number;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createStripeCheckoutSession(options: StripeCheckoutOptions) {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: options.customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Karrents - ${options.planName} Plan`,
            description: `Full security intelligence & automated auditing access for ${options.planName}.`,
          },
          unit_amount: options.priceAmount * 100, // cents
          recurring: {
            interval: 'month'
          }
        },
        quantity: 1
      }
    ],
    success_url: `${options.successUrl}?session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(options.planName)}`,
    cancel_url: options.cancelUrl
  });

  return session;
}

export async function createStripePortalSession(customerId: string, returnUrl: string) {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });

  return session;
}
