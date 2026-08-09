import os
import json
import unittest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

# Adjust path to find app package
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.routes.tts import MOOD_TTS_MAP

class TestScriptTTS(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Resolve path to script.json dynamically
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        cls.script_path = os.path.join(base_dir, "script.json")
        
        # Load script file contents
        with open(cls.script_path, "r", encoding="utf-8") as f:
            cls.script_data = json.load(f)

        cls.client = TestClient(app)

    def test_script_loading(self):
        """Verify that script.json exists and loads correctly."""
        self.assertIn("script_id", self.script_data)
        self.assertIn("segments", self.script_data)
        self.assertGreater(len(self.script_data["segments"]), 0)

    @patch("app.routes.tts.sarvam_service.text_to_speech", new_callable=AsyncMock)
    def test_mock_tts_processing_for_all_segments(self, mock_tts):
        """
        Verify that for every segment in script.json, the route processes the text,
        maps the mood correctly to pace/temperature, and forwards it to the service.
        """
        # Configure mock to return a fake base64 audio and a detected language
        mock_tts.return_value = ("dGVzdF9hdWRpb19kYXRh", "en-IN") # "test_audio_data" in base64
        
        speaker = self.script_data.get("speaker", "sumit")
        
        for segment in self.script_data["segments"]:
            segment_id = segment["segment_id"]
            narration_text = segment["narration_text"]
            mood = segment["mood"]
            
            # 1. Look up expected mapped parameters
            expected_params = MOOD_TTS_MAP.get(mood.lower(), {"pace": 1.0, "temperature": 1.0})
            expected_pace = expected_params["pace"]
            expected_temp = expected_params["temperature"]

            # 2. Call endpoint (base64 mode to test response payload format)
            request_payload = {
                "text": narration_text,
                "speaker": speaker,
                "mood": mood,
                "output_format": "base64"
            }
            
            response = self.client.post("/api/text-to-speech", json=request_payload)
            self.assertEqual(response.status_code, 200, f"Failed for segment: {segment_id}")
            
            data = response.json()
            self.assertIn("audio_base64", data)
            self.assertEqual(data["detected_language"], "en-IN")
            self.assertEqual(data["format"], "audio/wav")

            # Verify that the service was called with the mapped parameters
            mock_tts.assert_called_with(
                text=narration_text,
                speaker=speaker,
                pace=expected_pace,
                temperature=expected_temp,
                speech_sample_rate=24000
            )

    @patch("app.routes.tts.sarvam_service.text_to_speech", new_callable=AsyncMock)
    def test_binary_output_format(self, mock_tts):
        """Verify binary output format returns the decoded raw bytes correctly."""
        mock_tts.return_value = ("dGVzdF9hdWRpb19kYXRh", "en-IN") # "test_audio_data" in base64
        
        request_payload = {
            "text": "Hello world",
            "speaker": "sumit",
            "mood": "excited",
            "output_format": "binary"
        }
        
        response = self.client.post("/api/text-to-speech", json=request_payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "audio/wav")
        self.assertEqual(response.headers["x-detected-language"], "en-IN")
        self.assertEqual(response.content, b"test_audio_data")

    def test_validation_errors(self):
        """Test payload parameter bounds and validations."""
        # Test text length limit
        response = self.client.post("/api/text-to-speech", json={"text": "a" * 2501})
        self.assertEqual(response.status_code, 422)

        # Test invalid pace bounds
        response = self.client.post("/api/text-to-speech", json={"text": "Hello", "pace": 2.5})
        self.assertEqual(response.status_code, 422)

        # Test invalid sample rate
        response = self.client.post("/api/text-to-speech", json={"text": "Hello", "speech_sample_rate": 999})
        self.assertEqual(response.status_code, 422)

if __name__ == "__main__":
    unittest.main()
