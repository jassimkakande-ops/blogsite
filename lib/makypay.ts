import { supabase } from './supabase';

/**
 * MakyPay Payment Gateway Service
 * Provides integration for Mobile Money (MTN/Airtel) and Card payments in Uganda
 * Documentation: https://wire-api.makylegacy.com/api/v1/docs
 */
export class MakyPayService {
  private static readonly BASE_URL = 'https://wire-api.makylegacy.com/api/v1';
  
  // Store credentials in environment variables
  private static readonly API_KEY = process.env.MAKYPAY_API_KEY || '';
  private static readonly API_SECRET = process.env.MAKYPAY_API_SECRET || '';
  
  // Pre-encoded Base64 header (recommended by MakyPay)
  private static readonly AUTH_HEADER = process.env.MAKYPAY_BASE64_AUTH || '';

  /**
   * Get Authorization header for API requests
   */
  private static getAuthHeader(): string {
    if (this.AUTH_HEADER) {
      return `Basic ${this.AUTH_HEADER}`;
    }
    
    // Fallback: Build from API_KEY:API_SECRET
    if (this.API_KEY && this.API_SECRET) {
      const credentials = `${this.API_KEY}:${this.API_SECRET}`;
      const base64 = Buffer.from(credentials).toString('base64');
      return `Basic ${base64}`;
    }
    
    throw new MakyPayException('MakyPay credentials not configured');
  }

  /**
   * Make API request to MakyPay
   */
  private static async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      isFormData?: boolean;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, isFormData = false } = options;
    
    const headers: Record<string, string> = {
      'Authorization': this.getAuthHeader(),
      'Accept': 'application/json',
    };

    let requestBody: any;
    
    if (body) {
      if (isFormData) {
        // Form-urlencoded for collections
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        requestBody = new URLSearchParams(body).toString();
      } else {
        // JSON for other endpoints
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        method,
        headers,
        body: requestBody,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new MakyPayException(
          data.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return data;
    } catch (error) {
      if (error instanceof MakyPayException) throw error;
      throw new MakyPayException(`Network error: ${error}`);
    }
  }

  /**
   * Format phone number to MakyPay standard (256XXXXXXXXX)
   */
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    phone = phone.replace(/\D/g, '');
    
    // Remove leading + if present
    if (phone.startsWith('+')) {
      phone = phone.substring(1);
    }
    
    // Add 256 if not present
    if (!phone.startsWith('256')) {
      if (phone.startsWith('0')) {
        phone = '256' + phone.substring(1);
      } else {
        phone = '256' + phone;
      }
    }
    
    // Validate length
    if (phone.length !== 12) {
      throw new MakyPayException('Invalid phone number format. Expected 256XXXXXXXXX');
    }
    
    return phone;
  }

  /**
   * Detect mobile money provider from phone number
   */
  static detectProvider(phone: string): 'mtn' | 'airtel' | 'unknown' {
    const formatted = this.formatPhoneNumber(phone);
    const prefix = formatted.substring(3, 5); // Get first 2 digits after 256
    
    // MTN: 77, 78, 76, 39
    if (['77', '78', '76', '39'].includes(prefix)) {
      return 'mtn';
    }
    
    // Airtel: 70, 74, 75
    if (['70', '74', '75'].includes(prefix)) {
      return 'airtel';
    }
    
    return 'unknown';
  }

  /**
   * Generate UUID v4 for transaction reference
   */
  static generateReference(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Collect payment via Mobile Money
   */
  static async collectMobileMoney(params: {
    userId: string;
    phoneNumber: string;
    amount: number;
    description: string;
    callbackUrl?: string;
  }): Promise<MakyPayCollectionResult> {
    const { userId, phoneNumber, amount, description, callbackUrl } = params;
    
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const provider = this.detectProvider(formattedPhone);
    const reference = this.generateReference();
    
    // Validate amount (500 - 10,000,000 UGX)
    if (amount < 500 || amount > 10000000) {
      throw new MakyPayException('Amount must be between 500 and 10,000,000 UGX');
    }

    const requestBody: any = {
      phone_number: formattedPhone,
      amount: Math.round(amount),
      country: 'UG',
      reference,
      description: description.substring(0, 255),
    };

    if (callbackUrl) {
      requestBody.callback_url = callbackUrl;
    }

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

    // Store transaction
    await this.storeTransaction(userId, result, 'collection');

    return result;
  }

  /**
   * Collect payment via Card (Visa/Mastercard)
   */
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

    if (callbackUrl) {
      requestBody.callback_url = callbackUrl;
    }

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

    // Store transaction
    await this.storeTransaction(userId, { ...result, phoneNumber: '', provider: 'card' }, 'collection');

    return result;
  }

  /**
   * Check transaction status
   */
  static async checkTransactionStatus(transactionId: string): Promise<MakyPayTransaction> {
    const response = await this.request<any>(`/transactions/${transactionId}`, {
      method: 'GET',
    });

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

  /**
   * Get wallet balance
   */
  static async getBalance(): Promise<{ balance: number; currency: string }> {
    const response = await this.request<any>('/wallet/balance', {
      method: 'GET',
    });

    return {
      balance: response.data.balance?.raw || 0,
      currency: response.data.balance?.currency || 'UGX',
    };
  }

  /**
   * Get account details
   */
  static async getAccount(): Promise<any> {
    return this.request<any>('/account', {
      method: 'GET',
    });
  }

  /**
   * Complete subscription after successful payment
   */
  static async completeSubscriptionPayment(params: {
    userId: string;
    transactionId: string;
    subscriptionPlan: string;
    subscriptionDuration: number;
  }): Promise<void> {
    const { userId, transactionId, subscriptionPlan, subscriptionDuration } = params;

    // Check transaction status
    const transaction = await this.checkTransactionStatus(transactionId);

    if (transaction.status !== 'completed') {
      throw new MakyPayException(`Payment not completed. Status: ${transaction.status}`);
    }

    // Calculate dates
    const now = new Date();
    const expiryDate = new Date(now.getTime() + subscriptionDuration * 24 * 60 * 60 * 1000);

    // Insert subscription record
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: subscriptionPlan,
        payment_method: 'makypay_mobile_money',
        transaction_id: transactionId,
        subscribed_at: now.toISOString(),
      });

    if (subscriptionError) {
      throw new MakyPayException('Failed to create subscription record');
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription: subscriptionPlan,
        subscription_start_date: now.toISOString(),
        subscription_expiry_date: expiryDate.toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    await this.updateTransactionStatus(transactionId, 'completed', null);
  }

  /**
   * Send money (Disbursement)
   */
  static async sendMoney(params: {
    phoneNumber: string;
    amount: number;
    description: string;
    callbackUrl?: string;
  }): Promise<MakyPayCollectionResult> {
    const { phoneNumber, amount, description, callbackUrl } = params;
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const reference = this.generateReference();

    if (amount < 500 || amount > 10000000) {
      throw new MakyPayException('Amount must be between 500 and 10,000,000 UGX');
    }

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

  /**
   * Create payment link
   */
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
      body: {
        title,
        type: 'payment',
        amount: Math.round(amount),
        is_fixed: true,
        currency: 'UGX',
        country: 'UG',
        payment_methods: paymentMethods,
      },
      isFormData: false,
    });

    return {
      url: response.data.payment_url || `https://wire-api.makylegacy.com/pay/${response.data.uuid}`,
      uuid: response.data.uuid,
    };
  }

  /**
   * Verify phone number and get KYC info
   */
  static async verifyPhone(phoneNumber: string): Promise<any> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const response = await this.request<any>('/phone-verification/verify', {
      method: 'POST',
      body: { phone_number: formattedPhone },
      isFormData: false,
    });

    return response.data;
  }

  /**
   * Handle webhook from MakyPay
   */
  static async handleWebhook(payload: MakyPayWebhook): Promise<void> {
    const { event_type, transaction } = payload;

    await this.updateTransactionStatus(
      transaction.uuid,
      transaction.status,
      event_type.includes('failed') ? 'Payment failed' : null
    );

    // Handle subscription completion
    if (event_type === 'collection.completed') {
      const { data: txData } = await supabase
        .from('makypay_transactions')
        .select('user_id, description')
        .eq('uuid', transaction.uuid)
        .single();

      if (txData && txData.description?.includes('Subscription')) {
        const planMatch = txData.description.match(/(free|pro|enterprise)/i);
        if (planMatch) {
          await this.completeSubscriptionPayment({
            userId: txData.user_id,
            transactionId: transaction.uuid,
            subscriptionPlan: planMatch[1].toLowerCase(),
            subscriptionDuration: 30,
          });
        }
      }
    }
  }

  /**
   * Store transaction in database
   */
  private static async storeTransaction(
    userId: string,
    transaction: any,
    type: 'collection' | 'disbursement'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('makypay_transactions')
        .insert({
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

  /**
   * Update transaction status
   */
  private static async updateTransactionStatus(
    uuid: string,
    status: string,
    errorMessage: string | null
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

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

  /**
   * Get transaction history for user
   */
  static async getTransactionHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('makypay_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get transactions:', error);
      return [];
    }
  }
}

// Types
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
    amount: {
      formatted: string;
      raw: number;
      currency: string;
    };
  };
  collection?: {
    provider: string;
    phone_number: string;
    provider_reference: string;
  };
  metadata?: {
    response_timestamp: string;
  };
}

interface MakyPayApiResponse {
  status: string;
  message: string;
  data: {
    transaction: {
      uuid: string;
      reference: string;
      status: string;
    };
    collection: {
      amount: {
        formatted: string;
        raw: number;
        currency: string;
      };
      provider: string;
      phone_number: string;
    };
  };
}

interface MakyPayCardApiResponse {
  status: string;
  message: string;
  data: {
    transaction: {
      uuid: string;
      reference: string;
      status: string;
    };
    redirect_url: string;
    collection: {
      amount: {
        formatted: string;
        raw: number;
        currency: string;
      };
      provider: string;
    };
  };
}

export class MakyPayException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MakyPayException';
  }
}y_mobile_money',
        subscribed_at: now,
      });

    if (subscriptionError) {
      throw new MakyPayException('Failed to create subscription record');
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription: subscriptionPlan,
        subscription_start_date: now.toISOString(),
        subscription_expiry_date: expiryDate.toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // Update transaction status
    await this.updateTransactionStatus(transactionId, 'completed', null);
  }

  /**
   * Store transaction in database
   */
  private static async storeTransaction(
    userId: string,
    transaction: any,
    type: 'collection' | 'disbursement'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('makypay_transactions')
        .insert({
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

      if (error) {
        console.error('Failed to store transaction:', error);
      }
    } catch (error) {
      console.error('Failed to store transaction:', error);
    }
  }

  /**
   * Update transaction status
   */
  private static async updateTransactionStatus(
    uuid: string,
    status: string,
    errorMessage: string | null
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('makypay_transactions')
        .update(updateData)
        .eq('uuid', uuid);

      if (error) {
        console.error('Failed to update transaction:', error);
      }
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }
  }

  /**
   * Get transaction history for user
   */
  static async getTransactionHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('makypay_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get transactions:', error);
      return [];
    }
  }
}

// Types
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

interface MakyPayApiResponse {
  status: string;
  message: string;
  data: {
    transaction: {
      uuid: string;
      reference: string;
      status: string;
    };
    collection: {
      amount: {
        formatted: string;
        raw: number;
        currency: string;
      };
      provider: string;
      phone_number: string;
    };
  };
}

interface MakyPayCardApiResponse {
  status: string;
  message: string;
  data: {
    transaction: {
      uuid: string;
      reference: string;
      status: string;
    };
    redirect_url: string;
    collection: {
      amount: {
        formatted: string;
        raw: number;
        currency: string;
      };
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
