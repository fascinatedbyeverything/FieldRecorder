import Foundation
import CoreLocation

struct Recording: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let title: String
    let provider: String
    let lat: Double?
    let lng: Double?
    let duration_sec: Double?
    let tags: [String]
    let species: String?
    let license: String
    let stream_url: String
    let thumbnail_url: String?
    let recorded_at: String?

    var coordinate: CLLocationCoordinate2D? {
        guard let lat, let lng else { return nil }
        return CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }

    var formattedDuration: String {
        guard let d = duration_sec else { return "" }
        let m = Int(d) / 60
        let s = Int(d) % 60
        return String(format: "%d:%02d", m, s)
    }

    func hash(into hasher: inout Hasher) { hasher.combine(id) }
    static func == (lhs: Recording, rhs: Recording) -> Bool { lhs.id == rhs.id }
}
