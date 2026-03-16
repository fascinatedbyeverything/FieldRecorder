// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "FieldRecorder",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .executable(name: "FieldRecorder", targets: ["FieldRecorder"])
    ],
    targets: [
        .executableTarget(
            name: "FieldRecorder",
            path: "Sources"
        ),
        .testTarget(
            name: "FieldRecorderTests",
            dependencies: ["FieldRecorder"]
        )
    ]
)
