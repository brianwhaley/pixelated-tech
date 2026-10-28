import os
import sys
import unittest
from unittest.mock import patch


sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

with patch.dict(os.environ, {"DYNDNS_USERNAME": "test-user", "DYNDNS_PASSWORD": "test-password"}):
    import lambda_function


class Dyndns53Tests(unittest.TestCase):
    def test_parse_ip_accepts_a_valid_ipv4_address(self):
        self.assertEqual(lambda_function._parse_ip("192.0.2.10"), "192.0.2.10")

    def test_parse_ip_rejects_an_invalid_ipv4_address(self):
        with self.assertRaises(lambda_function.BadAgentException):
            lambda_function._parse_ip("999.0.2.10")


if __name__ == "__main__":
    unittest.main()