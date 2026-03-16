import SwiftUI

struct ProviderBadge: View {
    let name: String

    private var color: Color {
        switch name {
        case "xenocanto": .green
        case "freesound": .orange
        case "inaturalist": .mint
        case "gbif": .purple
        case "macaulay": .blue
        case "aporee": .pink
        case "internetarchive": .brown
        case "wikimedia": .cyan
        case "europeana": .indigo
        case "birdweather": .teal
        case "user": .red
        default: .gray
        }
    }

    var body: some View {
        Text(name)
            .font(.caption.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.2))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }
}
