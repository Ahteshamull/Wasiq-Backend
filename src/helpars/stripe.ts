import Stripe from "stripe";
import config from "../config";

let client: Stripe | null = null;

function getStripe(): Stripe {
  if (!config.stripe.secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!client) {
    client = new Stripe(config.stripe.secretKey, {
      apiVersion: "2026-01-28.clover" as any,
    });
  }
  return client;
}

const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const instance = getStripe();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export default stripe;
