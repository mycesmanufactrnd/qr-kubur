import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import bcrypt from 'npm:bcryptjs';

Deno.serve(async (req) => {
    const logDetails = {};

    try {
        const { email, password } = await req.json();
        const base44 = createClientFromRequest(req);

        logDetails.email = email;
        logDetails.passwordLength = password?.length;
        logDetails.timestamp = new Date().toISOString();

        if (!email || !password) {
            logDetails.error = 'Email and password are required';
            await base44.asServiceRole.entities.LogActivity.create({
                activity_type: 'app_user_login',
                function_name: 'appUserLogin',
                user_email: email || 'unknown',
                level: 'error',
                summary: 'Login failed: Missing credentials',
                details: logDetails,
                success: false
            });

            return Response.json({
                success: false,
                message: 'Email and password are required'
            }, { status: 400 });
        }

        // Load all users
        const appUsers = await base44.asServiceRole.entities.AppUser.list();
        logDetails.totalAppUsers = appUsers.length;

        // Find user by email
        const appUser = appUsers.find(u => u.data?.email === email);
        logDetails.foundUser = !!appUser;

        if (!appUser) {
            logDetails.error = 'User not found';
            await base44.asServiceRole.entities.LogActivity.create({
                activity_type: 'app_user_login',
                function_name: 'appUserLogin',
                user_email: email,
                level: 'warn',
                summary: 'Login failed: User not found',
                details: logDetails,
                success: false
            });

            return Response.json({
                success: false,
                message: 'Invalid email or password'
            }, { status: 401 });
        }

        const storedPassword = appUser.password || appUser.data?.password;

        if (!storedPassword) {
            logDetails.error = 'Password not set';
            await base44.asServiceRole.entities.LogActivity.create({
                activity_type: 'app_user_login',
                function_name: 'appUserLogin',
                user_email: email,
                level: 'error',
                summary: 'Login failed: Password not set',
                details: logDetails,
                success: false
            });

            return Response.json({
                success: false,
                message: 'Password not set for this user'
            }, { status: 401 });
        }

        // ✔ Correct bcrypt comparison (async)
        const isPasswordValid = await bcrypt.compare(password, storedPassword);

        logDetails.isPasswordValid = isPasswordValid;

        if (!isPasswordValid) {
            logDetails.error = 'Invalid password';
            await base44.asServiceRole.entities.LogActivity.create({
                activity_type: 'app_user_login',
                function_name: 'appUserLogin',
                user_email: email,
                level: 'warn',
                summary: 'Login failed: Invalid password',
                details: logDetails,
                success: false
            });

            return Response.json({
                success: false,
                message: 'Invalid email or password'
            }, { status: 401 });
        }

        // Build user object (without password)
        const userData = { id: appUser.id, ...appUser.data };
        const { password: _, ...userWithoutPassword } = userData;

        logDetails.userId = appUser.id;
        logDetails.userRole = appUser.data?.role;

        await base44.asServiceRole.entities.LogActivity.create({
            activity_type: 'app_user_login',
            function_name: 'appUserLogin',
            user_email: email,
            level: 'info',
            summary: 'Login successful',
            details: logDetails,
            success: true
        });

        return Response.json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword
        });

    } catch (error) {
        logDetails.error = error.message;

        try {
            const base44 = createClientFromRequest(req);
            await base44.asServiceRole.entities.LogActivity.create({
                activity_type: 'app_user_login',
                function_name: 'appUserLogin',
                user_email: logDetails.email || 'unknown',
                level: 'error',
                summary: 'Login error: ' + error.message,
                details: logDetails,
                success: false
            });
        } catch (_) {}

        return Response.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
});