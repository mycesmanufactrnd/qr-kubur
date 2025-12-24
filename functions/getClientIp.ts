import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get IP address from various possible headers
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    // Try different headers in order of preference
    let ip = cfConnectingIp || realIp || forwarded;
    
    // If forwarded-for contains multiple IPs, get the first one
    if (ip && ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    
    // Fallback to connection remote address if headers not available
    if (!ip) {
      ip = 'unknown';
    }
    
    return Response.json({ ip });
  } catch (error) {
    return Response.json({ error: error.message, ip: 'unknown' }, { status: 500 });
  }
});