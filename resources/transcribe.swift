#!/usr/bin/env swift

import Foundation
import Speech
import AVFoundation

// Request authorization
let semaphore = DispatchSemaphore(value: 0)
var authorized = false

SFSpeechRecognizer.requestAuthorization { status in
    authorized = (status == .authorized)
    semaphore.signal()
}
semaphore.wait()

guard authorized else {
    fputs("ERROR: Speech recognition not authorized\n", stderr)
    exit(1)
}

guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US")), recognizer.isAvailable else {
    fputs("ERROR: Speech recognizer not available\n", stderr)
    exit(1)
}

let audioEngine = AVAudioEngine()
let request = SFSpeechAudioBufferRecognitionRequest()
request.shouldReportPartialResults = true

let inputNode = audioEngine.inputNode
let recordingFormat = inputNode.outputFormat(forBus: 0)

inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
    request.append(buffer)
}

audioEngine.prepare()
do {
    try audioEngine.start()
} catch {
    fputs("ERROR: Could not start audio engine: \(error)\n", stderr)
    exit(1)
}

// Print "READY" so the parent process knows we're listening
print("READY", terminator: "\n")
fflush(stdout)

var lastTranscript = ""

let task = recognizer.recognitionTask(with: request) { result, error in
    if let result = result {
        let transcript = result.bestTranscription.formattedString
        if transcript != lastTranscript {
            lastTranscript = transcript
            // Print partial results prefixed with "PARTIAL:"
            print("PARTIAL:\(transcript)", terminator: "\n")
            fflush(stdout)
        }
        if result.isFinal {
            print("FINAL:\(transcript)", terminator: "\n")
            fflush(stdout)
            audioEngine.stop()
            inputNode.removeTap(onBus: 0)
            exit(0)
        }
    }
    if let error = error {
        fputs("ERROR: \(error.localizedDescription)\n", stderr)
        audioEngine.stop()
        inputNode.removeTap(onBus: 0)
        exit(1)
    }
}

// Wait for STOP on stdin to end recording
DispatchQueue.global().async {
    while let line = readLine() {
        if line.trimmingCharacters(in: .whitespacesAndNewlines) == "STOP" {
            request.endAudio()
            audioEngine.stop()
            inputNode.removeTap(onBus: 0)
            // Give recognition a moment to finalize
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                if !lastTranscript.isEmpty {
                    print("FINAL:\(lastTranscript)", terminator: "\n")
                    fflush(stdout)
                }
                exit(0)
            }
            break
        }
    }
}

RunLoop.main.run()
