import Foundation

struct CuratedScene: Identifiable {
    let id = UUID()
    let name: String
    let query: String
    let minDuration: Int
    let icon: String

    static let all: [CuratedScene] = [
        CuratedScene(name: "Amazon Rainforest", query: "rainforest ambient", minDuration: 300, icon: "leaf.fill"),
        CuratedScene(name: "Ocean Waves", query: "ocean waves", minDuration: 300, icon: "water.waves"),
        CuratedScene(name: "Whale Song", query: "whale song", minDuration: 60, icon: "fish.fill"),
        CuratedScene(name: "Thunderstorm", query: "thunderstorm rain", minDuration: 120, icon: "cloud.bolt.rain.fill"),
        CuratedScene(name: "Dawn Chorus", query: "dawn chorus birds", minDuration: 300, icon: "sunrise.fill"),
        CuratedScene(name: "Forest at Night", query: "night forest insects", minDuration: 300, icon: "moon.stars.fill"),
        CuratedScene(name: "River & Streams", query: "river stream water", minDuration: 120, icon: "drop.fill"),
        CuratedScene(name: "Desert Wind", query: "wind desert", minDuration: 60, icon: "wind"),
        CuratedScene(name: "City Streets", query: "city street urban", minDuration: 120, icon: "building.2.fill"),
        CuratedScene(name: "Deep Ocean", query: "deep ocean underwater", minDuration: 120, icon: "circle.hexagongrid.fill"),
        CuratedScene(name: "Arctic", query: "arctic ice", minDuration: 60, icon: "snowflake"),
        CuratedScene(name: "Campfire", query: "campfire crackling fire", minDuration: 120, icon: "flame.fill"),
    ]
}
