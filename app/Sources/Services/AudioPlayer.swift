import AVFoundation
import Combine

@Observable
final class AudioPlayer {
    var isPlaying = false
    var currentTime: Double = 0
    var duration: Double = 0
    var currentRecording: Recording?

    private var player: AVPlayer?
    private var timeObserver: Any?
    private var statusObserver: NSKeyValueObservation?

    func play(_ recording: Recording) {
        stop()
        currentRecording = recording

        #if os(iOS)
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
        try? AVAudioSession.sharedInstance().setActive(true)
        #endif

        let url = URL(string: "\(APIClient.defaultBaseURL.absoluteString)\(recording.stream_url)")!
        let item = AVPlayerItem(url: url)
        player = AVPlayer(playerItem: item)

        statusObserver = item.observe(\.status) { [weak self] item, _ in
            if item.status == .readyToPlay {
                Task { @MainActor in
                    self?.duration = item.duration.seconds.isFinite ? item.duration.seconds : 0
                }
            }
        }

        timeObserver = player?.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.5, preferredTimescale: 600),
            queue: .main
        ) { [weak self] time in
            self?.currentTime = time.seconds.isFinite ? time.seconds : 0
        }

        player?.play()
        isPlaying = true
    }

    func togglePlayPause() {
        guard let player else { return }
        if isPlaying {
            player.pause()
        } else {
            player.play()
        }
        isPlaying.toggle()
    }

    func seek(to fraction: Double) {
        guard let player, duration > 0 else { return }
        let target = CMTime(seconds: fraction * duration, preferredTimescale: 600)
        player.seek(to: target)
    }

    func stop() {
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
        }
        timeObserver = nil
        statusObserver = nil
        player?.pause()
        player = nil
        isPlaying = false
        currentTime = 0
        duration = 0
        currentRecording = nil
    }
}
