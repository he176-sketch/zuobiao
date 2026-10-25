import SwiftUI

struct ExportedFile: Identifiable {
    let id = UUID()
    let url: URL
}

struct RootView: View {
    @State private var exportedFile: ExportedFile?
    @State private var loadError: String?
    @State private var reloadToken = UUID()
    @State private var loading = true
    @Environment(\.colorScheme) private var colorScheme

    private var paper: Color { colorScheme == .dark ? Color(red: 0.08, green: 0.10, blue: 0.10) : Color(red: 0.97, green: 0.96, blue: 0.93) }
    private var accent: Color { colorScheme == .dark ? Color(red: 0.55, green: 0.80, blue: 0.74) : Color(red: 0.16, green: 0.38, blue: 0.34) }

    var body: some View {
        ZStack {
            paper.ignoresSafeArea()

            ZuobiaoWebView(
                reloadToken: reloadToken,
                onDownload: { exportedFile = ExportedFile(url: $0) },
                onFailure: { loading = false; loadError = $0 },
                onLoading: { loading = $0 }
            )

            if loading && loadError == nil {
                VStack(spacing: 24) {
                    Image(systemName: "location.north.circle")
                        .font(.system(size: 48, weight: .ultraLight))
                        .foregroundStyle(accent)
                        .accessibilityHidden(true)
                    Text("坐标").font(.system(.largeTitle, design: .serif, weight: .regular))
                    Text("留一点时间，想清楚一件事。")
                        .font(.body).foregroundStyle(.secondary)
                    ProgressView("正在打开私人书房")
                        .font(.footnote).tint(accent).padding(.top, 16)
                }
                .padding(32)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(paper)
            }

            if let loadError {
                VStack(spacing: 18) {
                    Image(systemName: "location.north.circle")
                        .font(.system(size: 34, weight: .light))
                        .foregroundStyle(accent)
                    Text("暂时无法打开坐标")
                        .font(.system(.title3, design: .serif, weight: .medium))
                    Text(loadError)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Button("重新连接") {
                        self.loadError = nil
                        loading = true
                        reloadToken = UUID()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(accent)
                    .controlSize(.large)
                }
                .padding(28)
                .frame(maxWidth: 340)
                .background(paper, in: RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.primary.opacity(0.15), lineWidth: 1))
                .padding()
            }
        }
        .sheet(item: $exportedFile, onDismiss: {
            if let url = exportedFile?.url { try? FileManager.default.removeItem(at: url) }
        }) { file in
            ShareSheet(items: [file.url])
        }
    }
}

private struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
