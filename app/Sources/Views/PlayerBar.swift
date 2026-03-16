import SwiftUI

struct PlayerBar: View {
    @Environment(AppState.self) private var state

    var body: some View {
        VStack(spacing: 0) {
            // Seek bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.secondary.opacity(0.2))
                    Rectangle()
                        .fill(Color.accentColor)
                        .frame(width: geo.size.width * progress)
                }
                .frame(height: 4)
                .contentShape(Rectangle())
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { value in
                            let fraction = max(0, min(1, value.location.x / geo.size.width))
                            state.player.seek(to: fraction)
                        }
                )
            }
            .frame(height: 4)

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(state.player.currentRecording?.title ?? "")
                        .font(.callout.bold())
                        .lineLimit(1)
                    Text(state.player.currentRecording?.provider ?? "")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text(formatTime(state.player.currentTime))
                    .font(.caption.monospaced())
                    .foregroundStyle(.secondary)

                Button { state.player.togglePlayPause() } label: {
                    Image(systemName: state.player.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                        .font(.title)
                }
                .buttonStyle(.plain)

                Text(formatTime(state.player.duration))
                    .font(.caption.monospaced())
                    .foregroundStyle(.secondary)

                Button { state.player.stop() } label: {
                    Image(systemName: "xmark.circle")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
        .background(.ultraThinMaterial)
    }

    private var progress: Double {
        guard state.player.duration > 0 else { return 0 }
        return state.player.currentTime / state.player.duration
    }

    private func formatTime(_ seconds: Double) -> String {
        let m = Int(seconds) / 60
        let s = Int(seconds) % 60
        return String(format: "%d:%02d", m, s)
    }
}
