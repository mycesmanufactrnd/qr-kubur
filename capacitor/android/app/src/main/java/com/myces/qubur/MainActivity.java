package com.myces.qubur;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Local (in-app) plugins must be registered before super.onCreate().
        registerPlugin(NativeExtrasPlugin.class);
        super.onCreate(savedInstanceState);

        // No permission is requested here at launch. Location and notification
        // are asked on UserDashboard's first mount (fresh install only), in that
        // order — see useFirstInstallPermissions.js. Camera is asked by the
        // Camera plugin when the user taps "Take Photo"; asking eagerly at launch
        // trains people to tap "Deny", after which Android silently blocks every
        // later re-prompt.
        //
        // Extend Capacitor's own BridgeWebChromeClient (not the bare Android
        // WebChromeClient) — it already implements onShowFileChooser() for
        // <input type="file">, and onGeolocationPermissionsShowPrompt() which
        // asks the OS for location on demand. Don't override the latter: a
        // blanket callback.invoke(origin, true, false) grants the WebView access
        // without ever asking the OS, so geolocation just fails when the runtime
        // permission was never granted.
        getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });
    }

    @Override
    public void onBackPressed() {
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('nativeBackButton'))",
                null
            );
        } else {
            super.onBackPressed();
        }
    }
}
