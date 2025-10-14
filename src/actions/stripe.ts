"use server"

import {
  createCustomer,
  getCustomerByUserId,
  updateCustomerByStripeCustomerId,
  updateCustomerByUserId
} from "@/actions/customers"
import { SelectCustomer } from "@/db/schema/customers"
import { stripe } from "@/lib/stripe"
import { auth } from "@clerk/nextjs/server"
import Stripe from "stripe"
import { features } from "@/config/features"

type MembershipStatus = SelectCustomer["membership"]

const getMembershipStatus = (
  status: Stripe.Subscription.Status,
  membership: MembershipStatus
): MembershipStatus => {
  switch (status) {
    case "active":
    case "trialing":
      return membership
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "past_due":
    case "paused":
    case "unpaid":
      return "free"
    default:
      return "free"
  }
}

const getStripeOrThrow = (): Stripe => {
  const s = stripe
  if (!s) {
    throw new Error("Stripe is disabled")
  }
  return s
}

const getSubscription = async (subscriptionId: string) => {
  const s = getStripeOrThrow()
  return s.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"]
  })
}

export const updateStripeCustomer = async (
  userId: string,
  subscriptionId: string,
  customerId: string
) => {
  if (!features.stripe || !stripe) {
    return null
  }
  try {
    if (!userId || !subscriptionId || !customerId) {
      throw new Error("Missing required parameters for updateStripeCustomer")
    }

    const subscription = await getSubscription(subscriptionId)

    // Check if customer exists
    const existingCustomer = await getCustomerByUserId(userId)

    let result
    if (!existingCustomer) {
      // Create customer first
      const createResult = await createCustomer(userId)
      if (!createResult.isSuccess) {
        throw new Error("Failed to create customer profile")
      }

      // Then update with Stripe data
      result = await updateCustomerByUserId(userId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      })
    } else {
      // Customer exists, just update
      result = await updateCustomerByUserId(userId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      })
    }

    if (!result.isSuccess) {
      throw new Error("Failed to update customer profile")
    }

    return result.data
  } catch (error) {
    console.error("Error in updateStripeCustomer:", error)
    throw error instanceof Error
      ? error
      : new Error("Failed to update Stripe customer")
  }
}

export const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  productId: string
): Promise<MembershipStatus> => {
  if (!features.stripe || !stripe) {
    return "free"
  }
  try {
    if (!subscriptionId || !customerId || !productId) {
      throw new Error(
        "Missing required parameters for manageSubscriptionStatusChange"
      )
    }

    const subscription = await getSubscription(subscriptionId)
    const s = getStripeOrThrow()
    const product = await s.products.retrieve(productId)

    const membership = product.metadata?.membership

    if (!membership || !["free", "pro"].includes(membership)) {
      throw new Error(
        `Invalid or missing membership type in product metadata: ${membership}`
      )
    }

    const validatedMembership = membership as MembershipStatus

    const membershipStatus = getMembershipStatus(
      subscription.status,
      validatedMembership
    )

    const updateResult = await updateCustomerByStripeCustomerId(customerId, {
      stripeSubscriptionId: subscription.id,
      membership: membershipStatus
    })

    if (!updateResult.isSuccess) {
      throw new Error("Failed to update subscription status")
    }

    return membershipStatus
  } catch (error) {
    console.error("Error in manageSubscriptionStatusChange:", error)
    throw error instanceof Error
      ? error
      : new Error("Failed to update subscription status")
  }
}

export const createCheckoutUrl = async (
  paymentLinkUrl: string
): Promise<{ url: string | null; error: string | null }> => {
  if (!features.stripe) {
    return { url: null, error: "Stripe is disabled" }
  }
  try {
    const { userId } = await auth()

    if (!userId) {
      return { url: null, error: "User must be authenticated" }
    }

    if (!paymentLinkUrl) {
      return { url: null, error: "Payment link URL is required" }
    }

    // Add client_reference_id to the Stripe payment link
    const url = new URL(paymentLinkUrl)
    url.searchParams.set("client_reference_id", userId)

    return { url: url.toString(), error: null }
  } catch (error) {
    console.error("Error creating checkout URL:", error)
    return {
      url: null,
      error:
        error instanceof Error ? error.message : "Failed to create checkout URL"
    }
  }
}
