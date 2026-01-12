import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  FileText,
  Download,
  Lightbulb,
  CreditCard,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

const paymentMethodIcons = {
  stripe: CreditCard,
  paypal: DollarSign,
  venmo: DollarSign,
  cashapp: DollarSign,
  direct: DollarSign,
};

export default function MyEarnings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [earnings, setEarnings] = useState({
    total: 0,
    pending: 0,
    completed: 0,
  });
  const [payments, setPayments] = useState({
    total: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) {
        toast.error("Please log in to view your earnings");
        return;
      }
      setCurrentUser(user);

      // Fetch all transactions where user is either payer or payee
      const [receivedTransactions, sentTransactions] = await Promise.all([
        base44.entities.Transaction.filter({ payee_email: user.email }, "-created_date"),
        base44.entities.Transaction.filter({ payer_email: user.email }, "-created_date"),
      ]);

      const allTransactions = [
        ...receivedTransactions.map(t => ({ ...t, direction: 'received' })),
        ...sentTransactions.map(t => ({ ...t, direction: 'sent' })),
      ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      setTransactions(allTransactions);

      // Calculate earnings (money received)
      const completedEarnings = receivedTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.net_amount, 0);
      
      const pendingEarnings = receivedTransactions
        .filter(t => t.status === 'pending' || t.status === 'processing')
        .reduce((sum, t) => sum + t.net_amount, 0);

      const totalEarnings = receivedTransactions
        .reduce((sum, t) => sum + t.net_amount, 0);

      setEarnings({
        total: totalEarnings,
        pending: pendingEarnings,
        completed: completedEarnings,
      });

      // Calculate payments (money sent)
      const completedPayments = sentTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.gross_amount, 0);
      
      const totalPayments = sentTransactions
        .reduce((sum, t) => sum + t.gross_amount, 0);

      setPayments({
        total: totalPayments,
        completed: completedPayments,
      });

    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transaction data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const TransactionItem = ({ transaction }) => {
    const isReceived = transaction.direction === 'received';
    const PaymentIcon = paymentMethodIcons[transaction.payment_method] || DollarSign;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isReceived ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {isReceived ? (
                  <ArrowDownLeft className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {transaction.project_title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {isReceived ? `From ${transaction.payer_name}` : `To ${transaction.payee_name}`}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusColors[transaction.status]}>
                    {transaction.status}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <PaymentIcon className="w-3 h-3" />
                    {transaction.payment_method}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(transaction.created_date))} ago
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold text-lg ${
                isReceived ? 'text-green-600' : 'text-gray-900'
              }`}>
                {isReceived ? '+' : '-'}{formatCurrency(isReceived ? transaction.net_amount : transaction.gross_amount)}
              </p>
              {isReceived && transaction.marketplace_fee > 0 && (
                <p className="text-xs text-gray-500">
                  Fee: -{formatCurrency(transaction.marketplace_fee)}
                </p>
              )}
            </div>
          </div>
          {transaction.description && (
            <p className="text-sm text-gray-600 mt-2 border-t pt-2">
              {transaction.description}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Earnings</h1>
          <p className="text-gray-600">Track your project funding and payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <DollarSign className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-green-100 text-sm mb-1">Total Earnings (After Fees)</p>
              <p className="text-3xl font-bold">{formatCurrency(earnings.total)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Pending Earnings</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.pending)}</p>
              <p className="text-xs text-gray-500 mt-1">Processing payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Paid Out</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(payments.completed)}</p>
              <p className="text-xs text-gray-500 mt-1">Your contributions</p>
            </CardContent>
          </Card>
        </div>

        {/* Marketplace Fee Info */}
        <Card className="mb-8 border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  3% Marketplace Fee
                </h3>
                <p className="text-sm text-gray-700">
                  Collab Unity charges a 3% fee on all transactions to maintain the platform and provide features like secure payments, project hosting, and collaboration tools. The amounts shown above are after deducting this fee.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-purple-600" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="all">All Transactions</TabsTrigger>
                <TabsTrigger value="received">Received</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transactions yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Start funding projects or receiving payments to see your transaction history
                    </p>
                  </div>
                ) : (
                  transactions.map(transaction => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="received" className="space-y-4">
                {transactions.filter(t => t.direction === 'received').length === 0 ? (
                  <div className="text-center py-12">
                    <ArrowDownLeft className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No received payments yet</p>
                  </div>
                ) : (
                  transactions
                    .filter(t => t.direction === 'received')
                    .map(transaction => (
                      <TransactionItem key={transaction.id} transaction={transaction} />
                    ))
                )}
              </TabsContent>

              <TabsContent value="sent" className="space-y-4">
                {transactions.filter(t => t.direction === 'sent').length === 0 ? (
                  <div className="text-center py-12">
                    <ArrowUpRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No sent payments yet</p>
                  </div>
                ) : (
                  transactions
                    .filter(t => t.direction === 'sent')
                    .map(transaction => (
                      <TransactionItem key={transaction.id} transaction={transaction} />
                    ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}