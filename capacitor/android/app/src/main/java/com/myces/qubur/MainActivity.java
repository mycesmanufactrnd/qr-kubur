package com.myces.qubur;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    private static final int LOCATION_PERMISSION_REQUEST = 100;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestLocationPermissionIfNeeded();

        // Extend Capacitor's own BridgeWebChromeClient (not the bare Android
        // WebChromeClient) — it already implements onShowFileChooser() to
        // hand <input type="file"> off to a native picker/camera intent.
        // Subclassing the plain WebChromeClient here silently no-ops every
        // file input in the app, since the default onShowFileChooser()
        // implementation just returns false.
        getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
            @Override
            public void onGeolocationPermissionsShowPrompt(
                    String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });
    }

    // Camera permission is intentionally NOT requested here — it's requested by
    // the Capacitor Camera plugin itself, at the moment the user actually taps
    // "Take Photo". Asking for it eagerly at launch (before the user has any
    // context) trains people to reflexively tap "Deny", and Android then
    // silently blocks every later re-prompt — so Camera.getPhoto() fails
    // forever with "User denied access to camera" and there's no way back
    // short of the user manually re-enabling it in system Settings.
    private void requestLocationPermissionIfNeeded() {
        java.util.List<String> needed = new java.util.ArrayList<>();

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.ACCESS_FINE_LOCATION);
            needed.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        }

        if (!needed.isEmpty()) {
            ActivityCompat.requestPermissions(this,
                    needed.toArray(new String[0]),
                    LOCATION_PERMISSION_REQUEST);
        }
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
