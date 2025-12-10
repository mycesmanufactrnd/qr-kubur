import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import bcrypt from 'npm:bcryptjs';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { email, password } = await req.json();

        if (!email || !password) {
            return Response.json({ 
                success: false, 
                message: 'Email and password are required' 
            }, { status: 400 });
        }

        // Find AppUser by email
        const appUsers = await base44.asServiceRole.entities.AppUser.filter({ email });

        if (appUsers.length === 0) {
            return Response.json({ 
                success: false, 
                message: 'Invalid email or password' 
            }, { status: 401 });
        }

        const appUser = appUsers[0];

        // Check if password exists
        if (!appUser.password) {
            return Response.json({ 
                success: false, 
                message: 'Password not set for this user' 
            }, { status: 401 });
        }

        // Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, appUser.password);

        if (!isPasswordValid) {
            return Response.json({ 
                success: false, 
                message: 'Invalid email or password' 
            }, { status: 401 });
        }

        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = appUser;

        return Response.json({ 
            success: true, 
            message: 'Login successful',
            user: userWithoutPassword
        });
    } catch (error) {
        return Response.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
});