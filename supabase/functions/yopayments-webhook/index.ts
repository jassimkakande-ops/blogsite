import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("YoPayments webhook handler loaded")

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const body = await req.text()
    console.log('YoPayments webhook received:', body)

    let transactionRef: string | null = null
    let transactionStatus: string | null = null
    let mnoTransactionRef: string | null = null
    let amount: string | null = null
    let currency: string | null = null
    let errorMessage: string | null = null

    // Check if it's JSON (from app) or XML (from website)
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // Handle JSON payload (from app)
      try {
        const jsonPayload = JSON.parse(body)
        transactionRef = jsonPayload.TransactionReference
        transactionStatus = jsonPayload.TransactionStatus
        mnoTransactionRef = jsonPayload.MNOTransactionReferenceId
        amount = jsonPayload.Amount
        currency = jsonPayload.Currency
        errorMessage = jsonPayload.ErrorMessage
        console.log('Parsed JSON webhook data:', {
          transactionRef,
          transactionStatus,
          mnoTransactionRef,
          amount,
          currency
        })
      } catch (e) {
        console.error('Failed to parse JSON webhook:', e)
        return new Response(
          JSON.stringify({ error: 'Invalid JSON payload' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    } else {
      // Handle XML payload (from website)
      transactionRef = extractValue(body, 'TransactionReference')
      transactionStatus = extractValue(body, 'TransactionStatus')
      mnoTransactionRef = extractValue(body, 'MNOTransactionReferenceId')
      errorMessage = extractValue(body, 'ErrorMessage')

      console.log('Parsed XML webhook data:', {
        transactionRef,
        transactionStatus,
        mnoTransactionRef
      })
    }

    if (!transactionRef) {
      console.error('No transaction reference found in webhook')
      return new Response(
        JSON.stringify({ error: 'No transaction reference' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Update transaction status in database
    const { data: transaction, error: fetchError } = await supabaseClient
      .from('yopayments_transactions')
      .select('*')
      .eq('transaction_reference', transactionRef)
      .single()

    if (fetchError || !transaction) {
      console.error('Transaction not found:', transactionRef, fetchError)
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update transaction with webhook data
    const updateData: any = {
      status: transactionStatus,
      updated_at: new Date().toISOString(),
    }

    if (mnoTransactionRef) {
      updateData.mno_transaction_reference = mnoTransactionRef
    }

    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    // Store the full webhook response
    updateData.webhook_response = {
      received_at: new Date().toISOString(),
      body: body,
      content_type: contentType,
      parsed_data: {
        transactionRef,
        transactionStatus,
        mnoTransactionRef,
        amount,
        currency,
        errorMessage
      }
    }

    const { error: updateError } = await supabaseClient
      .from('yopayments_transactions')
      .update(updateData)
      .eq('transaction_reference', transactionRef)

    if (updateError) {
      console.error('Failed to update transaction:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If payment was successful, activate subscription
    if (transactionStatus === 'SUCCEEDED' || transactionStatus === 'COMPLETED') {
      console.log('Payment successful, activating subscription for user:', transaction.user_id)

      // Get plan details to determine subscription duration
      const planName = transaction.description?.toLowerCase().includes('premium') ? 'premium' : 'basic'
      const subscriptionDuration = transaction.description?.toLowerCase().includes('monthly') ? 30 : 30 // Default 30 days

      const now = new Date()
      const expiryDate = new Date(now.getTime() + subscriptionDuration * 24 * 60 * 60 * 1000)

      // Update or create subscription
      const { error: subscriptionError } = await supabaseClient
        .from('subscriptions')
        .upsert({
          user_id: transaction.user_id,
          plan_name: planName,
          status: 'active',
          start_date: now.toISOString(),
          end_date: expiryDate.toISOString(),
          price: transaction.amount,
          payment_method: 'yopayments_mobile_money',
          transaction_reference: transactionRef,
          payment_date: now.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })

      if (subscriptionError) {
        console.error('Failed to create subscription:', subscriptionError)
        // Don't return error as transaction was updated successfully
      } else {
        // Update user profile
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update({
            subscription: planName,
            subscription_start_date: now.toISOString(),
            subscription_expiry_date: expiryDate.toISOString(),
          })
          .eq('id', transaction.user_id)

        if (profileError) {
          console.error('Failed to update profile:', profileError)
        } else {
          console.log('Subscription activated successfully for user:', transaction.user_id)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        transactionRef,
        status: transactionStatus
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper function to extract values from XML
function extractValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's')
  const match = xml.match(regex)
  return match ? match[1] : null
}