package app.tianji;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {

    private static final String TAG = "Tianji";
    private static final String PAPER = "#F6F3EA";
    private WebView web;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window w = getWindow();
        w.setStatusBarColor(Color.TRANSPARENT);
        w.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= 30) {
            w.setDecorFitsSystemWindows(false);
            WindowInsetsController c = w.getDecorView().getWindowInsetsController();
            if (c != null) {
                int lightBars = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                c.setSystemBarsAppearance(lightBars, lightBars);
            }
        } else {
            w.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
                            | (Build.VERSION.SDK_INT >= 26 ? View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR : 0));
            if (Build.VERSION.SDK_INT < 26) w.setNavigationBarColor(Color.parseColor("#16382E"));
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor(PAPER));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        if (Build.VERSION.SDK_INT >= 21) {
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !url.startsWith("file://");
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage m) {
                Log.d(TAG, m.message() + " @" + m.lineNumber());
                return true;
            }
        });

        WebView.setWebContentsDebuggingEnabled(true);
        web.addJavascriptInterface(new Bridge(), "Android");

        setContentView(web);
        applyInsets();

        web.loadUrl("file:///android_asset/index.html");
    }

    private void applyInsets() {
        web.setOnApplyWindowInsetsListener((v, insets) -> {
            int top, bottom, left, right;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets sb = insets.getInsets(
                        WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                top = sb.top;
                bottom = sb.bottom;
                left = sb.left;
                right = sb.right;
            } else {
                top = insets.getSystemWindowInsetTop();
                bottom = insets.getSystemWindowInsetBottom();
                left = insets.getSystemWindowInsetLeft();
                right = insets.getSystemWindowInsetRight();
            }
            float d = getResources().getDisplayMetrics().density;
            String js = String.format(
                    "window.__insets={top:%f,bottom:%f,left:%f,right:%f};window.dispatchEvent(new Event('insets'));",
                    top / d, bottom / d, left / d, right / d);
            web.evaluateJavascript(js, null);
            return insets;
        });
        web.requestApplyInsets();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.__onBack && window.__onBack()) || false", value -> {
            if (!"true".equals(value)) {
                finish();
            }
        });
    }

    public class Bridge {
        @JavascriptInterface
        public void setChartBars(final boolean dark) {
            runOnUiThread(() -> {
                View decor = getWindow().getDecorView();
                if (Build.VERSION.SDK_INT >= 30) {
                    WindowInsetsController controller = decor.getWindowInsetsController();
                    if (controller != null) {
                        int light = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                                | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                        controller.setSystemBarsAppearance(dark ? 0 : light, light);
                    }
                } else {
                    int light = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    if (Build.VERSION.SDK_INT >= 26) light |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    int flags = decor.getSystemUiVisibility();
                    decor.setSystemUiVisibility(dark ? flags & ~light : flags | light);
                }
                web.setBackgroundColor(Color.parseColor(dark ? "#141716" : PAPER));
            });
        }

        @JavascriptInterface
        public void vibrate(final int ms) {
            runOnUiThread(() -> {
                try {
                    Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
                    if (v == null) return;
                    if (Build.VERSION.SDK_INT >= 26) {
                        v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
                    } else {
                        v.vibrate(ms);
                    }
                } catch (Exception ignored) {
                }
            });
        }

        @JavascriptInterface
        public void toast(final String msg) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> finish());
        }

        @JavascriptInterface
        public String platform() {
            return "android-" + Build.VERSION.SDK_INT;
        }
    }
}

