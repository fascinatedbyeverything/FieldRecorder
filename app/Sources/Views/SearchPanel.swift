import SwiftUI
import MapKit

struct SearchPanel: View {
    @Environment(AppState.self) private var state

    var body: some View {
        @Bindable var state = state
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Curated Scenes
                Text("Explore")
                    .font(.title2.bold())

                FlowLayout(spacing: 8) {
                    ForEach(CuratedScene.all) { scene in
                        Button {
                            state.applyScene(scene)
                        } label: {
                            Label(scene.name, systemImage: scene.icon)
                                .font(.callout)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(Color.accentColor.opacity(0.12))
                                .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                }

                Divider()

                // Search
                Text("Search")
                    .font(.title3.bold())

                HStack {
                    TextField("whales, thunder, rain...", text: $state.searchText)
                        .font(.title3)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit { Task { await state.search() } }

                    Button { Task { await state.search() } } label: {
                        Image(systemName: "magnifyingglass")
                            .font(.title3)
                    }
                    .buttonStyle(.borderedProminent)
                }

                // Location
                Text("Location")
                    .font(.title3.bold())

                HStack {
                    TextField("City, country...", text: $state.locationText)
                        .font(.callout)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit { geocodeLocation() }

                    Button { geocodeLocation() } label: {
                        Image(systemName: "location.magnifyingglass")
                    }

                    Button {
                        state.locationManager.requestPermission()
                        state.locationManager.fetchLocation()
                        if let loc = state.locationManager.location {
                            state.searchPin = loc
                            state.searchQuery.lat = loc.latitude
                            state.searchQuery.lng = loc.longitude
                        }
                    } label: {
                        Image(systemName: "location.fill")
                    }
                }

                if let pin = state.searchPin {
                    Text(String(format: "%.2f, %.2f", pin.latitude, pin.longitude))
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Button("Clear pin") {
                        state.searchPin = nil
                        state.searchQuery.lat = nil
                        state.searchQuery.lng = nil
                    }
                    .font(.caption)
                }

                // Radius
                VStack(alignment: .leading) {
                    Text("Radius: \(state.searchQuery.radiusKm) km")
                        .font(.callout)
                    Slider(
                        value: Binding(
                            get: { Double(state.searchQuery.radiusKm) },
                            set: { state.searchQuery.radiusKm = Int($0) }
                        ),
                        in: 10...500,
                        step: 10
                    )
                }

                Divider()

                // Type
                Text("Type")
                    .font(.title3.bold())

                FilterChips(options: AppState.typeCategories, selected: $state.activeTypes)

                Divider()

                // Duration
                Text("Minimum Length")
                    .font(.title3.bold())

                HStack(spacing: 8) {
                    ForEach(AppState.durationOptions, id: \.1) { label, value in
                        Button {
                            state.searchQuery.minDuration = value
                        } label: {
                            Text(label)
                                .font(.callout)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(state.searchQuery.minDuration == value ? Color.accentColor : Color.secondary.opacity(0.15))
                                .foregroundStyle(state.searchQuery.minDuration == value ? .white : .primary)
                                .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                }

                Divider()

                // Search button
                Button {
                    Task { await state.search() }
                } label: {
                    HStack {
                        if state.isSearching {
                            ProgressView()
                                .controlSize(.small)
                        }
                        Text(state.isSearching ? "Searching..." : "Search")
                            .font(.title3.bold())
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(state.isSearching)

                // Results
                if let error = state.searchError {
                    Text(error)
                        .font(.callout)
                        .foregroundStyle(.red)
                }

                if !state.results.isEmpty {
                    HStack {
                        Text("\(state.totalResults) results")
                            .font(.title3.bold())
                        Spacer()
                        Text("from \(state.providersQueried.count) providers")
                            .font(.callout)
                            .foregroundStyle(.secondary)
                    }

                    if !state.providersFailed.isEmpty {
                        Text("Failed: \(state.providersFailed.joined(separator: ", "))")
                            .font(.caption)
                            .foregroundStyle(.orange)
                    }

                    LazyVStack(spacing: 0) {
                        ForEach(state.results) { recording in
                            RecordingCard(recording: recording) {
                                state.playRecording(recording)
                                state.showTrackDetail = true
                            }
                            Divider()
                        }
                    }
                }
            }
            .padding()
        }
    }

    private func geocodeLocation() {
        let geocoder = CLGeocoder()
        let text = state.locationText
        guard !text.isEmpty else { return }
        geocoder.geocodeAddressString(text) { placemarks, _ in
            if let loc = placemarks?.first?.location?.coordinate {
                state.searchPin = loc
                state.searchQuery.lat = loc.latitude
                state.searchQuery.lng = loc.longitude
            }
        }
    }
}
