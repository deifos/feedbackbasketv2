"use client"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Filter, RefreshCw } from 'lucide-react';
import type { PaymentRecord } from '@/lib/services/payment-service';
import type { PaymentStatus, SubscriptionPlan } from '@/app/generated/prisma';

// interface UserPaymentHistoryProps {
//   userId?: string; // If not provided, will show current user's payments
// }

interface PaymentFilters {
  status?: PaymentStatus;
  plan?: SubscriptionPlan;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

interface PaymentSummary {
  totalPayments: number;
  totalRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  planBreakdown: Record<SubscriptionPlan, { count: number; revenue: number }>;
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [filters, setFilters] = useState<PaymentFilters>({
    limit: 50,
    offset: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchPayments = useCallback(async (newFilters = filters, append = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (newFilters.status) params.set('status', newFilters.status);
      if (newFilters.plan) params.set('plan', newFilters.plan);
      if (newFilters.dateFrom) params.set('dateFrom', newFilters.dateFrom);
      if (newFilters.dateTo) params.set('dateTo', newFilters.dateTo);
      if (newFilters.limit) params.set('limit', newFilters.limit.toString());
      if (newFilters.offset) params.set('offset', newFilters.offset.toString());
      
      // Include summary on first load
      if (!append) params.set('includeSummary', 'true');

      const response = await fetch(`/api/admin/payments?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment data');
      }

      const data = await response.json();
      
      if (append) {
        setPayments(prev => [...prev, ...data.payments]);
      } else {
        setPayments(data.payments);
        if (data.summary) setSummary(data.summary);
      }
      
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (key: keyof PaymentFilters, value: unknown) => {
    const newFilters = { ...filters, [key]: value, offset: 0 };
    setFilters(newFilters);
    fetchPayments(newFilters);
  };

  const handleLoadMore = () => {
    const newFilters = { ...filters, offset: payments.length };
    setFilters(newFilters);
    fetchPayments(newFilters, true);
  };

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

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPlanBadge = (plan: SubscriptionPlan) => {
    const colors = {
      FREE: 'secondary',
      STARTER: 'default',
      PRO: 'default',
    } as const;

    return <Badge variant={colors[plan]}>{plan}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalPayments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalPayments > 0 
                  ? Math.round((summary.successfulPayments / summary.totalPayments) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.failedPayments}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment History</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPayments()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => handleFilterChange('status', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="SUCCEEDED">Succeeded</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Plan</label>
                <Select
                  value={filters.plan || ''}
                  onValueChange={(value) => handleFilterChange('plan', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All plans</SelectItem>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="PRO">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">From Date</label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">To Date</label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {error && (
            <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.userName}</div>
                        <div className="text-sm text-gray-500">{payment.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getPlanBadge(payment.planAtPayment)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      {payment.billingCycle && (
                        <Badge variant="outline">{payment.billingCycle}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {payment.description}
                      {payment.status === 'FAILED' && payment.failureReason && (
                        <div className="text-red-600 text-xs mt-1">
                          {payment.failureReason}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {payments.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No payments found matching your criteria.
            </div>
          )}

          {hasMore && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing {payments.length} of {total} payments
          </div>
        </CardContent>
      </Card>
    </div>
  );
}