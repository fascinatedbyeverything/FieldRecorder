import SwiftUI

struct RecordingCard: View {
    let recording: Recording
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(recording.title)
                        .font(.headline)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    Spacer()
                    if !recording.formattedDuration.isEmpty {
                        Text(recording.formattedDuration)
                            .font(.callout.monospaced())
                            .foregroundStyle(.secondary)
                    }
                }

                HStack(spacing: 8) {
                    ProviderBadge(name: recording.provider)
                    if let species = recording.species {
                        Text(species)
                            .font(.callout)
                            .italic()
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }

                if !recording.tags.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 4) {
                            ForEach(Array(recording.tags.prefix(6)), id: \.self) { tag in
                                Text(tag)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(Color.secondary.opacity(0.12))
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }
            }
            .padding(.vertical, 8)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
