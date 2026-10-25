import SwiftUI
@preconcurrency import WebKit

private let zuobiaoURL = URL(string: "https://zuobiao-life-philosophy.leeyuecheng2000.chatgpt.site/")!

struct ZuobiaoWebView: UIViewRepresentable {
    let reloadToken: UUID
    let onDownload: (URL) -> Void
    let onFailure: (String) -> Void
    let onLoading: (Bool) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onDownload: onDownload, onFailure: onFailure, onLoading: onLoading)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        webView.backgroundColor = .systemBackground
        context.coordinator.lastReloadToken = reloadToken
        webView.load(URLRequest(url: zuobiaoURL, cachePolicy: .reloadRevalidatingCacheData))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard context.coordinator.lastReloadToken != reloadToken else { return }
        context.coordinator.lastReloadToken = reloadToken
        webView.load(URLRequest(url: zuobiaoURL, cachePolicy: .reloadRevalidatingCacheData))
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
        var lastReloadToken: UUID?
        private let onDownload: (URL) -> Void
        private let onFailure: (String) -> Void

        private let onLoading: (Bool) -> Void

        init(onDownload: @escaping (URL) -> Void, onFailure: @escaping (String) -> Void, onLoading: @escaping (Bool) -> Void) {
            self.onLoading = onLoading
            self.onDownload = onDownload
            self.onFailure = onFailure
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            onLoading(false)
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if navigationAction.targetFrame == nil, let requestURL = navigationAction.request.url {
                webView.load(URLRequest(url: requestURL))
            }
            return nil
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            if navigationAction.shouldPerformDownload {
                decisionHandler(.download)
                return
            }
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }
            if ["http", "https", "about", "blob"].contains(url.scheme?.lowercased() ?? "") {
                decisionHandler(.allow)
            } else {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
            }
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationResponse: WKNavigationResponse,
            decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void
        ) {
            decisionHandler(navigationResponse.canShowMIMEType ? .allow : .download)
        }

        func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
            download.delegate = self
        }

        func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
            download.delegate = self
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            let nsError = error as NSError
            guard nsError.code != NSURLErrorCancelled else { return }
            onFailure("请检查网络后再试。")
        }

        func download(
            _ download: WKDownload,
            decideDestinationUsing response: URLResponse,
            suggestedFilename: String,
            completionHandler: @escaping (URL?) -> Void
        ) {
            let safeName = suggestedFilename.replacingOccurrences(of: "/", with: "-")
            let destination = FileManager.default.temporaryDirectory
                .appendingPathComponent("\(UUID().uuidString)-\(safeName)")
            completionHandler(destination)
        }

        func downloadDidFinish(_ download: WKDownload) {
            guard let fileURL = download.progress.fileURL else { return }
            DispatchQueue.main.async { self.onDownload(fileURL) }
        }

        func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
            DispatchQueue.main.async { self.onFailure("导出没有完成，请重新打开导出入口。") }
        }
    }
}
