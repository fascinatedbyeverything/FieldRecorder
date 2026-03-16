import SwiftUI

struct StarRating: View {
    let rating: Int
    let onRate: (Int) -> Void

    var body: some View {
        HStack(spacing: 6) {
            ForEach(1...5, id: \.self) { star in
                Image(systemName: star <= rating ? "star.fill" : "star")
                    .font(.title2)
                    .foregroundStyle(star <= rating ? .yellow : .secondary)
                    .onTapGesture { onRate(star) }
            }
        }
    }
}
