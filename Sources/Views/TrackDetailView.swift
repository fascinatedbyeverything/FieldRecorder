import SwiftUI

struct TrackDetailView: View {
    let recording: Recording
    @Environment(AppState.self) private var state
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section {
                    DetailRow(label: "Provider", value: recording.provider)
                    if let species = recording.species {
                        DetailRow(label: "Species", value: species)
                    }
                    if !recording.formattedDuration.isEmpty {
                        DetailRow(label: "Duration", value: recording.formattedDuration)
                    }
                    DetailRow(label: "License", value: recording.license)
                    if let date = recording.recorded_at {
                        DetailRow(label: "Recorded", value: String(date.prefix(10)))
                    }
                    if let coord = recording.coordinate {
                        DetailRow(
                            label: "Location",
                            value: String(format: "%.2f, %.2f", coord.latitude, coord.longitude)
                        )
                    }
                }

                if !recording.tags.isEmpty {
                    Section("Tags") {
                        FlowLayout(spacing: 6) {
                            ForEach(recording.tags, id: \.self) { tag in
                                Text(tag)
                                    .font(.callout)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .background(Color.secondary.opacity(0.12))
                                    .clipShape(Capsule())
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }

                Section("Rating") {
                    StarRating(
                        rating: state.rating(for: recording.id),
                        onRate: { stars in state.setRating(stars, for: recording.id) }
                    )
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle(recording.title)
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Find Similar") {
                        state.findSimilar(to: recording)
                        dismiss()
                    }
                }
                #if os(iOS)
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                #endif
            }
        }
    }
}

private struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.callout)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.callout)
        }
    }
}
