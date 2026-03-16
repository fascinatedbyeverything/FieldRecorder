import Foundation
import CoreLocation

actor APIClient {
    static let shared = APIClient()
    static let defaultBaseURL = URL(string: "https://field-recordings-api.ashtarchris.workers.dev")!

    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder

    init(
        baseURL: URL = APIClient.defaultBaseURL,
        session: URLSession = .shared,
        decoder: JSONDecoder = JSONDecoder()
    ) {
        self.baseURL = baseURL
        self.session = session
        self.decoder = decoder
    }

    func search(_ query: SearchQuery) async throws -> SearchResult {
        var components = URLComponents(url: baseURL.appending(path: "search"), resolvingAgainstBaseURL: false)!
        components.queryItems = query.queryItems

        let (data, _) = try await session.data(from: components.url!)
        return try decoder.decode(SearchResult.self, from: data)
    }

    func streamURL(provider: String, id: String) -> URL {
        baseURL.appending(path: "stream/\(provider)/\(id)")
    }

    func streamURL(for recording: Recording) -> URL {
        URL(string: recording.stream_url, relativeTo: baseURL)!.absoluteURL
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
        let url = baseURL.appending(path: "upload")
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

        let (data, _) = try await session.data(for: request)
        return try decoder.decode(UploadResult.self, from: data)
    }

    func deleteRecording(id: String) async throws {
        let url = baseURL.appending(path: "upload/\(id)")
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        let _ = try await session.data(for: request)
    }

    func myRecordings() async throws -> [Recording] {
        let url = baseURL.appending(path: "my-recordings")
        let (data, _) = try await session.data(from: url)
        struct Response: Codable { let recordings: [Recording]; let total: Int }
        return try decoder.decode(Response.self, from: data).recordings
    }
}

struct UploadResult: Codable, Equatable, Sendable {
    let ok: Bool
    let id: String?
}
