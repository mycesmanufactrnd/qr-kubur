import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import bcrypt from 'npm:bcryptjs';

Deno.serve(async (req) => {
    try {
        // Parse request body first
        const { email, password } = await req.json();
        
        // Create client from request - this will work even without authentication
        const base44 = createClientFromRequest(req);

        console.log('Login attempt:', { email, passwordLength: password?.length });

        if (!email || !password) {
            return Response.json({ 
                success: false, 
                message: 'Email and password are required' 
            }, { status: 400 });
        }

        // Find AppUser by email
        const appUsers = await base44.asServiceRole.entities.AppUser.list();
        console.log('Total AppUsers:', appUsers.length);
        
        const appUser = appUsers.find(u => u.data?.email === email);
        console.log('Found user:', appUser ? 'Yes' : 'No');

        if (!appUser) {
            return Response.json({ 
                success: false, 
                message: 'Invalid email or password' 
            }, { status: 401 });
        }

        const storedPassword = appUser.data?.password;
        console.log('User has password:', !!storedPassword);

        // Check if password exists
        if (!storedPassword) {
            return Response.json({ 
                success: false, 
                message: 'Password not set for this user' 
            }, { status: 401 });
        }

        // Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, storedPassword);
        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            return Response.json({ 
                success: false, 
                message: 'Invalid email or password' 
            }, { status: 401 });
        }

        // Return user data (excluding password)
        const userData = {
            id: appUser.id,
            ...appUser.data
        };
        const { password: _, ...userWithoutPassword } = userData;

        return Response.json({ 
            success: true, 
            message: 'Login successful',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        return Response.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
});