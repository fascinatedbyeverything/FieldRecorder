import SwiftUI
import MapKit

struct RecordingMapView: View {
    @Environment(AppState.self) private var state

    var body: some View {
        @Bindable var state = state
        MapReader { proxy in
            Map(position: $state.mapPosition) {
                // Search pin
                if let pin = state.searchPin {
                    Annotation("Search", coordinate: pin) {
                        Image(systemName: "mappin.circle.fill")
                            .font(.title)
                            .foregroundStyle(.red)
                    }

                    MapCircle(center: pin, radius: CLLocationDistance(state.searchQuery.radiusKm * 1000))
                        .foregroundStyle(.blue.opacity(0.08))
                        .stroke(.blue.opacity(0.4), lineWidth: 1.5)
                }

                // Recording markers
                ForEach(recordingsWithCoordinates) { recording in
                    Annotation(recording.title, coordinate: recording.coordinate!) {
                        RecordingMarker(
                            recording: recording,
                            isPlaying: state.player.currentRecording?.id == recording.id
                        )
                        .onTapGesture {
                            state.playRecording(recording)
                            state.showTrackDetail = true
                        }
                    }
                }
            }
            .mapStyle(.imagery(elevation: .realistic))
            .onTapGesture { location in
                if let coord = proxy.convert(location, from: .local) {
                    state.searchPin = coord
                    state.searchQuery.lat = coord.latitude
                    state.searchQuery.lng = coord.longitude
                }
            }
        }
    }

    private var recordingsWithCoordinates: [Recording] {
        results(limit: 200)
    }

    private func results(limit: Int) -> [Recording] {
        Array(state.results.filter { $0.coordinate != nil }.prefix(limit))
    }
}

private struct RecordingMarker: View {
    let recording: Recording
    let isPlaying: Bool

    var body: some View {
        ZStack {
            Circle()
                .fill(isPlaying ? Color.accentColor : Color.white)
                .frame(width: 28, height: 28)
                .shadow(radius: 2)
            Image(systemName: isPlaying ? "waveform" : "music.note")
                .font(.caption.bold())
                .foregroundStyle(isPlaying ? .white : .accentColor)
        }
    }
}
