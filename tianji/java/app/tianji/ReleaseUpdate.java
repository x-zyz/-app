package app.tianji;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

final class ReleaseUpdate {
    private static final String REPO = "x-zyz/tianji-app";
    private static final String RELEASES = "https://github.com/" + REPO + "/releases/";
    private static final String API = "https://api.github.com/repos/" + REPO + "/releases/latest";
    private static final int MAX_RESPONSE_BYTES = 256 * 1024;

    private ReleaseUpdate() {}

    static String link(String tag, boolean download) {
        if (tag == null || !tag.matches("v[0-9]{1,6}\\.[0-9]{1,6}(?:\\.[0-9]{1,6})?")) return null;
        return download ? RELEASES + "download/" + tag + "/tianji-" + tag + ".apk"
                : RELEASES + "tag/" + tag;
    }

    static JSONObject fetch() throws IOException, JSONException {
        HttpsURLConnection conn = (HttpsURLConnection) new URL(API).openConnection();
        try {
            conn.setConnectTimeout(7000);
            conn.setReadTimeout(7000);
            conn.setInstanceFollowRedirects(false);
            conn.setRequestProperty("Accept", "application/vnd.github+json");
            conn.setRequestProperty("User-Agent", "Tianji-Android");
            if (conn.getResponseCode() != 200) throw new IOException("Release request failed");
            try (InputStream stream = conn.getInputStream()) {
                ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                byte[] buffer = new byte[4096];
                for (int n; (n = stream.read(buffer)) != -1;) {
                    if (bytes.size() + n > MAX_RESPONSE_BYTES) throw new IOException("Release response too large");
                    bytes.write(buffer, 0, n);
                }
                JSONObject release = new JSONObject(new String(bytes.toByteArray(), StandardCharsets.UTF_8));
                String tag = release.getString("tag_name");
                String download = link(tag, true);
                if (download == null || release.optBoolean("draft") || release.optBoolean("prerelease")) {
                    throw new IOException("Unsupported release metadata");
                }
                String digest = "";
                long size = 0;
                JSONArray assets = release.optJSONArray("assets");
                for (int i = 0; assets != null && i < assets.length(); i++) {
                    JSONObject asset = assets.optJSONObject(i);
                    if (asset != null && "uploaded".equals(asset.optString("state"))
                            && asset.optLong("size") > 0 && download.equals(asset.optString("browser_download_url"))) {
                        String hash = asset.optString("digest");
                        long bytesExpected = asset.optLong("size");
                        if (hash.matches("sha256:[0-9a-f]{64}") && bytesExpected <= 64L * 1024 * 1024) {
                            digest = hash;
                            size = bytesExpected;
                        }
                        break;
                    }
                }
                return new JSONObject().put("tag", tag).put("apk", size > 0).put("digest", digest).put("size", size);
            }
        } finally {
            conn.disconnect();
        }
    }
}
