import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createPaymentIntent } from "@/functions/createPaymentIntent";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ amount, projectId, projectTitle, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message);
        toast.error(error.message);
      } else {
        toast.success("Payment successful!");
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred.");
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {errorMessage && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {isProcessing ? "Processing..." : `Pay $${(amount / 100).toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
};

export default function StripeCheckout({ projectId, projectTitle, onSuccess, onCancel }) {
  const [amount, setAmount] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [feeBreakdown, setFeeBreakdown] = useState(null);

  // Check if running in iframe
  const isInIframe = window.self !== window.top;

  if (isInIframe) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-gray-900 mb-2">
            Checkout Not Available in Preview
          </h3>
          <p className="text-sm text-gray-700">
            For security reasons, payments can only be processed from the published app.
            Please open this page in a new tab to complete your payment.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCreatePaymentIntent = async () => {
    const amountInDollars = parseFloat(amount);
    
    if (!amountInDollars || amountInDollars < 0.50) {
      toast.error("Minimum amount is $0.50");
      return;
    }

    setIsCreatingIntent(true);
    try {
      const { data } = await createPaymentIntent({
        project_id: projectId,
        amount: amountInDollars,
        description: `Funding for ${projectTitle}`,
      });

      setClientSecret(data.clientSecret);
      setFeeBreakdown({
        gross: data.amount,
        fee: data.fee,
        net: data.netAmount,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      toast.error("Failed to initialize payment. Please try again.");
    } finally {
      setIsCreatingIntent(false);
    }
  };

  if (clientSecret) {
    const options = {
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#7c3aed',
        },
      },
    };

    return (
      <div className="space-y-4">
        {feeBreakdown && (
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Amount:</span>
                  <span className="font-semibold">${(feeBreakdown.gross / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Marketplace Fee (3%):</span>
                  <span className="font-semibold text-purple-600">-${(feeBreakdown.fee / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-purple-300">
                  <span className="font-semibold text-gray-900">Project Owner Receives:</span>
                  <span className="font-bold text-green-600">${(feeBreakdown.net / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm
            amount={feeBreakdown.gross}
            projectId={projectId}
            projectTitle={projectTitle}
            onSuccess={onSuccess}
            onCancel={() => {
              setClientSecret("");
              setAmount("");
              setFeeBreakdown(null);
              if (onCancel) onCancel();
            }}
          />
        </Elements>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
          Fund This Project
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="amount" className="text-sm font-medium mb-2 block">
            Enter Amount (USD)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.50"
              placeholder="5.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Minimum: $0.50</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-xs text-gray-700">
            <span className="font-semibold">3% marketplace fee</span> will be deducted. 
            {amount && parseFloat(amount) >= 0.50 && (
              <span className="block mt-1">
                Project owner receives: <span className="font-semibold text-green-600">
                  ${(parseFloat(amount) * 0.97).toFixed(2)}
                </span>
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePaymentIntent}
            disabled={!amount || parseFloat(amount) < 0.50 || isCreatingIntent}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {isCreatingIntent ? "Initializing..." : "Continue to Payment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}