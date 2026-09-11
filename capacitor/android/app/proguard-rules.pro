# Add project specific ProGuard rules here.

# Firebase Authentication
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Google Play Services
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Credential Manager (newer Google Sign-In)
-keep class androidx.credentials.** { *; }
-dontwarn androidx.credentials.**
-keep class com.google.android.libraries.identity.googleid.** { *; }
-dontwarn com.google.android.libraries.identity.googleid.**

# Capawesome Firebase Auth plugin
-keep class io.capawesome.capacitorjs.plugins.firebase.authentication.** { *; }

# The plugin's Facebook-provider handler references the Facebook Login SDK
# unconditionally at compile time, but this app only configures the Google
# provider (capacitor.config.json) and never depends on the Facebook SDK —
# that code path is unreachable here, so tell R8 not to fail on it.
-dontwarn com.facebook.**

-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
