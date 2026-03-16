import XCTest
@testable import FieldRecorder

final class FieldRecorderTests: XCTestCase {
    func testRecordingCoordinateRequiresLatitudeAndLongitude() {
        XCTAssertNil(makeRecording(lat: 44.6488, lng: nil).coordinate)
        XCTAssertNil(makeRecording(lat: nil, lng: -63.5752).coordinate)

        let coordinate = makeRecording(lat: 44.6488, lng: -63.5752).coordinate
        XCTAssertEqual(coordinate?.latitude, 44.6488)
        XCTAssertEqual(coordinate?.longitude, -63.5752)
    }

    func testRecordingFormattedDurationUsesMinutesAndSeconds() {
        XCTAssertEqual(makeRecording(duration: 125).formattedDuration, "2:05")
        XCTAssertEqual(makeRecording(duration: nil).formattedDuration, "")
    }

    func testSearchQuerySerializesExpectedAPIParameters() {
        var query = SearchQuery()
        query.q = "loon"
        query.lat = 44.6488
        query.lng = -63.5752
        query.type = "birds,urban"
        query.provider = "xeno-canto"
        query.radiusKm = 250
        query.minDuration = 300
        query.sort = "recorded_at"
        query.page = 2
        query.perPage = 10

        let items = Dictionary(uniqueKeysWithValues: query.queryItems.map { ($0.name, $0.value ?? "") })

        XCTAssertEqual(items["q"], "loon")
        XCTAssertEqual(items["lat"], "44.6488")
        XCTAssertEqual(items["lng"], "-63.5752")
        XCTAssertEqual(items["type"], "birds,urban")
        XCTAssertEqual(items["provider"], "xeno-canto")
        XCTAssertEqual(items["radius_km"], "250")
        XCTAssertEqual(items["min_duration"], "300")
        XCTAssertEqual(items["sort"], "recorded_at")
        XCTAssertEqual(items["page"], "2")
        XCTAssertEqual(items["per_page"], "10")
    }

    func testSearchQueryDefaultsMatchCurrentClientBehavior() {
        let query = SearchQuery()

        XCTAssertEqual(query.radiusKm, 100)
        XCTAssertEqual(query.minDuration, 60)
        XCTAssertEqual(query.sort, "duration")
        XCTAssertEqual(query.page, 1)
        XCTAssertEqual(query.perPage, 50)
    }

    func testSearchResultDecodesProviderMetadata() throws {
        let json = """
        {
          "recordings": [
            {
              "id": "abc123",
              "title": "Harbor birds",
              "provider": "xeno-canto",
              "lat": 44.6488,
              "lng": -63.5752,
              "duration_sec": 125,
              "tags": ["birds", "harbor"],
              "species": "Common loon",
              "license": "CC-BY",
              "stream_url": "/stream/xeno-canto/abc123",
              "thumbnail_url": null,
              "recorded_at": "2026-03-16T12:00:00Z"
            }
          ],
          "total": 1,
          "page": 1,
          "providers_queried": ["xeno-canto", "freesound"],
          "providers_failed": ["macaulay"]
        }
        """

        let result = try JSONDecoder().decode(SearchResult.self, from: Data(json.utf8))

        XCTAssertEqual(result.total, 1)
        XCTAssertEqual(result.recordings.first?.title, "Harbor birds")
        XCTAssertEqual(result.providers_queried, ["xeno-canto", "freesound"])
        XCTAssertEqual(result.providers_failed, ["macaulay"])
    }

    func testStreamURLsRespectConfiguredBaseURL() async {
        let client = APIClient(baseURL: URL(string: "https://example.com")!)
        let direct = await client.streamURL(provider: "xeno-canto", id: "abc123")
        let recordingURL = await client.streamURL(for: makeRecording(streamURL: "/stream/xeno-canto/abc123"))

        XCTAssertEqual(direct.absoluteString, "https://example.com/stream/xeno-canto/abc123")
        XCTAssertEqual(recordingURL.absoluteString, "https://example.com/stream/xeno-canto/abc123")
    }

    func testCuratedScenesPreserveKeyEntryPoints() {
        XCTAssertGreaterThanOrEqual(CuratedScene.all.count, 8)
        XCTAssertTrue(CuratedScene.all.contains(where: { $0.name == "Dawn Chorus" && $0.minDuration == 300 }))
        XCTAssertTrue(CuratedScene.all.contains(where: { $0.name == "Ocean Waves" && $0.icon == "water.waves" }))
    }

    private func makeRecording(
        lat: Double? = 44.6488,
        lng: Double? = -63.5752,
        duration: Double? = 125,
        streamURL: String = "/stream/xeno-canto/abc123"
    ) -> Recording {
        Recording(
            id: "abc123",
            title: "Harbor birds",
            provider: "xeno-canto",
            lat: lat,
            lng: lng,
            duration_sec: duration,
            tags: ["birds", "harbor"],
            species: "Common loon",
            license: "CC-BY",
            stream_url: streamURL,
            thumbnail_url: nil,
            recorded_at: "2026-03-16T12:00:00Z"
        )
    }
}
