import Stripe from "stripe"
import { features } from "@/config/features"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe: Stripe | null = features.stripe && stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
      appInfo: { name: "Lashpop", version: "0.1.0" }
    })
  : null
