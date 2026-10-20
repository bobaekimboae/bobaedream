package io.github.bobaekimboae.bobaedream;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String HOME = "https://bobaekimboae.github.io/bobaedream/?source=android-app";
    private static final int PICK_FILE = 42;
    private WebView web;
    private LinearLayout errorPanel;
    private ProgressBar progress;
    private ValueCallback<Uri[]> fileResult;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                android.graphics.Insets ime = insets.getInsets(WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
                return WindowInsets.CONSUMED;
            });
        } else {
            root.setFitsSystemWindows(true);
        }
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        root.addView(progress, new FrameLayout.LayoutParams(-1, dp(3), Gravity.TOP));
        createErrorPanel(root);
        setContentView(root);
        if (Build.VERSION.SDK_INT >= 30 && getWindow().getInsetsController() != null) {
            getWindow().getInsetsController().setSystemBarsAppearance(
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
        }
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0, this::navigateBack);
        }
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportMultipleWindows(false);
        CookieManager.getInstance().setAcceptCookie(true);
        // No JavaScript-to-native bridge or automatic camera/location permissions.
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!request.isForMainFrame()) return false;
                if (isInternal(uri)) return false;
                openExternal(uri);
                return true;
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap icon) {
                errorPanel.setVisibility(View.GONE);
                progress.setVisibility(View.VISIBLE);
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    errorPanel.setVisibility(View.VISIBLE);
                    progress.setVisibility(View.GONE);
                }
            }
            @Override public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int value) { progress.setProgress(value); }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileResult != null) fileResult.onReceiveValue(null);
                fileResult = callback;
                try {
                    startActivityForResult(Intent.createChooser(params.createIntent(), "파일 선택"), PICK_FILE);
                } catch (ActivityNotFoundException error) {
                    fileResult.onReceiveValue(null); fileResult = null;
                }
                return true;
            }
        });
        web.setDownloadListener((url, agent, disposition, mime, length) -> openExternal(Uri.parse(url)));
        if (state == null || web.restoreState(state) == null) web.loadUrl(HOME);
    }

    private boolean isInternal(Uri uri) {
        return "https".equals(uri.getScheme()) && "bobaekimboae.github.io".equals(uri.getHost())
            && uri.getPath() != null && uri.getPath().startsWith("/bobaedream/");
    }

    private void openExternal(Uri uri) {
        String scheme = uri.getScheme();
        if (!"https".equals(scheme) && !"mailto".equals(scheme) && !"tel".equals(scheme)) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); }
        catch (ActivityNotFoundException error) { Toast.makeText(this, "연결할 앱이 없습니다.", Toast.LENGTH_SHORT).show(); }
    }

    private void createErrorPanel(FrameLayout root) {
        errorPanel = new LinearLayout(this);
        errorPanel.setOrientation(LinearLayout.VERTICAL);
        errorPanel.setGravity(Gravity.CENTER);
        errorPanel.setPadding(dp(24), dp(24), dp(24), dp(24));
        errorPanel.setBackgroundColor(Color.WHITE);
        TextView title = new TextView(this);
        title.setText("보배드림"); title.setTextSize(26); title.setTextColor(Color.rgb(48, 107, 217));
        TextView message = new TextView(this);
        message.setText("인터넷 연결을 확인해 주세요."); message.setTextSize(16);
        message.setPadding(0, dp(16), 0, dp(24));
        Button retry = new Button(this);
        retry.setText("다시 시도");
        retry.setOnClickListener(view -> { errorPanel.setVisibility(View.GONE); web.loadUrl(HOME); });
        errorPanel.addView(title); errorPanel.addView(message); errorPanel.addView(retry);
        errorPanel.setVisibility(View.GONE);
        root.addView(errorPanel, new FrameLayout.LayoutParams(-1, -1));
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private void navigateBack() {
        if (isInternal(Uri.parse(web.getUrl() == null ? HOME : web.getUrl()))) {
            web.evaluateJavascript("!window.dispatchEvent(new Event('bbm-app-back',{cancelable:true}))", consumed -> {
                if (!"true".equals(consumed)) navigateDocumentBack();
            });
        } else navigateDocumentBack();
    }
    private void navigateDocumentBack() { if (web.canGoBack()) web.goBack(); else moveTaskToBack(true); }
    @Override public void onBackPressed() { navigateBack(); }
    @Override protected void onSaveInstanceState(Bundle state) { web.saveState(state); super.onSaveInstanceState(state); }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PICK_FILE && fileResult != null) {
            fileResult.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data)); fileResult = null;
        }
    }
    @Override protected void onPause() { web.onPause(); CookieManager.getInstance().flush(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() {
        if (fileResult != null) fileResult.onReceiveValue(null);
        web.destroy(); super.onDestroy();
    }
}
