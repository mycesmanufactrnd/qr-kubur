import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

            return Response.json({
                success: false,
                message: 'Email and password are required'
            }, { status: 400 });
        }

        // Load all users
        const appUsers = await base44.asServiceRole.entities.AppUser.list();
        logDetails.totalAppUsers = appUsers.length;

        // Log first user structure to debug
        if (appUsers.length > 0) {
            logDetails.firstUserStructure = {
                hasData: !!appUsers[0].data,
                hasDirectEmail: !!appUsers[0].email,
                sampleKeys: Object.keys(appUsers[0])
            };
        }

        // Find user by email - try both direct and nested access
        const appUser = appUsers.find(u => u.email === email || u.data?.email === email);
        logDetails.foundUser = !!appUser;

        if (!appUser) {
            logDetails.error = 'User not found';

            return Response.json({
                success: false,
                message: 'Invalid email or password'
            }, { status: 401 });
        }

        const storedPassword = appUser.password || appUser.data?.password;

        if (!storedPassword) {
            logDetails.error = 'Password not set';

            return Response.json({
                success: false,
                message: 'Password not set for this user'
            }, { status: 401 });
        }

        // Log password details for debugging
        logDetails.storedPasswordPrefix = storedPassword.substring(0, 20);
        logDetails.storedPasswordLength = storedPassword.length;
        logDetails.providedPassword = password;

        // Use crypto SHA-256 instead of bcrypt
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        logDetails.computedHash = computedHash;
        
        const isPasswordValid = computedHash === storedPassword;
        logDetails.isPasswordValid = isPasswordValid;

        if (!isPasswordValid) {
            logDetails.error = 'Invalid password';

            return Response.json({
                success: false,
                message: 'Invalid email or password'
            }, { status: 401 });
        }

        // Build user object (without password)
        const userData = appUser.data ? { id: appUser.id, ...appUser.data } : { ...appUser };
        const { password: _, ...userWithoutPassword } = userData;

        logDetails.userId = appUser.id;
        logDetails.userRole = appUser.role || appUser.data?.role;

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