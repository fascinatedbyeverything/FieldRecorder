import SwiftUI
import CoreLocation
import UniformTypeIdentifiers

struct UploadView: View {
    @Environment(AppState.self) private var state
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var species = ""
    @State private var tags = ""
    @State private var notes = ""
    @State private var recordedDate = Date()
    @State private var useDate = false
    @State private var lat = ""
    @State private var lng = ""
    @State private var selectedFile: URL?
    @State private var showFilePicker = false
    @State private var isUploading = false
    @State private var uploadError: String?
    @State private var uploadSuccess = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Audio File") {
                    Button {
                        showFilePicker = true
                    } label: {
                        HStack {
                            Image(systemName: "doc.badge.plus")
                            Text(selectedFile?.lastPathComponent ?? "Choose audio file...")
                                .foregroundStyle(selectedFile == nil ? .secondary : .primary)
                        }
                        .font(.title3)
                    }
                }

                Section("Details") {
                    TextField("Title", text: $title)
                        .font(.title3)
                    TextField("Species (optional)", text: $species)
                    TextField("Tags, comma separated", text: $tags)
                    TextField("Notes (optional)", text: $notes)
                }

                Section("Date") {
                    Toggle("Include date", isOn: $useDate)
                    if useDate {
                        DatePicker("Recorded", selection: $recordedDate, displayedComponents: .date)
                    }
                }

                Section("Location") {
                    TextField("Latitude", text: $lat)
                    TextField("Longitude", text: $lng)
                    if let pin = state.searchPin {
                        Button("Use map pin (\(String(format: "%.2f, %.2f", pin.latitude, pin.longitude)))") {
                            lat = String(pin.latitude)
                            lng = String(pin.longitude)
                        }
                    }
                    Button("Use current location") {
                        state.locationManager.requestPermission()
                        state.locationManager.fetchLocation()
                        if let loc = state.locationManager.location {
                            lat = String(loc.latitude)
                            lng = String(loc.longitude)
                        }
                    }
                }

                if let error = uploadError {
                    Section {
                        Text(error).foregroundStyle(.red)
                    }
                }

                if uploadSuccess {
                    Section {
                        Label("Upload successful!", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                            .font(.title3)
                    }
                }
            }
            .navigationTitle("Upload Recording")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Upload") {
                        uploadRecording()
                    }
                    .disabled(selectedFile == nil || title.isEmpty || isUploading)
                }
            }
            .fileImporter(
                isPresented: $showFilePicker,
                allowedContentTypes: [.audio, .mpeg4Audio, .wav, .mp3, .aiff],
                allowsMultipleSelection: false
            ) { result in
                if case .success(let urls) = result, let url = urls.first {
                    selectedFile = url
                    if title.isEmpty {
                        title = url.deletingPathExtension().lastPathComponent
                    }
                }
            }
        }
    }

    private func uploadRecording() {
        guard let fileURL = selectedFile else { return }
        isUploading = true
        uploadError = nil

        var location: CLLocationCoordinate2D?
        if let latVal = Double(lat), let lngVal = Double(lng) {
            location = CLLocationCoordinate2D(latitude: latVal, longitude: lngVal)
        }

        Task {
            do {
                let _ = try await state.api.upload(
                    fileURL: fileURL,
                    title: title,
                    species: species,
                    tags: tags,
                    notes: notes,
                    date: useDate ? recordedDate : nil,
                    location: location
                )
                uploadSuccess = true
                try? await Task.sleep(for: .seconds(1.5))
                dismiss()
            } catch {
                uploadError = error.localizedDescription
            }
            isUploading = false
        }
    }
}
