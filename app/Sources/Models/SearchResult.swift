import Foundation

struct SearchResult: Codable, Equatable, Sendable {
    let recordings: [Recording]
    let total: Int
    let page: Int
    let providers_queried: [String]
    let providers_failed: [String]
}

struct SearchQuery: Equatable, Sendable {
    var q: String = ""
    var lat: Double?
    var lng: Double?
    var radiusKm: Int = 100
    var type: String?
    var provider: String?
    var minDuration: Int = 60
    var sort: String = "duration"
    var page: Int = 1
    var perPage: Int = 50

    var queryItems: [URLQueryItem] {
        var items: [URLQueryItem] = []
        if !q.isEmpty { items.append(URLQueryItem(name: "q", value: q)) }
        if let lat { items.append(URLQueryItem(name: "lat", value: String(lat))) }
        if let lng { items.append(URLQueryItem(name: "lng", value: String(lng))) }
        items.append(URLQueryItem(name: "radius_km", value: String(radiusKm)))
        if let type { items.append(URLQueryItem(name: "type", value: type)) }
        if let provider { items.append(URLQueryItem(name: "provider", value: provider)) }
        items.append(URLQueryItem(name: "min_duration", value: String(minDuration)))
        items.append(URLQueryItem(name: "sort", value: sort))
        items.append(URLQueryItem(name: "page", value: String(page)))
        items.append(URLQueryItem(name: "per_page", value: String(perPage)))
        return items
    }
}
