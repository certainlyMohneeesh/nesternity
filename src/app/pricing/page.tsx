import { STRIPE_PLANS } from '@/lib/stripe'
import { PricingCard } from '@/components/shared/PricingCard'

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">
          Select the perfect plan for your team's productivity needs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingCard
          plan={STRIPE_PLANS.FREE}
          isPopular={false}
          ctaText="Get Started"
          ctaAction="free"
        />
        <PricingCard
          plan={STRIPE_PLANS.STANDARD}
          isPopular={true}
          ctaText="Start Free Trial"
          ctaAction="subscription"
        />
        <PricingCard
          plan={STRIPE_PLANS.PRO}
          isPopular={false}
          ctaText="Contact Sales"
          ctaAction="subscription"
        />
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          <div>
            <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
            <p className="text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
            <p className="text-gray-600">
              Yes, all paid plans come with a 14-day free trial. No credit card required.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">
              We accept all major credit cards, UPI, and bank transfers through Stripe.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-600">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
