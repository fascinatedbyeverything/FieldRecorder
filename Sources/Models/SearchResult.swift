import Foundation

struct SearchResult: Codable {
    let recordings: [Recording]
    let total: Int
    let page: Int
    let providers_queried: [String]
    let providers_failed: [String]
}

struct SearchQuery {
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
}
