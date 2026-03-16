import Foundation
import CoreLocation

actor APIClient {
    static let shared = APIClient()
    static let baseURL = "https://field-recordings-api.ashtarchris.workers.dev"
    private let decoder = JSONDecoder()

    func search(_ query: SearchQuery) async throws -> SearchResult {
        var components = URLComponents(string: "\(Self.baseURL)/search")!
        var items: [URLQueryItem] = []
        if !query.q.isEmpty { items.append(URLQueryItem(name: "q", value: query.q)) }
        if let lat = query.lat { items.append(URLQueryItem(name: "lat", value: String(lat))) }
        if let lng = query.lng { items.append(URLQueryItem(name: "lng", value: String(lng))) }
        items.append(URLQueryItem(name: "radius_km", value: String(query.radiusKm)))
        if let type = query.type { items.append(URLQueryItem(name: "type", value: type)) }
        if let provider = query.provider { items.append(URLQueryItem(name: "provider", value: provider)) }
        items.append(URLQueryItem(name: "min_duration", value: String(query.minDuration)))
        items.append(URLQueryItem(name: "sort", value: query.sort))
        items.append(URLQueryItem(name: "page", value: String(query.page)))
        items.append(URLQueryItem(name: "per_page", value: String(query.perPage)))
        components.queryItems = items

        let (data, _) = try await URLSession.shared.data(from: components.url!)
        return try decoder.decode(SearchResult.self, from: data)
    }

    func streamURL(provider: String, id: String) -> URL {
        URL(string: "\(Self.baseURL)/stream/\(provider)/\(id)")!
    }

    func streamURL(for recording: Recording) -> URL {
        URL(string: "\(Self.baseURL)\(recording.stream_url)")!
    }

    func upload(
        fileURL: URL,
        title: String,
        species: String,
        tags: String,
        notes: String,
        date: Date?,
        location: CLLocationCoordinate2D?
    ) async throws -> UploadResult {
        let url = URL(string: "\(Self.baseURL)/upload")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"

        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        let fileData = try Data(contentsOf: fileURL)
        let filename = fileURL.lastPathComponent
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"audio\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: audio/mp4\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n".data(using: .utf8)!)

        func addField(_ name: String, _ value: String) {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(value)\r\n".data(using: .utf8)!)
        }

        addField("title", title)
        if !species.isEmpty { addField("species", species) }
        if !tags.isEmpty { addField("tags", tags) }
        if !notes.isEmpty { addField("notes", notes) }
        if let date {
            addField("recorded_at", ISO8601DateFormatter().string(from: date))
        }
        if let loc = location {
            addField("lat", String(loc.latitude))
            addField("lng", String(loc.longitude))
        }

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        let (data, _) = try await URLSession.shared.data(for: request)
        return try decoder.decode(UploadResult.self, from: data)
    }

    func deleteRecording(id: String) async throws {
        let url = URL(string: "\(Self.baseURL)/upload/\(id)")!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        let _ = try await URLSession.shared.data(for: request)
    }

    func myRecordings() async throws -> [Recording] {
        let url = URL(string: "\(Self.baseURL)/my-recordings")!
        let (data, _) = try await URLSession.shared.data(from: url)
        struct Response: Codable { let recordings: [Recording]; let total: Int }
        return try decoder.decode(Response.self, from: data).recordings
    }
}

struct UploadResult: Codable {
    let ok: Bool
    let id: String?
}
