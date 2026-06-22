import { supabase } from './supabase';

export class MakyPayService {
  private static readonly BASE_URL = 'https://wire-api.makylegacy.com/api/v1';
  private static readonly AUTH_HEADER = process.env.MAKYPAY_BASE64_AUTH || '';
  private static readonly API_KEY = process.env.MAKYPAY_API_KEY || '';
  private static readonly API_SECRET = process.env.MAKYPAY_API_SECRET || '';

  private static getAuthHeader(): string {
    if (this.AUTH_HEADER) return `Basic ${this.AUTH_HEADER}`;
    if (this.API_KEY && this.API_SECRET) {
      return `Basic ${Buffer.from(`${this.API_KEY}:${this.API_SECRET}`).toString('base64')}`;
    }
    throw new MakyPayException('MakyPay credentials not configured');
  }

  private static async request<T>(
    endpoint: string,
    options: { method?: string; body?: any; isFormData?: boolean } = {}
  ): Promise<T> {
    const { method = 'GET', body, isFormData = false } = options;
    const headers: Record<string, string> = {
      Authorization: this.getAuthHeader(),
      Accept: 'application/json',
    };
    let requestBody: any;
    if (body) {
      if (isFormData) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        requestBody = new URLSearchParams(body).toString();
      } else {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(body);
      }
    }
    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, { method, headers, body: requestBody });
      const data = await response.json();
      if (!response.ok) {
        throw new MakyPayException(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      return data;
    } catch (error) {
      if (error instanceof MakyPayException) throw error;
      throw new MakyPayException(`Network error: ${error}`);
    }
  }

  static formatPhoneNumber(phone: string): string {
    phone = phone.replace(/\D/g, '');
    if (!phone.startsWith('256')) {
      phone = '256' + (phone.startsWith('0') ? phone.substring(1) : phone);
    }
    if (phone.length !== 12) {
      throw new MakyPayException('Invalid phone number format. Expected 256XXXXXXXXX');
    }
    return phone;
  }

  static detectProvider(phone: string): 'mtn' | 'airtel' | 'unknown' {
    const prefix = this.formatPhoneNumber(phone).substring(3, 5);
    if (['77', '78', '76', '39'].includes(prefix)) return 'mtn';
    if (['70', '74', '75'].includes(prefix)) return 'airtel';
    return 'unknown';
  }

  static generateReference(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  static async collectMobileMoney(params: {
    userId: string;
    phoneNumber: string;
    amount: number;
    description: string;
    callbackUrl?: string;
  }): Promise<MakyPayCollectionResult> {
    const { userId, phoneNumber, amount, description, callbackUrl } = params;
    if (amount < 500 || amount > 10000000) {
      throw new MakyPayException('Amount must be between 500 and 10,000,000 UGX');
    }
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const provider = this.detectProvider(formattedPhone);
    const reference = this.generateReference();
    const requestBody: any = {
      phone_number: formattedPhone,
      amount: Math.round(amount),
      country: 'UG',
      reference,
      description: description.substring(0, 255),
    };
    if (callbackUrl) requestBody.callback_url = callbackUrl;

    const response = await this.request<MakyPayApiResponse>('/collections/collect-money', {
      method: 'POST',
      body: requestBody,
      isFormData: true,
    });

    const result: MakyPayCollectionResult = {
      uuid: response.data.transaction.uuid,
      reference,
      status: response.data.transaction.status,
      amount,
      phoneNumber: formattedPhone,
      provider,
      description,
      isCompleted: response.data.transaction.status === 'completed',
      isFailed: response.data.transaction.status === 'failed',
      isPending: response.data.transaction.status === 'processing',
    };
    await this.storeTransaction(userId, result, 'collection');
    return result;
  }

  static async collectCard(params: {
    userId: string;
    amount: number;
    description: string;
    callbackUrl?: string;
  }): Promise<MakyPayCardResult> {
    const { userId, amount, description, callbackUrl } = params;
    const reference = this.generateReference();
    const requestBody: any = {
      method: 'card',
      amount: Math.round(amount),
      country: 'UG',
      reference,
      description: description.substring(0, 255),
    };
    if (callbackUrl) requestBody.callback_url = callbackUrl;

    const response = await this.request<MakyPayCardApiResponse>('/collections/collect-money', {
      method: 'POST',
      body: requestBody,
      isFormData: true,
    });

    const result: MakyPayCardResult = {
      uuid: response.data.transaction.uuid,
      reference,
      redirectUrl: response.data.redirect_url,
      status: response.data.transaction.status,
      amount,
      description,
    };
    await this.storeTransaction(userId, { ...result, phoneNumber: '', provider: 'card' }, 'collection');
    return result;
  }

  static async checkTransactionStatus(transactionId: string): Promise<MakyPayTransaction> {
    const response = await this.request<any>(`/transactions/${transactionId}`);
    return {
      uuid: response.data.uuid,
      reference: response.data.reference,
      status: response.data.status,
      amount: response.data.amount?.raw || 0,
      provider: response.data.provider || 'unknown',
      providerReference: response.data.provider_reference,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  }

  static async getBalance(): Promise<{ balance: number; currency: string }> {
    const response = await this.request<any>('/wallet/balance');
    return {
      balance: response.data.balance?.raw || 0,
      currency: response.data.balance?.currency || 'UGX',
    };
  }

  static async getAccount(): Promise<any> {
    return this.request<any>('/account');
  }

  static async completeSubscriptionPayment(params: {
    userId: string;
    transactionId: string;
    subscriptionPlan: string;
    subscriptionDuration: number;
  }): Promise<void> {
    const { userId, transactionId, subscriptionPlan, subscriptionDuration } = params;
    const transaction = await this.checkTransactionStatus(transactionId);
    if (transaction.status !== 'completed') {
      throw new MakyPayException(`Payment not completed. Status: ${transaction.status}`);
    }
    const now = new Date();
    const expiryDate = new Date(now.getTime() + subscriptionDuration * 24 * 60 * 60 * 1000);

    // Check if subscription already exists for this transaction
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (existingSub) {
      console.log(`Subscription for transaction ${transactionId} already processed.`);
      return;
    }

    const { error: subscriptionError } = await supabase.from('subscriptions').insert({
      user_id: userId,
      plan: subscriptionPlan,
      payment_method: 'makypay_mobile_money',
      transaction_id: transactionId,
      subscribed_at: now.toISOString(),
    });
    if (subscriptionError) throw new MakyPayException('Failed to create subscription record');

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription: subscriptionPlan,
        subscription_start_date: now.toISOString(),
        subscription_expiry_date: expiryDate.toISOString(),
      })
      .eq('id', userId);
    if (profileError) console.error('Profile update error:', profileError);

    await this.updateTransactionStatus(transactionId, 'completed', null);
  }

  static async sendMoney(params: {
    phoneNumber: string;
    amount: number;
    description: string;
    callbackUrl?: string;
  }): Promise<MakyPayCollectionResult> {
    const { phoneNumber, amount, description, callbackUrl } = params;
    if (amount < 500 || amount > 10000000) {
      throw new MakyPayException('Amount must be between 500 and 10,000,000 UGX');
    }
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const reference = this.generateReference();
    const requestBody: any = {
      phone_number: formattedPhone,
      amount: Math.round(amount),
      country: 'UG',
      reference,
      description: description.substring(0, 255),
    };
    if (callbackUrl) requestBody.callback_url = callbackUrl;

    const response = await this.request<MakyPayApiResponse>('/disbursements/send-money', {
      method: 'POST',
      body: requestBody,
      isFormData: true,
    });

    return {
      uuid: response.data.transaction.uuid,
      reference,
      status: response.data.transaction.status,
      amount,
      phoneNumber: formattedPhone,
      provider: this.detectProvider(formattedPhone),
      description,
      isCompleted: response.data.transaction.status === 'completed',
      isFailed: response.data.transaction.status === 'failed',
      isPending: response.data.transaction.status === 'processing',
    };
  }

  static async createPaymentLink(params: {
    title: string;
    amount: number;
    paymentMethods?: ('mobile_money' | 'card')[];
  }): Promise<{ url: string; uuid: string }> {
    const { title, amount, paymentMethods = ['mobile_money', 'card'] } = params;
    if (amount < 100 || amount > 1000000) {
      throw new MakyPayException('Amount must be between 100 and 1,000,000 UGX');
    }
    const response = await this.request<any>('/payment-links', {
      method: 'POST',
      body: { title, type: 'payment', amount: Math.round(amount), is_fixed: true, currency: 'UGX', country: 'UG', payment_methods: paymentMethods },
    });
    return {
      url: response.data.payment_url || `https://wire-api.makylegacy.com/pay/${response.data.uuid}`,
      uuid: response.data.uuid,
    };
  }

  static async verifyPhone(phoneNumber: string): Promise<any> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const response = await this.request<any>('/phone-verification/verify', {
      method: 'POST',
      body: { phone_number: formattedPhone },
    });
    return response.data;
  }

  static async handleWebhook(payload: MakyPayWebhook): Promise<void> {
    const { event_type, transaction } = payload;
    await this.updateTransactionStatus(
      transaction.uuid,
      transaction.status,
      event_type.includes('failed') ? 'Payment failed' : null
    );

    if (event_type === 'collection.completed') {
      const { data: txData } = await supabase
        .from('makypay_transactions')
        .select('user_id, description, amount')
        .eq('uuid', transaction.uuid)
        .single();

      if (txData?.description) {
        const planMatch = txData.description.match(/(basic|standard|free|pro|enterprise)/i);
        if (planMatch) {
          const planName = planMatch[1].toLowerCase();
          
          // Check if already processed to avoid double subscription
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('transaction_id', transaction.uuid)
            .maybeSingle();
            
          if (!existingSub) {
            // Get actual plan duration
            const { data: planData } = await supabase
              .from('plans')
              .select('duration_in_days')
              .ilike('name', `%${planName}%`)
              .eq('amount', txData.amount)
              .maybeSingle();
              
            const duration = planData?.duration_in_days || 30;

            await this.completeSubscriptionPayment({
              userId: txData.user_id,
              transactionId: transaction.uuid,
              subscriptionPlan: planName,
              subscriptionDuration: duration,
            });
          }
        }
      }
    }
  }

  private static async storeTransaction(
    userId: string,
    transaction: any,
    type: 'collection' | 'disbursement'
  ): Promise<void> {
    try {
      const { error } = await supabase.from('makypay_transactions').insert({
        user_id: userId,
        uuid: transaction.uuid,
        reference: transaction.reference,
        type,
        amount: transaction.amount,
        currency: 'UGX',
        phone_number: transaction.phoneNumber || null,
        provider: transaction.provider,
        status: transaction.status,
        description: transaction.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) console.error('Failed to store transaction:', error);
    } catch (error) {
      console.error('Failed to store transaction:', error);
    }
  }

  private static async updateTransactionStatus(
    uuid: string,
    status: string,
    errorMessage: string | null
  ): Promise<void> {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (errorMessage) updateData.error_message = errorMessage;
      const { error } = await supabase
        .from('makypay_transactions')
        .update(updateData)
        .eq('uuid', uuid);
      if (error) console.error('Failed to update transaction:', error);
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }
  }

  static async getTransactionHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('makypay_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) { console.error('Failed to get transactions:', error); return []; }
      return data || [];
    } catch (error) {
      console.error('Failed to get transactions:', error);
      return [];
    }
  }
}

export interface MakyPayCollectionResult {
  uuid: string;
  reference: string;
  status: string;
  amount: number;
  phoneNumber: string;
  provider: 'mtn' | 'airtel' | 'unknown' | 'card';
  description: string;
  isCompleted: boolean;
  isFailed: boolean;
  isPending: boolean;
}

export interface MakyPayCardResult {
  uuid: string;
  reference: string;
  redirectUrl: string;
  status: string;
  amount: number;
  description: string;
}

export interface MakyPayTransaction {
  uuid: string;
  reference: string;
  status: string;
  amount: number;
  provider: string;
  providerReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MakyPayWebhook {
  event_type: 'collection.completed' | 'collection.failed' | 'collection.cancelled' | 'disbursement.completed' | 'disbursement.failed';
  transaction: {
    uuid: string;
    reference: string;
    status: string;
    amount: { formatted: string; raw: number; currency: string };
  };
  collection?: { provider: string; phone_number: string; provider_reference: string };
  metadata?: { response_timestamp: string };
}

interface MakyPayApiResponse {
  status: string;
  message: string;
  data: {
    transaction: { uuid: string; reference: string; status: string };
    collection: {
      amount: { formatted: string; raw: number; currency: string };
      provider: string;
      phone_number: string;
    };
  };
}

interface MakyPayCardApiResponse {
  status: string;
  message: string;
  data: {
    transaction: { uuid: string; reference: string; status: string };
    redirect_url: string;
    collection: {
      amount: { formatted: string; raw: number; currency: string };
      provider: string;
    };
  };
}

export class MakyPayException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MakyPayException';
  }
}
