import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if user is admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all AppUsers
        const appUsers = await base44.asServiceRole.entities.AppUser.list();
        
        // Hash "password" using SHA-256
        const encoder = new TextEncoder();
        const data = encoder.encode("password");
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        let updated = 0;
        
        // Update all users with SHA-256 hashed password
        for (const user of appUsers) {
            await base44.asServiceRole.entities.AppUser.update(user.id, {
                password: hashedPassword
            });
            updated++;
        }

        return Response.json({ 
            success: true, 
            message: `Updated ${updated} users with SHA-256 hashed password`,
            hash: hashedPassword
        });

    } catch (error) {
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});