package com.myces.qubur;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(
    name = "NativeExtras",
    permissions = {
        @Permission(
            alias = "location",
            strings = { Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION }
        ),
        // Only declared in the manifest up to API 28 — on Android 10+ writing a
        // new file into Downloads via MediaStore needs no permission at all, so
        // this alias is only ever requested on Android 9 and below.
        @Permission(alias = "storage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE })
    }
)
public class NativeExtrasPlugin extends Plugin {

    private static final String DOWNLOAD_CHANNEL_ID = "downloads";

    // Resolves only once the user has actually answered the system dialog, so
    // the caller can show the next permission prompt immediately afterwards
    // instead of guessing with timers or waiting on a GPS fix.
    @PluginMethod
    public void requestLocationPermission(PluginCall call) {
        if (hasCoarseLocation()) {
            resolveGranted(call, true);
            return;
        }
        requestPermissionForAlias("location", call, "locationPermsCallback");
    }

    // Check only, never prompts.
    @PluginMethod
    public void checkLocationPermission(PluginCall call) {
        resolveGranted(call, hasCoarseLocation());
    }

    @PermissionCallback
    private void locationPermsCallback(PluginCall call) {
        // Android 12+ lets the user pick "approximate" only — that's still a
        // usable location grant for this app, so don't report it as denied.
        resolveGranted(call, hasCoarseLocation());
    }

    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermsCallback");
            return;
        }
        writeToDownloads(call);
    }

    @PermissionCallback
    private void storagePermsCallback(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) {
            writeToDownloads(call);
        } else {
            call.reject("Storage permission denied", "PERMISSION_DENIED");
        }
    }

    private void writeToDownloads(PluginCall call) {
        String filename = call.getString("filename");
        String data = call.getString("data");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        String notificationBody = call.getString("notificationBody", "");
        String channelName = call.getString("channelName", "Downloads");

        if (filename == null || data == null) {
            call.reject("filename and data are required");
            return;
        }

        byte[] bytes;
        try {
            bytes = Base64.decode(data, Base64.DEFAULT);
        } catch (IllegalArgumentException e) {
            call.reject("Invalid base64 data", e);
            return;
        }

        Context context = getContext();
        try {
            Uri uri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = context.getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);

                uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IOException("Could not create file in Downloads");

                try (OutputStream out = resolver.openOutputStream(uri)) {
                    if (out == null) throw new IOException("Could not open file in Downloads");
                    out.write(bytes);
                }

                values.clear();
                values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                resolver.update(uri, values, null, null);
            } else {
                File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!dir.exists() && !dir.mkdirs()) throw new IOException("Could not create Downloads folder");

                File file = uniqueFile(dir, filename);
                try (FileOutputStream out = new FileOutputStream(file)) {
                    out.write(bytes);
                }
                filename = file.getName();
                MediaScannerConnection.scanFile(context, new String[] { file.getAbsolutePath() }, new String[] { mimeType }, null);
                uri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", file);
            }

            showDownloadNotification(filename, uri, mimeType, notificationBody, channelName);

            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());
            ret.put("filename", filename);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to save file: " + e.getMessage(), e);
        }
    }

    private void showDownloadNotification(String filename, Uri uri, String mimeType, String body, String channelName) {
        Context context = getContext();

        // Android 13+: no notification permission means the system would drop
        // it anyway — the file is still saved, the JS toast still confirms it.
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            return;
        }

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                new NotificationChannel(DOWNLOAD_CHANNEL_ID, channelName, NotificationManager.IMPORTANCE_DEFAULT)
            );
        }

        Intent view = new Intent(Intent.ACTION_VIEW);
        view.setDataAndType(uri, mimeType);
        view.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        // Chooser instead of a bare ACTION_VIEW: if no installed app handles
        // .xlsx, the user gets a "no app" message instead of a tap that silently does nothing.
        Intent chooser = Intent.createChooser(view, filename);
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);

        int id = (int) (System.currentTimeMillis() & 0x7fffffff);
        PendingIntent pending = PendingIntent.getActivity(
            context,
            id,
            chooser,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, DOWNLOAD_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setContentTitle(filename)
            .setContentText(body)
            .setContentIntent(pending)
            .setAutoCancel(true);

        manager.notify(id, builder.build());
    }

    private boolean hasCoarseLocation() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION) ==
        PackageManager.PERMISSION_GRANTED;
    }

    private void resolveGranted(PluginCall call, boolean granted) {
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    private static File uniqueFile(File dir, String filename) {
        File file = new File(dir, filename);
        if (!file.exists()) return file;

        int dot = filename.lastIndexOf('.');
        String base = dot > 0 ? filename.substring(0, dot) : filename;
        String ext = dot > 0 ? filename.substring(dot) : "";
        for (int i = 1; ; i++) {
            File candidate = new File(dir, base + " (" + i + ")" + ext);
            if (!candidate.exists()) return candidate;
        }
    }
}
