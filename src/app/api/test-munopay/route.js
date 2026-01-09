/**
 * TEST ENDPOINT - Direct MunoPay API call
 * POST /api/test-munopay
 * 
 * This endpoint directly calls MunoPay API to test if credentials work
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, amount } = body;

    if (!phone || !amount) {
      return Response.json(
        {
          success: false,
          error: 'Phone and amount are required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Test API Key
    const API_KEY = 'Mp_key-091143e30ba5c8d5c3bcfe924c1ebbb0-X';
    const API_URL = 'https://payments.munopay.com/api/v1/deposit';

    console.log('🔍 Testing MunoPay API...');
    console.log('Phone:', phone);
    console.log('Amount:', amount);
    console.log('API Key:', API_KEY.substring(0, 20) + '...');

    // Prepare payload - using correct MunoPay API fields
    const payload = {
      account_number: '01004449855656', // Required by MunoPay API
      reference: 'test-' + Date.now(),
      phone: phone,
      amount: parseFloat(amount),
      description: `Test payment request for ${amount} UGX`,
      email: 'test@xhenfy.local',
      names: 'Test User',
    };

    console.log('📤 Request payload:', payload);

    // Make request to MunoPay
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📍 MunoPay Response Status:', response.status);

    // Parse response
    const responseText = await response.text();
    console.log('📄 Raw Response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e.message);
      return Response.json(
        {
          success: false,
          error: `Invalid response from MunoPay: ${responseText}`,
          code: 'INVALID_RESPONSE',
          details: {
            status: response.status,
            statusText: response.statusText,
            raw: responseText.substring(0, 200),
          },
        },
        { status: response.status }
      );
    }

    // Check response status
    if (!response.ok) {
      console.error('❌ MunoPay API Error:', responseData);
      return Response.json(
        {
          success: false,
          error: responseData.message || responseData.error || 'Payment request failed',
          code: responseData.code || 'API_ERROR',
          details: responseData,
        },
        { status: response.status }
      );
    }

    console.log('✅ MunoPay Success:', responseData);

    return Response.json(
      {
        success: true,
        message: 'STK push sent successfully',
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        code: 'SERVER_ERROR',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
