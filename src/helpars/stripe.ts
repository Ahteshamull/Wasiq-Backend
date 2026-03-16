import Stripe from "stripe";
import config from "../config";

const stripe = new Stripe(config.stripe.secretKey as string, {
  apiVersion: "2026-01-28.clover" as any,
});

export default stripe;
