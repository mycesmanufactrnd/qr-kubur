import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import bcrypt from 'npm:bcryptjs';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Hash default password: "password123"
        const hashedPassword = await bcrypt.hash("password123", 10);

        // Get all AppUsers
        const appUsers = await base44.asServiceRole.entities.AppUser.list();

        // Update all AppUsers with hashed password
        const updates = [];
        for (const appUser of appUsers) {
            if (!appUser.password) {
                updates.push(
                    base44.asServiceRole.entities.AppUser.update(appUser.id, {
                        password: hashedPassword
                    })
                );
            }
        }

        await Promise.all(updates);

        return Response.json({ 
            success: true, 
            message: `Updated ${updates.length} users with default password`,
            hashedPassword: hashedPassword
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});