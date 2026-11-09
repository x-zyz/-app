package app.tianji;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.provider.Settings;
import java.io.IOException;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.json.JSONObject;

final class UpdateDownload {
    private static final String APK = "application/vnd.android.package-archive";
    private final Activity activity;
    private final DownloadManager manager;
    private final SharedPreferences state;

    UpdateDownload(Activity activity) {
        this.activity = activity;
        manager = (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
        state = activity.getSharedPreferences("release-download", Context.MODE_PRIVATE);
    }

    synchronized String start(String tag, JSONObject release) {
        if (release == null || !release.optBoolean("apk") || !release.optString("tag").equals(tag)) return "error";
        String progress = progress(tag);
        if (!"none".equals(progress) && !"error".equals(progress)) return progress;
        try {
            long previous = state.getLong("id", -1);
            if (previous >= 0) manager.remove(previous);
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(ReleaseUpdate.link(tag, true)))
                    .setTitle("Tianji " + tag)
                    .setMimeType(APK)
                    .setDestinationInExternalFilesDir(activity, null, "update-" + tag + ".apk")
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE);
            long id = manager.enqueue(request);
            state.edit().putLong("id", id).putString("tag", tag)
                    .putString("digest", release.optString("digest")).putLong("size", release.optLong("size")).apply();
            return "0";
        } catch (RuntimeException e) {
            return "error";
        }
    }

    synchronized String progress(String tag) {
        if (tag == null || !tag.equals(state.getString("tag", null))) return "none";
        try (Cursor row = manager.query(new DownloadManager.Query().setFilterById(state.getLong("id", -1)))) {
            if (row == null || !row.moveToFirst()) return "error";
            int status = row.getInt(row.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            if (status == DownloadManager.STATUS_FAILED) return "error";
            if (status == DownloadManager.STATUS_SUCCESSFUL) return "ready";
            long done = row.getLong(row.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
            long size = state.getLong("size", 0);
            if (status == DownloadManager.STATUS_PAUSED) return "paused";
            return size > 0 ? Long.toString(Math.min(99, done * 100 / size)) : "0";
        } catch (RuntimeException e) {
            return "error";
        }
    }

    synchronized Intent installer(String tag) throws IOException, NoSuchAlgorithmException {
        if (!"ready".equals(progress(tag))) throw new IOException("Download is incomplete");
        long id = state.getLong("id", -1);
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        long size = state.getLong("size", 0), count = 0;
        try (DigestInputStream stream = new DigestInputStream(
                new ParcelFileDescriptor.AutoCloseInputStream(manager.openDownloadedFile(id)), digest)) {
            byte[] buffer = new byte[8192];
            for (int n; (n = stream.read(buffer)) != -1;) {
                count += n;
                if (count > size) break;
            }
        }
        StringBuilder hex = new StringBuilder("sha256:");
        for (byte b : digest.digest()) hex.append(Character.forDigit((b & 255) >>> 4, 16)).append(Character.forDigit(b & 15, 16));
        if (count != size || !hex.toString().equals(state.getString("digest", ""))) {
            manager.remove(id);
            state.edit().clear().apply();
            throw new IOException("Invalid APK digest");
        }
        if (Build.VERSION.SDK_INT >= 26 && !activity.getPackageManager().canRequestPackageInstalls()) {
            return new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + activity.getPackageName()));
        }
        Uri uri = manager.getUriForDownloadedFile(id);
        if (uri == null) throw new IOException("Missing APK");
        return new Intent(Intent.ACTION_VIEW).setDataAndType(uri, APK).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    }
}
