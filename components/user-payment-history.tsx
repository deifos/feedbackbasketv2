import { auth } from '@/auth';
import { headers } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { paymentService } from '@/lib/services/payment-service';
import type { PaymentStatus } from '@/app/generated/prisma';
import { RefreshButton } from './refresh-button';

export async function UserPaymentHistory() {
  // Get the authenticated session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Please sign in to view your payment history.</p>
        </CardContent>
      </Card>
    );
  }

  // Fetch user's payment history on the server
  let payments: unknown[] = [];
  let error: string | null = null;

  try {
    const result = await paymentService.getPaymentHistory({
      userId: session.user.id,
      limit: 100,
    });
    payments = result.payments;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to fetch payment history';
  }

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const variants = {
      SUCCEEDED: 'default',
      FAILED: 'destructive',
      PENDING: 'secondary',
      REFUNDED: 'outline',
      PARTIALLY_REFUNDED: 'outline',
    } as const;

    const labels = {
      SUCCEEDED: 'Paid',
      FAILED: 'Failed',
      PENDING: 'Pending',
      REFUNDED: 'Refunded',
      PARTIALLY_REFUNDED: 'Partial Refund',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment History</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              View your subscription payment records and billing history
            </p>
          </div>
          <RefreshButton />
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded border border-red-200">
            {error}
          </div>
        )}

        {!error && payments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No payment history yet</p>
            <p className="text-sm">Your subscription payments will appear here once you upgrade to a paid plan.</p>
          </div>
        )}

        {payments.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.planAtPayment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.billingCycle && (
                        <Badge variant="secondary">
                          {payment.billingCycle}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs">
                      <div className="truncate">
                        {payment.description || 'Subscription payment'}
                      </div>
                      {payment.status === 'FAILED' && payment.failureReason && (
                        <div className="text-red-600 text-xs mt-1 truncate">
                          {payment.failureReason}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {payments.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing {payments.length} payment{payments.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}