import unittest

import lambda_function


class FakeRekognitionClient:
    def describe_project_versions(self, **kwargs):
        return {"ProjectVersionDescriptions": [{"Status": "RUNNING"}]}


class FacialRecognitionTests(unittest.TestCase):
    def test_check_model_status_returns_the_rekognition_status(self):
        original_client = lambda_function.rek_client
        lambda_function.rek_client = FakeRekognitionClient()
        try:
            status = lambda_function.check_model_status("model-arn", "version")
        finally:
            lambda_function.rek_client = original_client

        self.assertEqual(status, "RUNNING")

    def test_model_version_is_loaded_from_the_configured_model_arn(self):
        self.assertEqual(lambda_function.model_version, "pixelated-photos-labels.2025-03-16T02.42.08")


if __name__ == "__main__":
    unittest.main()