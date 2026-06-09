import { supabase } from './supabase';

/// YoPayments mobile money payment service for Uganda
/// Provides integration for deposits (collecting payments) using YoPayments API
/// Supports MTN Mobile Money and Airtel Money in Uganda
export class YoPaymentsService {
  private static readonly SANDBOX_BASE_URL =
    'https://sandbox.yo.co.ug/services/yopaymentsdev/task.php';
  private static readonly PRODUCTION_BASE_URL =
    'https://paymentsapi1.yo.co.ug/ybs/task.php';

  // Production YoPayments API credentials
  private static readonly API_USERNAME = '100155781214';
  private static readonly API_PASSWORD = '28kq-eIoX-o4DE-sRmE-UgXG-iyzm-Hwtr-y7ml';

  // Set to false for production
  private static readonly USE_SANDBOX = false;

  private static get baseUrl(): string {
    return this.USE_SANDBOX ? this.SANDBOX_BASE_URL : this.PRODUCTION_BASE_URL;
  }

  /// Supported Mobile Network Operators in Uganda
  private static readonly SUPPORTED_MNOS = {
    'MTN_MOMO_UGA': 'MTN Mobile Money',
    'AIRTEL_OAPI_UGA': 'Airtel Money',
  };

  /// Get supported Mobile Network Operators
  static getSupportedMnos(): Array<{code: string, name: string}> {
    return Object.entries(this.SUPPORTED_MNOS).map(([code, name]) => ({
      code,
      name
    }));
  }

  /// Create XML request for YoPayments API
  private static createXmlRequest(method: string, parameters: Record<string, any>): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<AutoCreate>';
    xml += '<Request>';
    xml += `<APIUsername>${this.API_USERNAME}</APIUsername>`;
    xml += `<APIPassword>${this.API_PASSWORD}</APIPassword>`;
    xml += `<Method>${method}</Method>`;

    // Add method-specific parameters
    for (const [key, value] of Object.entries(parameters)) {
      if (value != null) {
        xml += `<${key}>${value}</${key}>`;
      }
    }

    xml += '</Request>';
    xml += '</AutoCreate>';

    return xml;
  }

  /// Parse XML response from YoPayments API
  private static parseXmlResponse(xmlString: string): YoPaymentsResponse {
    try {
      // Simple XML parsing - extract values using regex
      const getValue = (tag: string): string | null => {
        const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
        const match = xmlString.match(regex);
        return match ? match[1] : null;
      };

      const status = getValue('Status');
      const statusCodeStr = getValue('StatusCode');
      const statusMessage = getValue('StatusMessage');
      const transactionStatus = getValue('TransactionStatus');
      const transactionReference = getValue('TransactionReference');
      const mnoTransactionReference = getValue('MNOTransactionReferenceId');
      const errorMessage = getValue('ErrorMessage');
      const errorMessageCodeStr = getValue('ErrorMessageCode');

      if (!status || !statusCodeStr) {
        throw new YoPaymentsException('Invalid XML response: Missing required fields');
      }

      const statusCode = parseInt(statusCodeStr, 10);
      const errorMessageCode = errorMessageCodeStr ? parseInt(errorMessageCodeStr, 10) : undefined;

      return {
        status,
        statusCode,
        statusMessage: statusMessage || undefined,
        transactionStatus: transactionStatus || undefined,
        transactionReference: transactionReference || undefined,
        mnoTransactionReference: mnoTransactionReference || undefined,
        errorMessage: errorMessage || undefined,
        errorMessageCode,
      };
    } catch (e) {
      if (e instanceof YoPaymentsException) throw e;
      throw new YoPaymentsException(`Failed to parse YoPayments response: ${e}\nXML: ${xmlString}`);
    }
  }

  /// Send HTTP request to YoPayments API
  private static async sendRequest(xmlBody: string): Promise<YoPaymentsResponse> {
    try {
      console.log('YoPayments Request URL:', this.baseUrl);
      console.log('YoPayments Request Body:', xmlBody);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'Content-Transfer-Encoding': 'text',
        },
        body: xmlBody,
      });

      console.log('YoPayments Response Status:', response.status);
      const responseText = await response.text();
      console.log('YoPayments Response Body:', responseText);

      if (response.ok) {
        const apiResponse = this.parseXmlResponse(responseText);

        // Check if YoPayments returned an error
        if (apiResponse.status === 'ERROR') {
          throw new YoPaymentsException(
            `YoPayments API Error (${apiResponse.statusCode}): ${apiResponse.statusMessage || 'Unknown error'}`
          );
        }

        return apiResponse;
      } else {
        throw new YoPaymentsException(
          `HTTP Error: ${response.status} - ${response.statusText}`
        );
      }
    } catch (e) {
      console.error('YoPayments Request Error:', e);
      if (e instanceof YoPaymentsException) throw e;
      throw new YoPaymentsException(`Network error: ${e}`);
    }
  }

  /// Validate phone number format for Uganda
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    phoneNumber = phoneNumber.replace(/\D/g, '');

    // Ensure Uganda country code (256)
    const countryCode = '256';

    if (!phoneNumber.startsWith(countryCode)) {
      // Remove leading zero if present
      if (phoneNumber.startsWith('0')) {
        phoneNumber = phoneNumber.substring(1);
      }
      phoneNumber = countryCode + phoneNumber;
    }

    // Validate length (256 + 9 digits = 12 total)
    if (phoneNumber.length !== 12) {
      throw new YoPaymentsException('Invalid phone number format');
    }

    return phoneNumber;
  }

  /// Determine account provider code based on phone number
  static getAccountProviderCode(phoneNumber: string): string {
    const formatted = this.formatPhoneNumber(phoneNumber);

    // MTN: 256 77, 78, 76, 39
    if (/^256(77|78|76|39)/.test(formatted)) {
      return 'MTN_MOMO_UGA';
    }

    // Airtel: 256 75, 74, 70, 20, 56, 200-204
    if (/^256(75|74|70|20|56|20[0-4])/.test(formatted)) {
      return 'AIRTEL_OAPI_UGA';
    }

    // Default to MTN if unknown
    return 'MTN_MOMO_UGA';
  }

  /// Initiate a deposit (collect money from customer's mobile money account)
  static async initiateDeposit(params: {
    userId: string;
    phoneNumber: string;
    amount: number;
    description: string;
    externalReference?: string;
    nonBlocking?: boolean;
  }): Promise<YoPaymentsDepositResult> {
    try {
      const { userId, phoneNumber, amount, description, externalReference, nonBlocking = true } = params;

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const accountProviderCode = this.getAccountProviderCode(formattedPhone);
      const wholeAmount = Math.round(amount); // YoPayments works with whole numbers

      // Generate unique external reference for tracking
      const uniqueReference = Date.now().toString();
      const finalExternalReference = externalReference || `BlogSite-${uniqueReference}`;

      const parameters = {
        NonBlocking: nonBlocking ? 'TRUE' : 'FALSE',
        Amount: wholeAmount,
        Account: formattedPhone,
        AccountProviderCode: accountProviderCode,
        Narrative: description.length > 4096 ? description.substring(0, 4096) : description,
        ExternalReference: finalExternalReference,
        ProviderReferenceText: 'Blog Site Subscription Payment',
      };

      const xmlRequest = this.createXmlRequest('acdepositfunds', parameters);
      const response = await this.sendRequest(xmlRequest);

      const result: YoPaymentsDepositResult = {
        internalReference: finalExternalReference, // Store the complete external reference
        transactionReference: response.transactionReference,
        mnoTransactionReference: response.mnoTransactionReference,
        status: response.transactionStatus || 'UNKNOWN',
        amount: wholeAmount,
        phoneNumber: formattedPhone,
        accountProviderCode,
        description,
        response,
        isCompleted: (response.transactionStatus === 'SUCCEEDED' || response.transactionStatus === 'COMPLETED'),
        isFailed: (response.transactionStatus === 'FAILED'),
        isPending: (response.transactionStatus === 'PENDING' || response.transactionStatus === 'INDETERMINATE'),
        isTimeout: false,
        displayStatus: getDisplayStatus(response.transactionStatus || 'UNKNOWN')
      };

      // Store transaction in database
      await this.storeTransaction(userId, result);

      return result;
    } catch (e) {
      if (e instanceof YoPaymentsException) throw e;
      throw new YoPaymentsException(`Failed to initiate deposit: ${e}`);
    }
  }

  /// Check transaction status
  static async checkTransactionStatus(params: {
    transactionReference: string;
    privateTransactionReference?: string;
  }): Promise<YoPaymentsDepositResult> {
    try {
      const { transactionReference, privateTransactionReference } = params;

      const parameters: Record<string, any> = {
        TransactionReference: transactionReference,
      };

      if (privateTransactionReference) {
        parameters.PrivateTransactionReference = privateTransactionReference;
      }

      const xmlRequest = this.createXmlRequest('actransactioncheckstatus', parameters);
      const response = await this.sendRequest(xmlRequest);

      return {
        internalReference: privateTransactionReference || transactionReference,
        transactionReference: response.transactionReference,
        mnoTransactionReference: response.mnoTransactionReference,
        status: response.transactionStatus || 'UNKNOWN',
        amount: 0, // Amount not returned in status check
        phoneNumber: '',
        accountProviderCode: '',
        description: '',
        response,
        isCompleted: (response.transactionStatus === 'SUCCEEDED' || response.transactionStatus === 'COMPLETED'),
        isFailed: (response.transactionStatus === 'FAILED'),
        isPending: (response.transactionStatus === 'PENDING' || response.transactionStatus === 'INDETERMINATE'),
        isTimeout: false,
        displayStatus: getDisplayStatus(response.transactionStatus || 'UNKNOWN')
      };
    } catch (e) {
      if (e instanceof YoPaymentsException) throw e;
      throw new YoPaymentsException(`Failed to check transaction status: ${e}`);
    }
  }

  /// Poll for transaction completion with exponential backoff
  static async waitForTransactionCompletion(params: {
    transactionReference: string;
    privateTransactionReference?: string;
    backoffSeconds?: number[];
    maxAttempts?: number;
  }): Promise<YoPaymentsDepositResult> {
    const {
      transactionReference,
      privateTransactionReference,
      backoffSeconds = [2, 5, 10, 20, 30, 60, 120],
      maxAttempts = 10
    } = params;

    let lastResult: YoPaymentsDepositResult | null = null;
    let attempts = 0;

    for (const seconds of backoffSeconds) {
      if (attempts >= maxAttempts) break;

      await new Promise(resolve => setTimeout(resolve, seconds * 1000));
      attempts++;

      try {
        lastResult = await this.checkTransactionStatus({
          transactionReference,
          privateTransactionReference,
        });

        // Update database with latest status
        await this.updateTransactionStatus(
          privateTransactionReference || transactionReference,
          lastResult.status,
          lastResult.response.errorMessage
        );

        // Check if transaction is complete
        if (lastResult.isCompleted || lastResult.isFailed) {
          return lastResult;
        }
      } catch (e) {
        console.error('Error checking transaction status:', e);
        // Continue polling on errors
      }
    }

    // Return last result or timeout status
    return lastResult || {
      internalReference: privateTransactionReference || transactionReference,
      transactionReference,
      mnoTransactionReference: null,
      status: 'TIMEOUT',
      amount: 0,
      phoneNumber: '',
      accountProviderCode: '',
      description: '',
      response: {
        status: 'ERROR',
        statusCode: -1,
        statusMessage: 'Transaction timeout',
        transactionStatus: 'TIMEOUT',
      },
      isCompleted: false,
      isFailed: false,
      isPending: false,
      isTimeout: true,
      displayStatus: 'Timeout'
    };
  }

  /// Complete subscription after successful payment
  static async completeSubscriptionPayment(params: {
    userId: string;
    transactionReference: string;
    subscriptionPlan: string;
    subscriptionDuration: number; // in days
  }): Promise<void> {
    try {
      const { userId, transactionReference, subscriptionPlan, subscriptionDuration } = params;

      // Check if payment was successful
      const result = await this.checkTransactionStatus({
        transactionReference,
      });

      if (result.isCompleted) {
        // Update user subscription in Supabase
        const now = new Date();
        const expiryDate = new Date(now.getTime() + subscriptionDuration * 24 * 60 * 60 * 1000);

        // Insert subscription record with only existing columns
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan: subscriptionPlan,
            payment_method: 'yopayments_mobile_money',
            subscribed_at: now,
          });

        if (subscriptionError) {
          console.error('Error updating subscription:', subscriptionError);
          throw new YoPaymentsException('Failed to update subscription');
        }

        // Update user profile with subscription details
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription: subscriptionPlan,
            subscription_start_date: now.toISOString(),
            subscription_expiry_date: expiryDate.toISOString(),
          })
          .eq('id', userId);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          // Don't throw here as subscription was updated
        }

        // Mark transaction as completed in our database
        await this.updateTransactionStatus(transactionReference, 'COMPLETED', null);

        console.log('Subscription activated successfully for user:', userId);
      } else {
        throw new YoPaymentsException(`Payment not completed. Status: ${result.status}`);
      }
    } catch (e) {
      throw new YoPaymentsException(`Failed to complete subscription: ${e}`);
    }
  }

  /// Store transaction in Supabase database
  private static async storeTransaction(
    userId: string,
    result: YoPaymentsDepositResult
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('yopayments_transactions')
        .insert({
          user_id: userId,
          internal_reference: result.internalReference,
          transaction_reference: result.transactionReference,
          mno_transaction_reference: result.mnoTransactionReference,
          amount: result.amount,
          currency: 'UGX',
          phone_number: result.phoneNumber,
          account_provider_code: result.accountProviderCode,
          status: result.status,
          description: result.description,
          response_data: result.response,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to store transaction:', error);
        // Don't throw here as this shouldn't fail the main payment flow
      }
    } catch (e) {
      console.error('Failed to store transaction:', e);
      // Don't throw here as this shouldn't fail the main payment flow
    }
  }

  /// Update transaction status in database
  private static async updateTransactionStatus(
    reference: string,
    status: string,
    errorMessage: string | null | undefined
  ): Promise<void> {
    try {
      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('yopayments_transactions')
        .update(updateData)
        .eq('internal_reference', reference);

      if (error) {
        console.error('Failed to update transaction status:', error);
      }
    } catch (e) {
      console.error('Failed to update transaction status:', e);
    }
  }

  /// Get transaction history for a user
  static async getTransactionHistory(userId: string): Promise<YoPaymentsTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('yopayments_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get transaction history:', error);
        return [];
      }

      return data || [];
    } catch (e) {
      console.error('Failed to get transaction history:', e);
      return [];
    }
  }

  /// Check account balance (for admin/debugging purposes)
  static async checkAccountBalance(): Promise<YoPaymentsResponse> {
    try {
      const xmlRequest = this.createXmlRequest('acacountbalance', {});
      return await this.sendRequest(xmlRequest);
    } catch (e) {
      throw new YoPaymentsException(`Failed to check account balance: ${e}`);
    }
  }
}

/// Types for YoPayments API responses
export interface YoPaymentsResponse {
  status: string; // OK or ERROR
  statusCode: number;
  statusMessage?: string;
  transactionStatus?: string; // SUCCEEDED, FAILED, INDETERMINATE, PENDING
  transactionReference?: string;
  mnoTransactionReference?: string;
  errorMessage?: string;
  errorMessageCode?: number;
}

export interface YoPaymentsDepositResult {
  internalReference: string;
  transactionReference: string | null | undefined;
  mnoTransactionReference: string | null | undefined;
  status: string;
  amount: number;
  phoneNumber: string;
  accountProviderCode: string;
  description: string;
  response: YoPaymentsResponse;
  isCompleted: boolean;
  isFailed: boolean;
  isPending: boolean;
  isTimeout: boolean;
  displayStatus: string;
}

export interface YoPaymentsTransaction {
  id: string;
  user_id: string;
  internal_reference: string;
  transaction_reference: string | null;
  mno_transaction_reference: string | null;
  amount: number;
  currency: string;
  phone_number: string;
  account_provider_code: string;
  status: string;
  description: string;
  response_data: YoPaymentsResponse;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/// Exception class for YoPayments operations
export class YoPaymentsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YoPaymentsException';
  }
}

// Helper function to get display status
function getDisplayStatus(status: string): string {
  switch (status) {
    case 'SUCCEEDED':
    case 'COMPLETED':
      return 'Completed';
    case 'FAILED':
      return 'Failed';
    case 'PENDING':
    case 'INDETERMINATE':
      return 'Pending';
    case 'TIMEOUT':
      return 'Timeout';
    default:
      return status;
  }
}