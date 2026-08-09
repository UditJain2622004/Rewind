import os
import json
import unittest
import shutil
from unittest.mock import AsyncMock, patch
from app.services.video_service import VideoService

# Adjust path to find app package
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class TestVideoService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.video_service = VideoService()
        
        # Keep track of old static folders to clean up or restore
        cls.test_static_dir = os.path.join(cls.video_service.base_dir, "backend", "static_test_temp")
        cls.old_static_dir = cls.video_service.static_dir
        cls.old_audio_dir = cls.video_service.audio_dir
        cls.old_output_json_path = cls.video_service.output_json_path

        # Override paths in service to use temp test paths
        cls.video_service.static_dir = cls.test_static_dir
        cls.video_service.audio_dir = os.path.join(cls.test_static_dir, "audio")
        cls.video_service.output_json_path = os.path.join(cls.test_static_dir, "tts_output.json")

    @classmethod
    def tearDownClass(cls):
        # Clean up temp test directory
        if os.path.exists(cls.test_static_dir):
            shutil.rmtree(cls.test_static_dir)

    def setUp(self):
        # Ensure clean state for each test
        if os.path.exists(self.test_static_dir):
            shutil.rmtree(self.test_static_dir)
        os.makedirs(self.test_static_dir, exist_ok=True)

    @patch("app.services.video_service.SarvamService.text_to_speech", new_callable=AsyncMock)
    async def async_test_assemble_relive(self, mock_tts):
        """Asynchronous test implementation for assemble_relive."""
        # Mock API response (fake base64 encoded string)
        mock_tts.return_value = ("dGVzdF9hdWRpb19kYXRh", "en-IN") # base64 of 'test_audio_data'
        
        # Run relive assembly
        result = await self.video_service.assemble_relive()
        
        # Check generated output
        self.assertIn("script_id", result)
        self.assertIn("audio_segments", result)
        self.assertGreater(len(result["audio_segments"]), 0)
        
        # Check files on disk
        self.assertTrue(os.path.exists(self.video_service.output_json_path))
        
        # Check each segment's audio exists
        for seg in result["audio_segments"]:
            filename = os.path.basename(seg["audio_url"])
            full_path = os.path.join(self.video_service.audio_dir, filename)
            self.assertTrue(os.path.exists(full_path))
            self.assertGreater(seg["duration_sec"], 0)

    def test_assemble_relive_runs(self):
        """Wrapper to run the async test in the event loop."""
        import asyncio
        asyncio.run(self.async_test_assemble_relive())

    def test_get_relive_data(self):
        """Test retrieving relive data combinations."""
        # Setup dummy file for tts_output
        dummy_output = {"script_id": "test", "audio_segments": []}
        with open(self.video_service.output_json_path, "w", encoding="utf-8") as f:
            json.dump(dummy_output, f)

        data = self.video_service.get_relive_data()
        
        self.assertIn("script", data)
        self.assertIn("assets_manifest", data)
        self.assertIn("tts_output", data)
        self.assertEqual(data["tts_output"]["script_id"], "test")

if __name__ == "__main__":
    unittest.main()
