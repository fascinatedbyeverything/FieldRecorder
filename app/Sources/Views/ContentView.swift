import SwiftUI

struct ContentView: View {
    @Environment(AppState.self) private var state

    var body: some View {
        @Bindable var state = state
        ZStack(alignment: .bottom) {
            #if os(macOS)
            NavigationSplitView {
                SearchPanel()
                    .frame(minWidth: 360, idealWidth: 420)
                    .toolbar {
                        ToolbarItem {
                            Button { state.showUpload = true } label: {
                                Image(systemName: "plus.circle")
                            }
                        }
                    }
            } detail: {
                RecordingMapView()
            }
            #else
            RecordingMapView()
                .ignoresSafeArea()

            VStack {
                Spacer()
                HStack {
                    Spacer()
                    VStack(spacing: 12) {
                        Button { state.showUpload = true } label: {
                            Image(systemName: "plus.circle.fill")
                                .font(.largeTitle)
                                .foregroundStyle(.white)
                                .shadow(radius: 4)
                        }
                        Button { state.showSearchPanel = true } label: {
                            Image(systemName: "line.3.horizontal.decrease.circle.fill")
                                .font(.largeTitle)
                                .foregroundStyle(.white)
                                .shadow(radius: 4)
                        }
                    }
                    .padding(.trailing, 16)
                    .padding(.bottom, state.player.currentRecording != nil ? 80 : 16)
                }
            }

            .sheet(isPresented: $state.showSearchPanel) {
                SearchPanel()
                    .presentationDetents([.medium, .large])
                    .presentationDragIndicator(.visible)
            }
            #endif

            // Player bar
            if state.player.currentRecording != nil {
                PlayerBar()
            }
        }
        .sheet(isPresented: $state.showTrackDetail) {
            if let recording = state.selectedRecording {
                TrackDetailView(recording: recording)
            }
        }
        .sheet(isPresented: $state.showUpload) {
            UploadView()
        }
    }
}
