import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const { password } = await req.json();
        
        if (!password) {
            return Response.json({ error: 'Password is required' }, { status: 400 });
        }

        // Use crypto SHA-256 for hashing
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return Response.json({ 
            success: true,
            hashed: hashed
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});